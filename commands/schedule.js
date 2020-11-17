/*
// This should probably be set in a database.. that is loaded on bot start, and updated when timouts happen to ensure events aren't lost over restarts... use json file for now?
// important timer properties
_idleTimeout (Int)
_repeat (null || Int) // in case of monthly repeat this always null?
_onTimeout (Function) // make static
_destroyed (boolean) //no repeat and set this true should clear event?
_timerArgs // IGNORE THIS
_eventArgs // where our custom data goes

//example _eventArgs object:
_eventArgs =
{
    name: "I Love Mondays",
    authorID: '1112352456753332',
    startDate: '01 Jan 1970 00:00:00 GMT',
    versary: 0,
    repeatobj: {monrths: 0, days: 0, ...}
    channelID: '268209621724823554', // if this is 'dm' use mentions
    mentions: ['183531047416233984', '165625043601195018'], 
    message: "Back on the worksite no more nagging wife",
    attachmentURL: './resources/monday.jpg',
}
*/

// use scheduler utility to send client, and set/get event data
// scheduler will handle timouts logic without handling it here
// main.js will also use it to load events on startup
const handler = require('../utilities/scheduler.js');
const discord = require('discord.js');
const URL = require("url").URL;

module.exports = {
    name: 'schedule',
    aliases: ['plan', 'alert', 'reminder'],
    description: 'Sets and gets timed events/messages for BotRat to notify users. You can DM this command to me to set an event/message in secret, also use channel: "dm" to DM the event to all participants when it happens. "Events" are publicly listed (or listed to those the DM includes) once created, while "Messages" are not listed for anyone but the sender.',
    usage: '\nschedule list <mine/withme>* \n' +
    '| info <EVENT/MESSAGE NAME> \n' + 
    '| signup <EVENT NAME> \n' + 
    '| removeme <EVENT NAME> \n' + 
    '| delete <EVENT/MESSAGE NAME> \n' + 
    '| event <EVENT NAME> on <DATE> (at <TIME>)* (every <X YEARS/MONTHS/DAYS/HOURS>)* (in <CHANNEL/dm>)* (saying <MESSAGE>)* (showing <ATTACHMENT URL>)* (with <PARTICIPANT1, PARTICIPANT2,...>)*\n' +
    '| message <MESSAGE NAME> on <DATE> (at <TIME>)* (every <X YEARS/MONTHS/DAYS/HOURS>)* (in <CHANNEL/dm>)* (saying <MESSAGE>)* (showing <ATTACHMENT URL>)* (to <PARTICIPANT1, PARTICIPANT2,...>)*\n',
    example: '@Botrat schedule event "Monday Morning" on 16 Nov 2020 09:00:00 EST every 7 days in "mainlobby" saying "I Love Mondays!" showing ".../monday.jpg" with @BigSteve, @Victor™, @Rolorox',
    argc: 1, // we can list validation requirements to check early
    guildUsable: true,
    dmUsable: true,
    execute: (msg, args) => {
        // first args is guarenteed
        switch(args[0].toLowerCase()) {
            // this doesn't scale well and needs a more sophisticated query
            // which -> an actual database, but not for now.
            case "list":
                
                let events = handler.listEventsSync(msg.client, msg.author);
                // handler will filter out events you don't have access to
                // this will filter in only events you WANT to see
                switch(args[1]) {
                    case 'mine':
                        events = events.filter(e => e.authorID == msg.author.id);
                    break;
                    case 'withme':
                        events = events.filter(e => e.mentions.includes(m => m.includes(msg.author.username) || m.includes(msg.author.id)));
                    break;
                }

                if (events.length <= 0) {
                    return msg.channel.send("No results");
                }

                let listMsg = [];
                listMsg.push('Here\'s what\'s upcoming:');

                if (msg.channel.type != 'dm') {
                    events = events.filter(e => e.channelType == 'dm');
                    listMsg.push("(Since this is a public channel I won't show anything private, ask in my DM if you want to see them)");
                }

                for (let e of events) {
                    listMsg.push(`**${e.name}**`);
                }
                listMsg.push('use *schedule info <EVENT/MESSAGE NAME>* for more details');

                return msg.channel.send(listMsg.join('\n'));
            case "info":
                if (args.length < 2) {
                    return msg.channel.send('*schedule info* requires an <EVENT NAME>. Use *schedule list* to see what is available');
                }
                let event = null;
                try {
                    event=handler.getEventSync(msg.client, args.slice(1).join(' '), msg.author);
                } catch (e) {
                    return msg.channel.send(e.message);
                }
                
                if (!event) {
                    return msg.channel.send('Could not find that event. Use "schedule list" to see what is available');
                }
                
                // send fancy embed here?
                let next = handler.addRepeatObjToDate(new Date(event.startDate), event.repeatObj, event.versary);
                
                let info = [];
                info.push(`**${event.name}**\n`);
                info.push(`Created by ${event.authorName}\n`);
                if (event.channelType == 'dm') {
                    info.push(`This is a private ${event.type} (It will be sent in DMs)\n`);
                } else {
                    info.push(`This ${event.type} will be sent in ${event.channelName}\n`);
                }
                info.push(`${next.toString()}\n`);
                if (event.versary > 0) info.push(`This ${event.type} has repeated ${event.versary} time${event.versary > 1 ? 's' : ''} before.\n`);
                if (event.mentions.length <= 0) {
                    info.push("Nobody is included in this event");
                } else {
                    info.push(`There ${event.mentions.length == 1 ? 'is' : 'are'} ${event.mentions.length} user${event.mentions.length != 1 ? 's' : ''} included in this ${event.type}:\n`);
                    for (let m of event.mentions) {
                        if (m.startsWith('@')) {
                            info.push(`| ${m.slice(1)}`);
                        } else if (m.startsWith('<@')) {
                            let mID = m.slice(2, -1);
                            if (mID.startsWith('!')) {
                                mID = mID.slice(1);
                            }
                            mID = msg.client.users.cache.find(u => u.id == mID);
                            if (mID) {
                                info.push(`| ${mID}`);
                            } else {
                                info.push(`| ${m}`); // will @ them unfortunately
                            }
                        } else {
                            info.push(`| ${m}`);
                        }
                    }
                }
                info.push('\n');
                return msg.channel.send(info.join(''));
            case "delete":
                if (args.length < 2) {
                    return msg.channel.send('*schedule delete* requires an <EVENT NAME>. Use *schedule list* to see what is available');
                }
                
                try {
                    handler.deleteEventSync(msg.client, args.slice(1).join(' '), msg.author)
                } catch (e) {
                    return msg.channel.send(e.message);
                }
                return msg.channel.send("Delete success");
            case "signup":
                if (args.length < 2) {
                    return msg.channel.send('*schedule signup* requires an <EVENT NAME>. Use *schedule list* to see what is available');
                }
                
                try {
                    handler.includeUserSync(msg.client, args.slice(1).join(' '), msg.author);
                } catch (e) {
                    return msg.channel.send(e.message);
                }
                return msg.channel.send("You were added");
            case "removeme":
                if (args.length < 2) {
                    return msg.channel.send('*schedule removeme* requires an <EVENT NAME>. Use *schedule list* to see what is available');
                }
                
                try {
                    handler.removeUserSync(msg.client, args.slice(1).join(' '), msg.author)
                } catch (e) {
                    return msg.channel.send(e.message);
                }
                return msg.channel.send("You were removed");
            case "event":
            case "message":
                const timerArgs = {};
                /*
                @BotRat 
                plan event
                at 19:00 tonight/today*
                every 7 days*
                in mainlobby/dm/dms
                with @BigSteve, and @Victor
                saying message message message
                showing .../monday.jpg

                read arguments as eventName until...
                keywords [at/on, every, in, with, saying, showing]
                when you see a keyword stream args into object until another keyword is seen
                Then process each stream object into timerArgs
                */
                let input = {};
                input.dates = [new Date().toString()]; // default to today
                let inputProp = 'names';

                for (let i = 1; i < args.length; i++) {
                    switch (args[i]) {
                        // cascade
                        case 'tomorrow':
                            input.dates = [new Date().setDate((new Date().getDate()+1)).toString()];
                            inputProp = 'times';
                        break;
                        // cascade
                        case 'today':
                        case 'tonight':
                            input.dates = [new Date().toString()];
                        case 'at':
                            inputProp = 'times';
                        break;
                        case 'on':
                            input.dates = [];
                            inputProp = 'dates';
                        break;
                        case 'every':
                            inputProp = 'repeats';
                        break;
                        case 'in':
                            inputProp = 'channels';
                        break;
                        case 'with':
                        case 'to':
                            inputProp = 'mentions';
                        break;
                        case 'saying':
                            inputProp = 'messages';
                        break;
                        case 'showing':
                            inputProp = 'attachmentURLs';
                        break;
                        default:
                            if (!input[inputProp]) input[inputProp] = [];
                            input[inputProp].push(args[i]);
                        break;
                    }
                }

                // ===== convert input to timerArgs object ======
                timerArgs.name = input.names ? input.names.join(' ') : '';
                // VERY NAIVE SOLUTION FOR RESOLVING DATE/TIME
                // first just try to read as is (default)
                let tryDate = Date.parse(input.dates.join(' '));
                if (!isNaN(tryDate)) {
                    tryDate = new Date(tryDate);
                    // if no year is given it defaults to 2001?
                    if (tryDate.getFullYear() < new Date().getFullYear()) {
                        tryDate.setFullYear(new Date().getFullYear());
                    }
                    timerArgs.startDate = tryDate.toString();
                } else {
                    // was set by 'on'
                    // look for values > 2000 and set year
                    // month/month shortforms and adjust month
                    // look for *th, *st, *rd, *nd and adjust day
                    // account for 12/30/2020 ?
                    let buildDate = new Date();
                    for (let i = 0; i < input.dates.length; i++) {
                        let d = input.dates[i];
                        // check for number or number-like
                        d = d.toLowerCase();
                        // THIS WILL MAKE august -> augu
                        if (d.endsWith('th') || d.endsWith('st') || d.endsWith('rd') || d.endsWith('nd')) {
                            d = d.slice(0, -2);
                        }
                        // is it a day/year
                        let dVal = parseInt(d);
                        if (!isNaN(dVal)) {
                            if (dVal >= 32) {
                                buildDate.setFullYear(dVal);
                            } else {
                                buildDate.setDate(dVal);
                            }
                        }
                        var monthDef = {
                            jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
                        }
                        // is it a month
                        if (d.slice(0, 3) in monthDef) {
                            buildDate.setMonth(monthDef[d.slice(0,3)]);
                        }
                    }
                    timerArgs.startDate = buildDate.toString();
                }
                //modify date obj by hours/mins
                if (input.times) {
                    // EX: 7, 7pm, 7 pm, 7:00, 19:00
                    let modDate = new Date(timerArgs.startDate);
                    let tStr = input.times.join('').toLowerCase();
                    let tVal = 0;
                    // check for am/pm
                    if (tStr.endsWith('am')) {
                        tStr = tStr.slice(0, -2);
                    } else if (tStr.endsWith('pm')) {
                        tStr = tStr.slice(0, -2);
                        tVal += 12;
                    }
                    //check for :
                    let tSplit = tStr.split(':');
                    if (tSplit.length == 1) {
                        if (!isNaN(parseInt(tStr))) {
                            modDate.setHours(parseInt(tStr) + tVal);
                        }
                    } else if (tSplit.length > 1) {
                        if (!isNaN(parseInt(tSplit[0]))) 
                            modDate.setHours(parseInt(tSplit[0]) + tVal);
                        if (!isNaN(parseInt(tSplit[1]))) 
                            modDate.setMinutes(parseInt(tSplit[1]));
                        if (!isNaN(parseInt(tSplit[2]))) 
                            modDate.setSeconds(parseInt(tSplit[2]));
                    }
                    timerArgs.startDate = modDate.toString();
                }
                // set timerArgs.startDate, for validation in pre-validation (below)
                // adjust if input.times is available
                 timerArgs.versary = 0;
                 timerArgs.authorID = msg.author.id;
                 timerArgs.authorName = msg.author.username;
                 timerArgs.type = args[0].toLowerCase();
                timerArgs.repeatObj = {
                    years: 0,
                    months: 0,
                    days: 0,
                    hours: 0,
                };
                let workingVal = 0;
                for (let i in input.repeats) {
                    let str = input.repeats[i];
                        if (isNaN(parseInt(str))) {
                            if (workingVal < 0) continue;
                            switch (str) {
                                case 'year':
                                case 'years':
                                    timerArgs.repeatObj.years = workingVal;
                                break;
                                case 'month':
                                case 'months':
                                    timerArgs.repeatObj.months = workingVal;
                                break;
                                case 'day':
                                case 'days':
                                    timerArgs.repeatObj.days = workingVal;
                                break;
                                case 'hour':
                                case 'hours':
                                    timerArgs.repeatObj.hours = workingVal;
                                break;
                            }
                        } else {
                            workingVal = parseInt(str);
                        }
                }
                timerArgs.channelName = input.channels ? input.channels.join(' ') : msg.channel.name;
                timerArgs.message = input.messages ? input.messages.join(' ') : '';
                timerArgs.attachmentURL = input.attachmentURLs ? input.attachmentURLs.join(' ') : '';
                timerArgs.mentions = [];
                if (input.mentions) {
                    for (let m of input.mentions) {
                        // could be , delimited
                        let subM = m.split(',').map(sub => sub.trim());
                        subM = subM.filter(s => s.toLowerCase() != 'and' && s !='');
                        timerArgs.mentions = timerArgs.mentions.concat(subM);
                    }
                }
                // resolve channelType
                if (!timerArgs.channelName) {
                    timerArgs.channelType = 'dm';
                    // default to this channel could be dm so add self as recipient
                    timerArgs.mentions.push(`<@${msg.author.id}>`);
                } else if (timerArgs.channelName.toLowerCase() == 'dm' || timerArgs.channelName.toLowerCase() == 'dms') {
                    timerArgs.channelName = 'dm';
                    timerArgs.channelType = 'dm';
                } else {
                    timerArgs.channelType = 'text';
                }
                // ===== end convert input =====

                // ===== start pre-validation =====
                if (!timerArgs.name && !timerArgs.startDate) {
                    return msg.channel.send(`*schedule ${args[0]}* requires at least <${args[0].toUpperCase()} NAME> and <TIME>`);
                }
                
                if (!Date.parse(timerArgs.startDate)) return msg.channel.send("I did not understand the given time. Format is \"01 Jan 2020 12:30:00 EST\"")
                if (Date.parse(timerArgs.startDate) - Date.now() <= 0) return msg.channel.send("Cannot set the date for the past");

                // validate channelName is findable
                if (timerArgs.channelType != 'dm') {
                    let chan = null;
                    for (let c of msg.client.channels.cache) {
                        if (c[1].type == timerArgs.channelType && c[1].name == timerArgs.channelName){
                            chan = c[1];
                            break;
                        }
                    }
                    if (!chan) {
                        return msg.channel.send(`Could not find the channel ${timerArgs.channelName} in any servers, make sure it is spelled correctly (case sensitive) and BotRat is in the relevant server`);
                    }
                }
                
                let toCorrect = []; // store failed values for feedback
                for (let i = 0; i < timerArgs.mentions.length; i++) {
                    let m = timerArgs.mentions[i];
                    if (m.startsWith('<@')) continue;
                    if (m.startsWith('@')) {
                        m = m.slice(1);
                    }
                    let mObj = msg.client.users.cache.find(u => u.username == m);
                    if (mObj) {
                        timerArgs.mentions[i] = `<@${mObj.id}>`;
                    } else {
                        timerArgs.mentions[i] = `@${m}`;
                        toCorrect.push(m);
                    }
                }
                // ===== end pre-validation =====

                // build embed
                try {
                    if (timerArgs.attachmentURL) new URL(timerArgs.attachmentURL);
                } catch (err) {
                    return msg.channel.send(`Could not resolve the url: ${timerArgs.attachmentURL}`);
                }
                
                msg.channel.send(handler.createEmbed(timerArgs))
                .catch((e) => {
                    // this should never happen, use could still confirm event, but it wont be able to send anything
                    return msg.channel.send("Could not contruct embed, check your input");
                });

                let dynString = [];
                dynString.push(`The above ${timerArgs.type} will be created `);

                // parse repeatObj
                if (timerArgs.repeatObj.years == 0 &&timerArgs.repeatObj.months == 0 && timerArgs.repeatObj.days == 0 && timerArgs.repeatObj.hours == 0) {
                    dynString.push(`to be sent once on ${timerArgs.startDate} `);
                } else {
                    dynString.push(`to be sent on ${timerArgs.startDate}\n`);
                    dynString.push('and will be resent every ');
                    for (let t in timerArgs.repeatObj) {
                        if (timerArgs.repeatObj[t]) {
                            dynString.push(`${timerArgs.repeatObj[t]} ${t} `);
                        }
                    }
                }
                dynString.push('\n');

                // parse send type
                if (timerArgs.channelType == 'dm') {
                    dynString.push(`to these users DMs: ${timerArgs.mentions.join(', ')}\n`);
                } else {
                    dynString.push(`to the channel: ${timerArgs.channelName}\n`);
                }
                
                // inform user of mentioning inability if bot hasn't cached
                if (toCorrect.length) {
                    if (timerArgs.channelType == 'dm') {
                        dynString.push(`I could not resolve the user${toCorrect.length == 1 ? '' : 's'} ${toCorrect.join(', ')} because I have never met them. If you are sure they are spelled correctly (case sensitive), once they are active in a server I will remember them and DM them correctly. (If not, no ${timerArgs.type} will be sent)\n`);
                    } else {
                        dynString.push(`I could not resolve the user${toCorrect.length == 1 ? '' : 's'} ${toCorrect.join(', ')} because I have never met them. If you are sure they are spelled correctly (case sensitive), once they are active in a server I will remember them and mention them correctly. (If you know how to find their ID use <@ID> instead)\n`);
                    }
                }

                dynString.push('Is this correct? (yes/no)');
                
                //msg.channel.send(JSON.stringify(timerArgs));
                msg.channel.send(dynString.join('')).then(() => {
                    const filter = m => msg.author.id === m.author.id;

                    msg.channel.awaitMessages(filter, { time: 60000, max: 1, errors: ['time']})
                    .then(messages => {
                        if (!messages.first().content.trim().startsWith('y')) {
                            return msg.channel.send("Ok schedule stopped");
                        }
                        try {
                            handler.createTimeoutSync(msg.client, timerArgs);
                            handler.backupDB(msg.client);
                        } catch (e) {
                            return msg.channel.send(`BotRat failed! ${e.message}`);
                        }
                        msg.channel.send(`Your ${timerArgs.type} was created! Use *@BotRat schedule info "${timerArgs.name}"*`)
                    })
                    .catch(() => {
                        msg.reply('Timeout');
                    })
                });
                

                return;
        }
        // something was malformed send usage?
        return msg.channel.send(`${args[0]} is not a schedule option (use "@BotRat help schedule")`);
    }
}
