/*
// This should probably be set in a database.. that is loaded on bot start, and updated when timouts happen to ensure events aren't lost over restarts... use json file for now?
// important timer properties
_idleTimeout (Int)
_repeat (null || Int) // in case of monthly repeat this always null?
_onTimeout (Function) // make static
_destroyed (boolean) //no repeat and set this true should clear event?
_timerArgs // set/loaded in from "database"

//example _timerArgs object:
_timerArgs =
{
    name: "I Love Mondays",
    authorID: '1112352456753332',
    startDate: '01 Jan 1970 00:00:00 GMT',
    versary: 0,
    repeatCode: '00/01:15', // hour:minute is converted directly,months...
    channelID: '268209621724823554', // if this is 'private' use mentions
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

module.exports = {
    name: 'schedule',
    aliases: ['plan', 'alert', 'reminder'],
    description: 'Sets and gets timed events/messages for BotRat to notify users. You can DM this command to me to set an event/message in secret, also use channel: "private" to DM the event to all participants when it happens. "Events" are publicly listed (or privately listed) once created, while "Messages" are not listed for anyone but the sender.',
    usage: '\nschedule list <mine/withme>* \n' +
    '| info <EVENT/MESSAGE NAME> \n' + 
    '| signup <EVENT NAME> \n' + 
    '| removeme <EVENT NAME> \n' + 
    '| delete <EVENT/MESSAGE NAME> \n' + 
    '| event <EVENT NAME> <TIME> <REPEAT MM/DD:HH>* <CHANNEL/private>* <MESSAGE>* <ATTACHMENT URL>* <PARTICIPANTS>*\n' +
    '| message <MESSAGE NAME> <TIME> <REPEAT MM/DD:HH>* <CHANNEL/private>* <MESSAGE>* <ATTACHMENT URL>* <RECIPIENTS>*',
    example: '@Botrat schedule event "Monday Morning" "16 Nov 2020 09:00:00 EST" 00/07:00 "mainlobby" "I Love Mondays!" ".../monday.jpg" "rolorox, bigsteve, victor™"',
    argc: 0, // we can list validation requirements to check early
    guildUsable: true,
    dmUsable: true,
    execute: (msg, args) => {
        // first args is guarenteed
        switch(args[0].toLowerCase()) {
            // this doesn't scale well and needs a more sophisticated query
            // which -> an actual database, but not for now.
            case "list":
                return msg.channel.send("I can't do that yet.");
                
                //handler.listEventsSync(msg.client, msg.author);
                // handler will filter out events you don't have access to
                // this will filter in only events you WANT to see
                switch(args[1]) {
                    case 'mine':

                    break;
                    case 'withme':

                    break;
                    case 'private':

                    break;
                    default:    //aka undefined

                    break;
                }
                reply.push('Here\'s all the upcoming events:');

                // list all public, list created by me, list with me participating, private (only in dm)
                return;
            case "info":
                if (args.length < 2) {
                    return msg.channel.send('"schedule info" requires an <EVENT NAME>. Use "schedule list" to see what is available');
                }
                
                return msg.channel.send("I can't do that yet.");

                // get from handler
                /*
                const event = handler.getEventSync(msg.client, args[1], msg.author);
                if (!event) {
                    msg.channel.send('Could not find that event. Use "schedule list" to see what is available');
                }
                */
                // send fancy embed here?
                msg.channel.send(event._timerArgs.name + '\n' + event/_timerArgs.dateString);

                return;
            case "delete":
                if (args.length < 2) {
                    return msg.channel.send('"schedule info" requires an <EVENT NAME>. Use "schedule list" to see what is available');
                }
                // check permission to delet (admin/author)
                return msg.channel.send("I can't do that yet.");

                // handler.deleteEventSync(msg.client, args[1])

                return;
            case "signup":
                if (args.length < 2) {
                    return msg.channel.send('"schedule signup" requires an <EVENT NAME>. Use "schedule list" to see what is available');
                }
                
                return msg.channel.send("I can't do that yet.");

                //handler.includeUserSync(msg.client, msg.author, args[1]);

                return;
            case "removeme":
                if (args.length < 2) {
                    return msg.channel.send('"schedule removeme" requires an <EVENT NAME>. Use "schedule list" to see what is available');
                }
                
                return msg.channel.send("I can't do that yet.");

                //handler.removeUserSync(msg.client, msg.author, args[1])

                return;
            case "event":
            case "message":
                const timerArgs = {};
                //only really 2 (+1) args required
                if (args.length < 3) {
                    return msg.channel.send(`"schedule ${args[0]}" requires at least <${args[0].toUpperCase()} NAME> and <TIME>`);
                }
                timerArgs.name = args[1];
                timerArgs.startDate = args[2];
                timerArgs.authorID = msg.author.id;
                timerArgs.authorName = msg.author.username;
                timerArgs.type = args[0].toLowerCase();
                // deafult to no repeat
                timerArgs.repeatCode = args[3] || '00/00:00';
                // default to channel where msg was
                timerArgs.channelName = args[4] || msg.channel.name;
                //msg.client.channels.cache.find(c => c.name == args[4]).id || msg.channel.name;
                timerArgs.message = args[5] || "";
                timerArgs.attachmentURL = args[6] || '';
                // default to no mentions
                if (args[7]) {
                    timerArgs.mentions = args[7].split(',').map(m => m.trim());
                } else {
                    timerArgs.mentions = [];
                }

                // start pre-validation
                //if (!Date.parse(timerArgs.startDate)) return msg.channel.send("I did not understand the given time. Format is \"01 Jan 2020 12:30:00 EST\"")
                // end pre-validation


                msg.channel.send(`Create this ${timerArgs.type}:\n`);
                // build embed
                msg.channel.send(handler.createEmbed(timerArgs));

                // parse repeatCode
                try {
                    let months = 0;
                    let days = 0;
                    let hours = 0;
                    let codes = timerArgs.repeatCode.split('/');
                    if (codes.length > 1) {
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
                        throw "malformed";
                    }
                    
                    let dynString = []
                    dynString.push(`to be sent on ${timerArgs.startDate}\n`);
                    dynString.push('and will be resent every ');
                    if (months) dynString.push(`${months} month${months == 1 ? '' : 's'} `);
                    if (days) dynString.push(`${days} day${days == 1 ? '' : 's'} `);
                    if (hours) dynString.push(`${hours} hour${hours == 1 ? '' : 's'}`);
                    msg.channel.send(dynString.join(''));

                } catch (e) {
                    //if parsing that argument fails just set it to 00/00:00
                    console.log(e);
                    timerArgs.repeatCode == '00/00:00';
                    msg.channel.send(`to be sent once on ${timerArgs.startDate}`);
                }

                if (timerArgs == 'private') {
                    msg.channel.send(`to these users DMs: ${timerArgs.mentions.join(', ')}`);
                } else {
                    msg.channel.send(`to the channel: ${timerArgs.channelName}`);
                }

                //msg.channel.send(JSON.stringify(timerArgs));
                msg.channel.send('Is this correct? (yes/no)').then(() => {
                    const filter = m => msg.author.id === m.author.id;

                    msg.channel.awaitMessages(filter, { time: 60000, max: 1, errors: ['time']})
                    .then(messages => {
                        msg.channel.send(`You said: ${messages.first().content}`);
                    })
                    .catch(() => {
                        msg.reply('Timeout');
                    })
                });

                try {

                } catch (e) {
                    msg
                }
                //handler.createTimeoutSync(msg.client, timerArgs);
                

                return;
        }
        // something was malformed send usage?
        return msg.reply(`${args[0]} is not a schedule option (use "@BotRat help schedule")`);
    }
}
