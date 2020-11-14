module.exports = {
    name: 'bot-info',
    aliases: ['bot'],
    description: 'Returns client object and tries to step through object with args',
    usage: 'bot-info ...',
    example: '@BotRat bot-info _timeouts',
    argc: 0, // we can list validation requirements to check early
    guildUsable: true,
    dmUsable: true,
    hidden: true,
    adminOnly: true,
    execute: (msg, args) => {
        let obj = msg.client;
        try {
            for (let a of args) {
                obj = obj[a];
            }
        } catch (e) {
            msg.channel.send('Invalid index');
        }
        console.log(obj);
        msg.channel.send("info in console");
        return true;
    }
}