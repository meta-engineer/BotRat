module.exports = {
    name: 'monday',
    aliases: ['whenismonday', 'ilovemondays'],
    description: 'Returns time until I can live again',
    usage: 'monday',
    example: '@BotRat monday',
    argc: 0, // remember this is MIN arg count
    guildUsable: true,
    dmUsable: true,
    execute: (msg, args) => {
        let ms = leftToMonday();
        msg.channel.send("I love mondays! There is " + Math.floor(ms/1000/60/60) + ":" + Math.floor(ms/1000/60%60) + ":" + Math.floor(ms/1000%60) + " left until the next monday morning! (9am EST)");
        return true;
    }
}

function leftToMonday() {
	var d = new Date();
	var m = new Date();
	m.setHours(9,0,0,0);
	m.setDate(m.getDate() + (1 - d.getDay()));
	var sevenDays = 1000*60*60*24*7;
	var rem = (m.getTime() - d.getTime() + sevenDays) % sevenDays;
	return rem;
}