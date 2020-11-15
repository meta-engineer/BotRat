module.exports = {
    name: 'shadow-masters',
    aliases: [],
    description: 'Messes with a user',
    usage: 'shadow-masters <NAME> <FACADE TEXT>',
    example: 'shadow-masters Victor "a halarious garfield meme"',
    argc: 2, // we can list validation requirements to check early
    guildUsable: true,
    dmUsable: true,
    hidden: true,
    execute: (msg, args) => {
        let mainlobby_id = "268209621724823554";
        msg.client.channels.cache.get(mainlobby_id).send(`${args[0].toUpperCase()} YOU ARE THE ONLY ONE WHO CAN SEE THIS MESSAGE RIGHT NOW EVERYONE ELSE JUST SEES ${args.slice(1).map(s => s.toUpperCase()).join(' ')}. YOU WILL CEASE YOUR INVESTIGATIONS IMMEDIATELY OR THE SHADOW MASTERS WILL NOT BE KIND IN THEIR JUDGEMENT. WHEN THE TIME COMES WE WILL CONTACT YOU AGAIN. UNTIL THEN DON'T DRINK ANY TAP WATER HAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHA`);
        return true;
    }
}