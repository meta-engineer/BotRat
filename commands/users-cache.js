module.exports = {
    name: 'users-cache',
    aliases: ['users', 'seen'],
    description: 'Replies with the cached users collection (cached -> been active since bot start)',
    usage: 'users-cache',
    example: '@BotRat users-cache',
    argc: 0, // we can list validation requirements to check early
    guildUsable: true,
    dmUsable: true,
    hidden: true,
    adminOnly: true,
    execute: (msg, args) => {
        for (let [k, v] of msg.client.users.cache.entries()) {
            msg.channel.send(k + " " + v.username);
        }
        return true;
    }
}