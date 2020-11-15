module.exports = {
    name: 'help',
    aliases: ['commands'],
    description: 'List all commands or info about a command',
    usage: 'help <COMMAND>',
    example: '@BotRat help help',
    argc: 0, // we can list validation requirements to check early
    guildUsable: true,
    dmUsable: true,
    execute: (msg, args) => {
        const reply = [];
        const commands = msg.client.commands;
        // const { commands } = msg.client;

        if (!args.length) {
            reply.push('Commands start with **@BotRat**')
            reply.push('Available commands:');
            reply.push(commands.filter(c => !c.hidden).map(c => `*${c.name}*`).join(', '));
            reply.push(`Use "${commands.get('help').usage}" for more info`);
            reply.push(`(You can ask me in a DM to reduce spam.)`);
        } else {
            while (args.length) {
                const cmdStr = args.shift().toLowerCase();
                const cmd = commands.get(cmdStr) || commands.find(c => c.aliases && c.aliases.includes(cmdStr));

                if (!cmd) {
                    reply.push(`"${cmdStr}" is not a command (use "commands" for a listing)`);
                } else {
                    reply.push(`**Name:** ${cmd.name}`);
                    if (cmd.aliases) reply.push(`**Aliases:** ${cmd.aliases.join(', ')}`);
                    if (cmd.description) reply.push(`**Description:** ${cmd.description}`);
                    if (cmd.usage) reply.push(`**Usage:** ${cmd.usage}`);
                    if (cmd.example) reply.push(`**Example:** ${cmd.example}`);
                }
            }
        }
        // should this be a dm?
        msg.channel.send(reply.join('\n'), { split:true, tts:true });
        return true;
    }
}