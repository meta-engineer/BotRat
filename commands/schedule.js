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
    repeatCode: '00/01:15', // hour:minute is converted directly,months...
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
    '| event <EVENT NAME> <TIME> <REPEAT MM/DD:HH>* <CHANNEL/dm>* <MESSAGE>* <ATTACHMENT URL>* <PARTICIPANTS (comma separated)>*\n' +
    '| message <MESSAGE NAME> <TIME> <REPEAT MM/DD:HH>* <CHANNEL/dm>* <MESSAGE>* <ATTACHMENT URL>* <RECIPIENTS (comma separated)>*',
    example: '@Botrat schedule event "Monday Morning" "16 Nov 2020 09:00:00 EST" 00/07:00 "mainlobby" "I Love Mondays!" ".../monday.jpg" "@BigSteve, @Victor™, @Rolorox"',
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
                    event=handler.getEventSync(msg.client, args[1], msg.author);
                } catch (e) {
                    return msg.channel.send(e.message);
                }
                
                if (!event) {
                    return msg.channel.send('Could not find that event. Use "schedule list" to see what is available');
                }
                
                // send fancy embed here?
                let next = handler.addRepeatCodeToDate(new Date(event.startDate), event.repeatCode, event.versary);
                
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
                    handler.deleteEventSync(msg.client, args[1], msg.author)
                } catch (e) {
                    return msg.channel.send(e.message);
                }
                return msg.channel.send("Delete success");
            case "signup":
                if (args.length < 2) {
                    return msg.channel.send('*schedule signup* requires an <EVENT NAME>. Use *schedule list* to see what is available');
                }
                
                try {
                    handler.includeUserSync(msg.client, args[1], msg.author);
                } catch (e) {
                    return msg.channel.send(e.message);
                }
                return msg.channel.send("You were added");
            case "removeme":
                if (args.length < 2) {
                    return msg.channel.send('*schedule removeme* requires an <EVENT NAME>. Use *schedule list* to see what is available');
                }
                
                try {
                    handler.removeUserSync(msg.client, args[1], msg.author)
                } catch (e) {
                    return msg.channel.send(e.message);
                }
                return msg.channel.send("You were removed");
            case "event":
            case "message":
                const timerArgs = {};
                //only really 2 (+1) args required
                if (args.length < 3) {
                    return msg.channel.send(`*schedule ${args[0]}* requires at least <${args[0].toUpperCase()} NAME> and <TIME>`);
                }
                timerArgs.name = args[1];
                timerArgs.startDate = args[2];
                timerArgs.versary = 0;
                timerArgs.authorID = msg.author.id;
                timerArgs.authorName = msg.author.username;
                timerArgs.type = args[0].toLowerCase();
                // deafult to no repeat
                timerArgs.repeatCode = args[3] || '00/00:00';
                // default to channel where msg was
                timerArgs.channelName = args[4] || msg.channel.name;
                // see "resolve channelType" below
                timerArgs.message = args[5] || "";
                timerArgs.attachmentURL = args[6] || '';
                // default to no mentions
                if (args[7]) {
                    timerArgs.mentions = args[7].split(',').map(m => m.trim());
                } else {
                    timerArgs.mentions = [];
                }
                // resolve channelType
                if (!timerArgs.channelName) {
                    timerArgs.channelType = 'dm';
                    // default to this channel could be dm so add self as recipient
                    timerArgs.mentions.push(`<@${msg.author.id}>`);
                } else if (timerArgs.channelName == 'dm') {
                    timerArgs.channelType = 'dm';
                } else {
                    timerArgs.channelType = 'text';
                }

                // ===== start pre-validation =====
                //let cleanup = [];
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

                // parse repeatCode
                let repeatVals = handler.parseRepeatCode(timerArgs.repeatCode);
                if (repeatVals.months || repeatVals.days || repeatVals.hours) {
                    dynString.push(`to be sent on ${timerArgs.startDate}\n`);
                    dynString.push('and will be resent every ');
                    if (months) dynString.push(`${months} month${months == 1 ? '' : 's'} `);
                    if (days) dynString.push(`${days} day${days == 1 ? '' : 's'} `);
                    if (hours) dynString.push(`${hours} hour${hours == 1 ? '' : 's'} `);
                } else {
                    // could be malformed so reset repeatCode
                    timerArgs.repeatCode == '00/00:00';
                    dynString.push(`to be sent once on ${timerArgs.startDate} `);
                }

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
