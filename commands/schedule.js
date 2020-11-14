module.exports = {
    name: 'schedule',
    aliases: ['plan', 'alarm'],
    description: 'Sets and gets timed events for BotRat to notify.',
    usage: 'schedule list | info <EVENT NAME> | signup <EVENT NAME> | remove <EVENT NAME> | set <EVENT NAME> <TIME> <REPEAT MM/DD:HH>* <CHANNEL>* <MENTIONS>* <MESSAGE>* <ATTACHMENT URL>*',
    example: '@Botrat set "Monday Morning" "16 Nov 2020 09:00:00" 00/07:00 mainlobby "rolorox, bigsteve, victor™" "I Love Mondays!" .../monday.jpg',
    argc: 1, // we can list validation requirements to check early
    guildUsable: true,
    dmUsable: true,
    execute: (msg, args) => {
        // first args is guarenteed
        return msg.channel.send('scheduling is under construction, try again later');
        switch(args[0]) {
            case "list":
                const events = new Set([...(msg.client._timeouts),
                     ...(msg.client._intervals)]);
                console.log(events);
                msg.reply('Listed in console');
                return;
            case "info":
                if (args.length < 2) {
                    msg.channel.send('"schedule info" requires an <EVENT NAME>. Use "schedule list" to see what is available');
                }
                const event = new Set([...(msg.client._timeouts),
                    ...(msg.client._intervals)]).find(e => e._timerArgs && e._timerArgs.name == args[1]);

                if (!event) {
                    msg.channel.send('Could not find that event. Use "schedule list" to see what is available');
                }
                // send fancy embed here?
                msg.channel.send(event._timerArgs.name + '\n' + event/_timerArgs.dateString);

                return;
            case "remove":
                // should events have an owner who has permissio to delet?

                return;
            case "signup":
                if (args.length < 2) {
                    msg.channel.send('"schedule signup" requires an <EVENT NAME>. Use "schedule list" to see what is available');
                }
                
                // get timeout from list add msg.author.id to timeout._timerArgs.mentions

                return;
            case "set":
                const timerArgs = {};
                //only really 2 (+1) args required
                if (args.length < 3) {
                    msg.channel.send('"schedule set" requires at least <EVENT NAME> and <TIME>');
                    return;
                }
                timerArgs.name = args[1];
                timerArgs.dateString = args[2];
                if (args[3]) timerArgs.repeatCode = args[3] || '00/00:00';
                if (args[4]) timerArgs.channelID = msg.client.channels.cache.find(c => c.name == args[4]).id || 268209621724823554;
                if (args[5]) timerArgs.mentions = args[5].split(',').map(m => m.trim()) || [];
                if (args[6]) timerArgs.message = args[6] || "";
                if (args[7]) timerArgs.attachmentURL = args[7] || '';

                console.log(JSON.stringify(timerArgs));
                
                msg.channel.send("sent object to console");
                //msg.client.setInterval((text) => console.log(text), 10000, 'this is an arg');

                return;
        }
        // something was malformed send usage?
        msg.reply('Shove off!');
        return true;
    }
}
/*
// important timer properties
_idleTimeout (Int)
_repeat (null || Int)
_onTimeout (Function)
_destroyed (boolean) ? use this for easier garbage collection?
_timerArgs *see below

//example _timerArgs object:
_timerArgs =
{
    name: "I Love Mondays",
    dateString: '01 Jan 1970 00:00:00 GMT' //saved for easy listing,
    channelID: '268209621724823554',
    mentions: ['183531047416233984', '165625043601195018'], 
    message: "Back on the worksite no more nagging wife",
    attachmentURL: './resources/monday.jpg',
}
*/
// event function has to account for monthly repeating?