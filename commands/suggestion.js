const fs = require('fs');

module.exports = {
    name: 'suggestion',
    aliases: ['suggestions', 'suggest'],
    description: 'Send a suggestion to the developer',
    usage: 'suggestion <TEXT>',
    example: '@BotRat suggestion "delete this"',
    argc: 1, // we can list validation requirements to check early
    guildUsable: true,
    dmUsable: true,
    execute: (msg, args) => {
        // should we have directory structures defined in a config file?
        fs.appendFile('database/suggestions.txt', 
        msg.author.username + " @ " + new Date().toString() + '\n' + args[0] + '\n\n', 
        (e) => {
            if (e) {
                msg.channel.send('Could not write suggestion, please try again later or inform the developers elsewhere (use *about*)');
            }
            msg.channel.send('Thank you for your suggestion!');
        });
        return true;
    }
}
