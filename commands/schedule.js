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
    dateCreated: '01 Jan 1970 00:00:00 GMT',
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

module.exports = {
    name: 'schedule',
    aliases: ['plan', 'alarm'],
    description: 'Sets and gets timed events for BotRat to notify. (You can DM this command to me to set an event in secret, use channel: "private" to DM the event to participants when it happens)',
    usage: 'schedule list <mine/withme/private>* | info <EVENT NAME> | signup <EVENT NAME> | removeme <EVENT NAME> | delete <EVENT NAME> | set <EVENT NAME> <TIME> <REPEAT MM/DD:HH>* <CHANNEL>* <MESSAGE>* <ATTACHMENT URL>* <PARTICIPANTS>*',
    example: '@Botrat schedule set "Monday Morning" "16 Nov 2020 09:00:00" 00/07:00 mainlobby "I Love Mondays!" .../monday.jpg "rolorox, bigsteve, victor™"',
    argc: 1, // we can list validation requirements to check early
    guildUsable: true,
    dmUsable: true,
    execute: (msg, args) => {
        // first args is guarenteed
        //return msg.channel.send('scheduling is under construction, try again later');
        switch(args[0]) {
            case "list":
                return msg.channel.send("I can't do that yet.");
                
                //handler.listEventsSync(msg.client, msg.author);
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
            case "set":
                const timerArgs = {};
                //only really 2 (+1) args required
                if (args.length < 3) {
                    return msg.channel.send('"schedule set" requires at least <EVENT NAME> and <TIME>');
                }
                timerArgs.name = args[1];
                timerArgs.dateString = args[2];
                timerArgs.authorID = msg.author.id;
                // deafult to no repeat
                if (args[3]) timerArgs.repeatCode = args[3] || '00/00:00';
                // default to channel where msg was
                if (args[4]) timerArgs.channelID = msg.client.channels.cache.find(c => c.name == args[4]).id || msg.channel.id;
                if (args[5]) timerArgs.message = args[5] || "";
                if (args[6]) timerArgs.attachmentURL = args[6] || '';
                // default to no mentions
                if (args[7]) timerArgs.mentions = args[7].split(',').map(m => m.trim()) || [];
                
                return msg.channel.send("I can't do that yet.");

                // how does createTimout handle errors?
                //handler.createTimeoutSync(msg.client, timerArgs);
                

                return;
        }
        // something was malformed send usage?
        return msg.reply('Shove off!');
    }
}
