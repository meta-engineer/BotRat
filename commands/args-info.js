module.exports = {
    name: 'args-info',
    aliases: ['args'],
    description: 'Returns args list (for parsing validation)',
    usage: 'args-info ...',
    example: '@BotRat args-info thisIsOneArg "This should also be one arg"',
    argc: 0, // we can list validation requirements to check early
    guildUsable: true,
    dmUsable: true,
    hidden: true,
    adminOnly: true,
    execute: (msg, args) => {
        msg.channel.send(args);
        return true;
    }
}