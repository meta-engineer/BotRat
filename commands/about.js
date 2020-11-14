//const fs = require('fs');
const discord = require('discord.js');
const { version } = require('../package.json');

module.exports = {
    name: 'about',
    aliases: ['info'],
    description: 'Check info about this bot',
    usage: 'about',
    example: '@BotRat about',
    argc: 0, // we can list validation requirements to check early
    guildUsable: true,
    dmUsable: true,
    execute: (msg, args) => {
        // should we have directory structures defined in a config file?
        /*
        // could use readFileSync, but not as robust
        fs.readFile('resources/about.txt', 'utf8', (e, data) => {
            if (e) {
                return msg.channel.send('Could not read about info, please try again later');
            }
            console.log(data);
            msg.channel.send(data);
        });
        */
        // should this somehow convert README.md?
        const aboutEmbed = new discord.MessageEmbed()
            .setColor('#00ff55')
            .setTitle(`BotRat V${version}`)
            .setURL('https://github.com/meta-engineer/BotRat')
            .setAuthor('Meta-engineer', 'https://avatars2.githubusercontent.com/u/13059024?s=460&u=c33c54542dbf8ce736c0c78c902491fdff019f70&v=4', 'https://github.com/meta-engineer')
            .setDescription('"Well I like being a bot, so I guess I\'m a BotRat"')
            .setThumbnail('https://cdn.discordapp.com/avatars/776307119967567944/9e19fba1a6f79707d9806a9689f8bac0.png')
            .addField('What in the hell are you?', 'BotRat is a miscellaneous bot developed by meta-engineer. \nUse "@BotRat help" for available commands, or check out the BotRat project page (linked above) for more info or to help improve BotRat.')
            .setTimestamp();
        msg.channel.send(aboutEmbed);
        return true;
    }
}