// This is the entry point for node

// discord imports
const discord = require('discord.js')
if (!discord) return console.error("Failed to import discord.js");

const auth = require('./secrets.json');
if (!auth) return console.error("No token file (secrets.json) found");
//const prefix = "<@!" + auth.CLIENT_ID + "> "; //this a permenant solution?

// node package imports
const fs = require('fs');
const scheduler = require('./utilities/scheduler.js');
// ====================

// instantiate our bot client object
const bot = new discord.Client();
// we can add a custom field to bot object to hold our own logic
// build commands field with exported objects from each file
bot.commands = new discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    bot.commands.set(command.name, command);
}

try {
    bot.login(auth.TOKEN);
} catch (e) {
    return console.log("Could not login, check your connection");
}
// build events schedule from previous runtime after login?
// can access bot.users.cache for seen users?

bot.on('ready', () => {
    console.log('Ready!');
    // are there any initializations that should happen here instead in declarations
    /*
    bot.user.setPresence({
        game: {
            name: "I'm a BotRat",
            type: "Playing",
            url: "https://github.com/meta-engineer"
        }
    });
    */
    bot.user.setActivity("You | @BotRat help", 
        { 
            type: "WATCHING", 
            url: "https://github.com/meta-engineer"
        }
    );
    try {
        console.log("Load stored events");
        scheduler.restoreDB(bot);
    } catch (e) {
        console.error(e.message);
    }

});

bot.on('message', (msg) => {
    if (msg.author.bot) return;
    if (msg.webhookID) return;
    //if (!msg.content.startsWith(prefix)) return;
    //console.log(msg);
    // log all messages given to BotRat
    fs.appendFile('database/log.txt', 
        msg.author.username + " @ " + new Date().toString() + '\n' + msg.content + '\n\n', 
        (e) => {
            if (e) {
                //console.log("Failed to log message");
            }
        });

    const prefixRegex = new RegExp(`^(<@!?${auth.CLIENT_ID}>)\\s*`);
    if (!prefixRegex.test(msg.content)) return;
    const [, matchedPrefix] = msg.content.match(prefixRegex);

    // remove prefix parse into arguments
    const argsStr = msg.content.slice(matchedPrefix.length).trim();
    if (!argsStr) return;   // just exit quietly on no args, should we suggest help?

    // split on '"', then alternating index will be split on spaces?
    const argsList = argsStr.split('"');
    
    const args = [];
    for (let i = 0; i < argsList.length; i++) {
        if (i % 2 == 1) {
            args.push(argsList[i].trim())// leave it whole
        } else {
            let subArgs = argsList[i].trim().split(/ +/);
            for (let s of subArgs) {
                if (s) args.push(s);
            }
        }
    }
    
    // pop from the front of args to get command
    const cmdStr = args.shift().toLowerCase();
    const cmd = bot.commands.get(cmdStr) 
    || bot.commands.find(cmd => cmd.aliases && cmd.aliases.includes(cmdStr));

    // ====== preliminary cmd validation (argc, guildUsable, ...) ======
    if (!cmd || (cmd.adminOnly && auth.ADMIN_IDS.includes(msg.author.id))) {
        msg.channel.send(`I wish i could ${argsStr}`);
        // suggest "commands"? or don't for funny responses?
        return;
    }
    if (msg.channel.type == 'dm' && !cmd.dmUsable) {
        msg.channel.send(`"${cmd.name}" cannot be used in a DM`);
    }
    if (msg.channel.type == 'text' && !cmd.dmUsable) {
        msg.channel.send(`"${cmd.name}" cannot be used in a server`);
    }
    if (args.length < cmd.argc) {
        msg.channel.send("Usage: " + cmd.usage);
        return;
    }
    // ========= end validation ==========

    try {
        cmd.execute(msg, args);
    } catch (e) {
        console.error(e);
        msg.channel.send('Command was acknowledged but had a runtime error');
    }
    
});

bot.on("error", function(error) {
    console.log("ERROR event occurred:\n" + error.message);
    if (error.message.contains == "ECONNRESET") {
        console.log("Attempting to reconnect in 5 seconds...");
        bot.setInterval(bot.login, 5000, auth.TOKEN);
    }
});