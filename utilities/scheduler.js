const fs = require('fs');
const discord = require('discord.js');
const auth = require('../secrets.json');

// 1. function that is called when event occurs (created event embed, send accounting for channel), "deletes" its timeout and set Timeout for next (with monthly logic)
// 2. read from events "database" and setTimout for the events (with monthly logic) (account for duplicates, and cull events which have passed and don't repeat) rewrite updated events back (json).
// 3. when new event is set write into "Database"

// error handling:throw error back to command file
//      same throw risk as fs sync functions


// should there be an ignoreList to disallow spamming?
//      scheduler can make:
// visible events (listed publicly, sends to guild)
// hidden events (does not list, sends to guild)
// hidden private events (does not list, sends to DMs)
// visible* private events, (listed publicly, sends to DMs)

// How to Handle mentions?
// we need user.id, if in a guild we can make then @username and grab it
// if in DM they can't @username so we would have to grab it from the cache
//      but thats not guarenteed to have all users

module.exports = {
    // this adds the timeout to the client (always a normal timeout)
    // timeout calls procEvent which will set _destroyed (no _repeat)
    // mutually call createTimeout if repeat is desired calculating interval required for monthly repeat
    createEmbed: function (eventArgs) {
        const embed = new discord.MessageEmbed()
        if (eventArgs.name) embed.setTitle(eventArgs.name);
        embed.setTimestamp();
        if (eventArgs.authorName) embed.setFooter(`#${eventArgs.versary} • ${eventArgs.authorName}`);
        if (eventArgs.attachmentURL) embed.setImage(eventArgs.attachmentURL);
        if (eventArgs.message) embed.setDescription(eventArgs.mentions.join(' ') + '\n' + eventArgs.message);
        
        if (!embed) {
            console.log("Embed became falsy");
        }
        return embed;
    },
    procEvent: function (client, eventArgs) {
        // we want to send this event and then...
        //console.log("proc is happening?");
        //console.log(client.user.username);
        //console.log(eventArgs);
        if (!eventArgs) {
            console.error("no eventArgs?");
            return;
        }

        const sched = require('./scheduler.js');
        const embed = sched.createEmbed(eventArgs);
        if (!embed) {
            console.error("embed failed in proc");
            return 1;
        }
        if (eventArgs.channelType == 'text') {
            const chan = client.channels.cache.find(c => c.type == 'text' && c.name == eventArgs.channelName);
            if (!chan) {
                console.error("failed to find text cahnnel");
                return 1;
            }
            chan.send(embed); // thats it?
        } else if (eventArgs.channelType == 'dm') {
            for (let m of eventArgs.mentions) {
                // can be of form ..., @..., or <@...>
                //use cache to get object -> dmChannel
                let dmChan = null;
                if (m.startsWith('@')) {
                    dmChan = client.users.cache.find(u => u.username == m.slice(1)).dmChannel;
                } else if (m.startsWith('<@') && m.endsWith('>')) {
                    let UID = m.slice(2, -1);
                    // acount for nickname ! (regex?)
                    if (UID.startsWith('!'))
                        UID = UID.slice(1);
                    dmChan = client.users.cache.find(u => u.id == UID).dmChannel;
                } else { // just name
                    dmChan = client.users.cache.find(u => u.username == m).dmChannel;
                }
                
                if (dmChan) dmChan.send(embed);
                else console.error("Failed to find DM channel");
            }
        } else {
            // something weird happened
        }
        // ... we want to setup the next one with createTimeout()
        // only if it repeats, otherwise we want to delete this
        return sched.eventComplete(client, eventArgs);
    },
    // called only when event has just proc'd, either finds and sets for deletion
    // or increments .versary and calls createTimeoutSync
    eventComplete: function (client, eventArgs) {
        // could also check for a maximum repeat number here
        const interval = this.parseRepeatCode(eventArgs.repeatCode);
        var eventTimeout = null;
        for (let t of client._timeouts) {
            if (t._eventArgs && t._eventArgs.name == eventArgs.name) {
                eventTimeout = t;
                break;
            }
        }
        if (!eventTimeout) {
            return console.log("There was no timer to complete for this event");
        }
        if (interval.months || interval.days || interval.hours) {
            eventArgs.versary += 1;
            this.createTimeoutSync(client, eventArgs);
            this.backupDB(client); //backup after create
            return;
        } else {
            eventTimeout._destroyed = true; // good enough?
            client._timeouts.delete(eventTimeout);
            // restoreDB should ignore this finished event (and clean it out)
        }
    },
    createTimeoutSync: function (client, eventArgs) {
        // throw error on bad startDate, bad channelName
        // repeated validation from schedule.js
        console.log("creating event!");

        let eventDate = Date.parse(eventArgs.startDate);
        if (!eventDate) throw { message: 'I did not understand the given time. Format is \"01 Jan 2020 12:30:00 EST\""' };
        if (eventArgs.channelType == 'text' && !client.channels.cache.includes(c => c.type == 'text' && c.name == eventArgs.channelName)) {
            throw { message: `Could not find the channel ${eventArgs.channelName} in any servers, make sure it is spelled correctly (case sensitive) and BotRat is in the relevant server` };
        }
        
        // _idleTimeout should take versary into account
        eventDate = this.addRepeatCodeToDate(eventDate, eventArgs.repeatCode, eventArgs.versary);

        if (eventDate - Date.now() <= 0) {
            return;
        }

        //update client (backups is responsability of caller)
        let to = setTimeout(this.procEvent, eventDate - Date.now(), client, eventArgs);
        to._eventArgs = eventArgs;
        client._timeouts.add(to);
        //console.log(client._timeouts);
        // DO NOT Backup here becuase this is called seuqentially during restore
    },
    // give all available to this user/public, they will filter based on message/chan
    listEventsSync: function (client, user = null) {
        // check channelType(dm/text), type(event/message)
        //i can read this from client instead of DB, assuming they are in lockstep
        var events = [];
        for (let t of client._timeouts) {
            if (!t._eventArgs || !t._eventArgs.name) continue;
            if (t._eventArgs.type == 'message' && (!user || t._eventArgs.authorID != user.id)) continue;
            // account for mentions formats? ..., @..., <@!?...>
            if (t._eventArgs.channelType == 'dm' && !user && t._eventArgs.authorID != user.id && (!user || !t._eventArgs.mentions.includes(m => m.includes(user.username) || m.includes(user.id)))) continue;
            events.push(t._eventArgs);
        }
        return events;
    },
    getEventSync: function (client, eventStr, user = null) {
        // only return dm if user is author or is mentioned
        // i can read this from client instead of DB, assuming they are in lockstep
        // ignores private rules
        var evt = null;
        for (let t of client._timeouts) {
            if (t._eventArgs && t._eventArgs.name == eventStr) {
                evt = t._eventArgs;
                break;
            }
        }
        // if no event or its someone elses message, or its a dm and your not author.included
        if (!evt || 
            (evt.type == 'message' && (!user || evt.authorID != user.id)) ||
            (evt.channelType == 'dm' && (!user || evt.authorID != user.id || !evt.mentions.includes(m => m.includes(user.username) || m.includes(user.id))))) {
                throw { message: "Could not get event" };
            }
        return evt;
    },
    deleteEventSync: function (client, eventStr, user) {
        // only allow if user is admin or author
        // update in client and backup to DB
        var evt = null;
        for (let t of client._timeouts) {
            if (t._eventArgs && t._eventArgs.name == eventStr) {
                evt = t._eventArgs;
                break;
            }
        }
        if (!evt || (!auth.ADMIN_IDS.includes(user.id) && evt.authorID != user.id)) {
            throw { message: "Could not delete that event (only the creator can)" };
        }
        client._timeouts.delete(evt);
        this.backupDB(client);
            
    },
    includeUserSync: function (client, eventStr, user) {
        // always allow? (you need to have known the name)
        // security risk? you can scan for events
        // update in client, backup to DB
        var evt = null;
        for (let t of client._timeouts) {
            if (t._eventArgs && t._eventArgs.name == eventStr) {
                evt = t._eventArgs;
                break;
            }
        }
        if (!evt) {
            throw { message: "Could not add you" };
        }
        // if not added, includes self and update
        if (!evt.mentions.includes(m => m.includes(user.username) || m.includes(user.id))) {
            evt.mentions.push(`<@${user.id}`);
            this.backupDB(client);
        }
        return true;
    },
    removeUserSync: function (client, eventStr, user) {
        // always allow self
        // update in client, backup to DB
        var evt = null;
        for (let t of client._timeouts) {
            if (t._eventArgs && t._eventArgs.name == eventStr) {
                evt = t._eventArgs;
                break;
            }
        }
        if (!evt) {
            throw { message: "Could not remove you" };
        }
        let mention = evt.mentions.find(m => m.includes(user.username) || m.includes(user.id));
        if (!mention) {
            throw { message: "Could not remove you" }; // is there a better control flow?
        }
        
        evt.mentions.delete(mention);
        this.backupDB(client);

        return true;
    },
    parseRepeatCode: function (code) {
        let months = 0;
        let days = 0;
        let hours = 0;
        try {
            let codes = code.split('/');
            if (code.length > 1) {
                // MM/DD or MM/DD:HH
                months = parseInt(codes[0].trim());
                codes = codes[1].split(':');
                days = parseInt(codes[0].trim());
                if (codes[1]) {
                    hours = parseInt(codes[1].trim());
                }
            } else { 
                // MM or DD:HH
                codes = codes[0].split(':');
                if (codes[1]) {
                    days = parseInt(codes[0].trim());
                    hours = parseInt(codes[1].trim());
                } else {
                    months = parseInt(codes[0].trim());
                }
            }

            if (isNaN(months + days + hours) || months + days + hours <= 0) {
                throw "malformed string/ no repeat";
            }
        } catch (e) {
            months = 0;
            days = 0;
            hours = 0;
        }
        return { 
            months: months,
            days: days, 
            hours: hours
        };
    },
    addRepeatCodeToDate: function (d, code, iterations) {
        let interval = this.parseRepeatCode(code);
        if (interval.months || interval.days || interval.hours) {
            // mutate 
            // Validate this month adding is correct??
            for (let i = 0; i < iterations; i++) { // initially this will always be 0
                d.setMonth(d.getMonth() + interval.months);
                d.setDate(d.getDate() + interval.days);
                d.setHour(d.getHour() + interval.hours);
            }
        }
        return d;
    },
    //overwrite DB with client
    backupDB: function (client) {
        // write to "DB"
        var DB = [];
        for (let t of client._timeouts) {
            if (!t._eventArgs || !t._eventArgs.name) continue;
            DB.push(t._eventArgs);
        }
        try {
            fs.writeFileSync('database/events.json', JSON.stringify(DB));
        } catch (e) {
            throw { message: "Could not write to database" };
        }
    },
    // overwrite client with DB
    restoreDB: function (client) {
        var DB;
        try {
            DB = JSON.parse(fs.readFileSync('database/events.json'));
        } catch (e) {
            // if this fails... wipe the DB LOL!
            throw { message: "Could not read from database" };
        }
        for (let eventArgs of DB) {
            // if event has passed and it wasn't incremented (no repeat)
            if (eventArgs.startDate < Date.now() && eventArgs.versary == 0) continue;
            this.createTimeoutSync(client, eventArgs);
        }
    }
}

//const events = new Set([...(msg.client._timeouts), ...(msg.client._intervals)]);