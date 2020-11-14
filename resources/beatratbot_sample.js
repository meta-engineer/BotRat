const Discord = require('discord.js');
// Catch "failed" api require?
//console.log("Error importing discord.js. You may not have connection to the internet.");

// server auth token
var Auth;
try {
    Auth = require('./auth.json');
} catch(e) {
    return console.log("No authorization token json file found");
}
const fs = require('fs');
const rsDir = './resources/';
// test rsDir and exit early if resource directory is missing

var bot = new Discord.Client();
bot.login(Auth.token);

bot.on("ready", function() {
    console.log("I am ready!");
    mondays(bot);
});

var followee = null;
var myVoiceChannel = null;
var myVoiceConnection = null;
var myDispatcher = null;
var myReceiver = null;
var myAudioStream = null;
var defaultVolume = 0.05;
var listening = false;
var playing = false;
var toggleReact = true;

var Amoor = false;
var balladAmoor = false;
var AmoorTimeout = null;

var luck = 0;

var userNames = [];
var userObjects = [];

// ***** Respond to messages *****
bot.on("message", function(message) {
    // ignore all bots
    // won't spam react emoji to "avrae"
	if ( message.author.bot ) return;
	// make this dictionary?
    if (userNames.indexOf(message.author.username) == -1) {
        userNames.push(message.author.username);
        userObjects.push(message.author);
        console.log("Remembering: " + message.author.username);
    }

    // Log PMs
    if ( ! (message.member) ) {
        console.log(message.author.username + " whispered to me: \"" + message.content + "\"");
    }

    // Commands are of the form @BeatRatBot *
    if ( message.cleanContent.startsWith("@BeatRatBot") || message.cleanContent.startsWith("@BotRat") ) {

        // extract query
        var q;
        if ( message.cleanContent.startsWith("@BeatRatBot") ) {
            q = message.cleanContent.substring(12).trim();
        } else {
            q = message.cleanContent.substring(8).trim();
        }
        console.log(message.author.username + " in " + message.channel.name + " input: \"" + q + "\"" );

        // ***** dynamic queries ******
        replied = DQueries(bot, message, q);
        // ***** specific posts *****
        if (replied == 0) replied = SQueries(bot, message, q);
        if (replied == 0) Error_msg(message);
    }

    // Emoji react
    if (toggleReact) {
        Emoji_react(bot, message);
    }

    // Edge cases
    if (balladAmoor == true && message.cleanContent.startsWith("yes")) {
        fs.readFile(rsDir + "ballad_of_Amoor.txt", (err, data) => { message.channel.send(data.toString(), {tts:true, split:true} ); } );
    }
    // 1 message will clear the prompt
    balladAmoor = false;

    if ( (message.member) && message.author.id == 136277887970967553) {
    if (Amoor == false) {
        message.channel.send("@everyone The great Amoor has made his return! Hurrah! Like this post in 22 seconds or you'll be dead in a flash!");
        message.channel.send("Shall I recount the Ballad of Amoor? (type \"yes\")");
        balladAmoor = true;
        Amoor = true;
    }

    // only signal the return of the Amoor if 5 minutes have past without him
    if (AmoorTimeout != null) clearTimeout(AmoorTimeout);
        AmoorTimeout = bot.setTimeout(resetAmoor, 1000 * 60 * 5);
    }

});

function resetAmoor() { Amoor = false; }

function generateOutputFile(channel, member) {
  // use IDs instead of username cause some people have stupid emojis in their name
  const fileName = `./recordings/${channel.id}-${member.id}-${Date.now()}.pcm`;
  return fs.createWriteStream(fileName);
}

function leftToMonday() {
	var d = new Date();
	var m = new Date();
	m.setHours(12,0,0,0);
	m.setDate(m.getDate() + (1 - d.getDay()));
	var sevenDays = 1000*60*60*24*7;
	var rem = (m.getTime() - d.getTime() + sevenDays) % sevenDays;
	return rem;
}

function mondays(bot) {
	var monday = "./resources/monday.jpg";
        try {
			var ltm = leftToMonday();
            console.log("Time until next Monday: " + Math.floor(ltm/1000/60/60/24) + " days " + Math.floor(ltm/1000/60/60%24) + " hours " + Math.floor(ltm/1000/60%60) + " minutes.");
        } catch(e) {
            console.log("Cannot determine mondays");
            return;
        }
	// find difference between now and monday at 12pm,
	setTimeout(function() {
		bot.channels.get("268209621724823554").send(new Discord.Attachment(monday));
		var weekMilliseconds = 1000 * 60 * 60 * 24 * 7;
		setInterval(function() {
			bot.channels.get("268209621724823554").send(new Discord.Attachment(monday));
		}, weekMilliseconds)
	}, leftToMonday())
}

function vic(bot, message) {
	var vicidence = "./resources/hmm.jpg";
	message.channel.send("Hack complete. Displaying payload");
	message.channel.send(new Discord.Attachment(vicidence));
}

function Error_msg(m) {
    m.channel.send(m.author + " hmm? Try @BeatRatBot help");
}

function DQueries(bot, message, q) {
    // Dice roll
    if (q.startsWith("roll") || q.startsWith("Roll")) {
        var eq = q.trim().substring(5).split(" ");
	    try {
	        var equation = "";
	        var result = 0;
    		var modifier = 1;
            for (var i = 0; i < eq.length; i++) {
    		    var term = eq[i];
    		    var t = term.split("d");
    		    if (t == "+") {
                    modifier = 1;
                    equation += " + ";
                    continue;
    		    } else if (t == "-") {
                    modifier = -1;
                    equation += " - ";
                    continue;
    		    }

    		    if (t.length == 1) {
    		        result += Number(t[0]) * modifier;
                    equation += t[0] + " ";
    		    } else if (t.length == 2) {
                    var roll = 0;
        			for (var j = 0; j < Number(t[0]); j++) {
        			    // only use luck on 1d20
        			    if (luck == 1 && t[0] == "1" && t[1] == "20") {
        				roll += 20;
        				luck = 0;
        			    } else if (luck == -1 && t[0] == "1" && t[1] == "20") {
        				roll += 1;
        				luck = 0;
        			    } else {
        				roll += Math.floor(Math.random() * Number(t[1]) + 1);
        			    }
    			    }
    		        result += roll * modifier;
                    equation += t[0] + "d" + t[1] + " (" + roll + ") ";
    		    } else {
    		        throw 1;
    		    }
                modifier = 1;
            }
            equation += "... ";
            var m = equation + "**" + result + "**";
	        message.channel.send({embed: {"color": 3447003, "title": message.author.username + " rolling...", "description": m}});
	    } catch(e) {
            message.channel.send(message.author + " I don't understand your roll request (check spaces)");
	    }
	    return 1;
    // direct PMs
	} else if (message.author.id == 162411606041427969 && q.startsWith("@")) {
		// cut ID
		var dmName = q.substring(1).split(" ")[0];
		var fragment = q.split(" ");
		fragment.splice(0, 1);
		var dmMsg = fragment.join(" ");

		console.log("DMing \"" + dmMsg + "\" to " + dmName);
		if (userNames.indexOf(dmName) != -1) {
			userObjects[userNames.indexOf(dmName)].send(dmMsg, { tts: true });
		} else {
			message.author.send(message.author + " I cannot remember " + dmName);
		}
		return 1;
	} else if (q.startsWith("volume")) {
		var volumeRepr = q.split(" ")[1];
		newVolume = parseFloat(volumeRepr);
		if (newVolume) {
			defaultVolume = newVolume / 10;
			if (myDispatcher) myDispatcher.setVolume(defaultVolume);
		} else {
            Error_msg(message);
		}
		return 1;
    }
    return 0;
}

function SQueries(bot, message, q) {
switch(q) {
	case "what in the hell are you?":
	    message.channel.send(message.author + " Well I like making beats... so I guess I'm a Beat Rat.");
	    break;
	case "hack the FBI":
	    message.channel.send("Hacking in progress...");
	    setTimeout(vic, 3000, bot, message);
	    break;
	case "when is monday?":
		var ltm = leftToMonday();
		message.channel.send("Time until next Monday: " + Math.floor(ltm/1000/60/60/24) + " days " + Math.floor(ltm/1000/60/60%24) + " hours " + Math.floor(ltm/1000/60%60) + " minutes.");
	    break;
	case "shadow masters":
		268209621724823554
	    //bot.channels.get("498430362225999873").send("VICTOR YOU ARE THE ONLY ONE WHO CAN SEE THIS MESSAGE RIGHT NOW EVERYONE ELSE JUST SEES A HALARIOUS GARFIELD MEME. YOU WILL CEASE YOUR INVESTIGATIONS IMMEDIATELY OR THE SHADOW MASTERS WILL NOT BE KIND IN THEIR JUDGEMENT. WHEN THE TIME COMES WE WILL CONTACT YOU AGAIN. UNTIL THEN DON'T DRINK ANY TAP WATER HAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHA");
	    break;
	case "follow":
	    if (!(message.member)) {
    		message.channel.send("You must use voice commands from a server (guild)");
    		break;
	    }
	    if (followee != null) {
    		message.channel.send("I am already following " + followee.id + " they must unfollow me first.");
    		break;
	    }
	    message.channel.send("Following " + message.author);
	    followee = message.author;
	    //console.log("Following " + followee.id);
	    // check if they are already in a channel
	    if (message.member.voiceChannel) {
		message.member.voiceChannel.join()
			.then(connection => {
				myVoiceChannel = message.member.voiceChannel;
				myVoiceConnection = connection;
				console.log("Connected to " + myVoiceChannel.name); })
			.catch(console.error);
	    }
	    break;

	case "unfollow":
	    if (!(message.member)) {
    		message.channel.send("You must use voice commands from a server (guild)");
    		return;
	    }
	    if (followee != null && message.author.id == followee.id) {
            followee = null;
            message.channel.send("Stopped following you.");
	    } else {
            message.channel.send("I am following " + followee.id + " they must unfollow me themselves.");
	    }
	    break;

	case "summon":
	    if (!(message.member)) {
    		message.channel.send("You must use voice commands from a server (guild)");
    		break;
	    }
	    if (followee != null && myVoiceChannel != null) {
    		message.channel.send("I'm already following and summoned to " + myVoiceChannel.name);
    		break;
	    }
	    // go directly to caller's channel
	    if (message.member.voiceChannel) {
    		message.member.voiceChannel.join()
    			.then(connection => {
    				myVoiceChannel = message.member.voiceChannel;
    				myVoiceConnection = connection;
    				console.log("Connected to " + myVoiceChannel.name); })
                .catch(console.error);
	    }
	    break;

	case "unsummon":
	    if (!(message.member)) {
    		message.channel.send("You must use voice commands from a server (guild)");
    		break;
	    }
	    // desummon from anywhere/anyone?
	    // except if im following someone
	    if (followee != null && followee.id != message.member.id) {
    		message.channel.send("I'm already following " + followee.id);
    		break;
	    }
	    if (myVoiceChannel != null) {
    		myVoiceChannel.leave();
    		myVoiceChannel = null;
    		if (myDispatcher != null) {
    			myDispatcher.end();
    			playing = false;
    		}
	    }
	    break;

	case "listen":
	    if (!(message.member)) {
    		message.channel.send("You must use voice commands from a server (guild)");
    		break;
	    }
	    if (myVoiceChannel == null) {
    		message.channel.send("I have nothing to listen to :(");
    		break;
	    }
	    if (listening == true) {
    		message.channel.send("I am already listening");
    		break;
	    }

        // how to stop stop spam?
	    message.channel.send("This doesn't work right now, sorry.");
	    break;

	    myVoiceConnection.on('speaking', (user, speaking) => {
            if (speaking) {
                message.channel.send("Listening to " + user.username);

                myReceiver = myVoiceConnection.createReceiver();
                myAudioStream = myReceiver.createPCMStream(user);
                const outputStream = generateOutputFile(myVoiceChannel, user)

        		// pipe audio data to fs
        		myAudioStream.pipe(outputStream);
        		outputStream.on("data", console.log);

        		myAudioStream.on("end", () => {
        		    message.channel.send("Finished listening to " + user.username);
        		});
            }
	    });
	    listening = true;
	    message.channel.send("Listening to " + myVoiceChannel.name);
	    break;

	case "stop listen":
	    if (!(message.member)) {
            message.channel.send("You must use voice commands from a server (guild)");
            break;
	    }
	    if (myVoiceChannel == null) {
            message.channel.send("I'm not even in a voice channel, how could I be listening to you?");
            break;
	    }
	    if (listening == false) {
            message.channel.send("I haven't even started listening yet.");
            break;
	    }
	    // myAudioStream.end();
	    myAudioStream = null;
	    myReceiver.end();
	    myReciever = null;
	    listening = false;
	    message.channel.send("I won't listen anymore.");
	    break;

	case "what is your current geopolitical stance?":
	    var stance;
	    switch (Math.floor(Math.random() * 6) + 1) {
		case 1:
			stance = "State enforced curfews for DnD sessions";
			break;
		case 2:
			stance = "Travel to Egypt and defeat Dio";
			break;
		case 3:
			stance = "Real communism has never been tried";
			break;
		case 4:
			stance = "Cash rules everything around me";
			break;
		case 5:
			stance = "Dab on em with dem tariffs \:trumpdab:";
			break;
		case 6:
			stance = "Undefined";
			break;
	    }

	    message.channel.send(message.author + " " + stance);
	    break;

	case "play":
	    if (!(message.member)) {
		message.channel.send("You must use voice commands from a server (guild)");
	    }
	    if (myVoiceChannel == null) {
		message.channel.send("I'm not even in call, but i'm down to jam later.");
	    }
	    if (playing == false) {
		playing = true;
			try {
				if (myDispatcher != null) throw "Already playing, playing flag incorrectly managed";
					myDispatcher = myVoiceConnection.playFile('./resources/Bad Dog No Biscuits.mp3');
					myDispatcher.setVolume(defaultVolume);
				myDispatcher.on('finish', () => {
					console.log('Finished');
					bispatcher.destroy();
				});
				playing = true;
				myDispatcher.on("end", end => {playing = false});
			} catch(e) {
				console.log("Audio failed: " + e.message);
			}
	    } else {
            message.channel.send("I'm already playing something and have no queue function.");
	    }
	    break;

	case "pause":
	    if (!(message.member)) {
    		message.channel.send("You must use voice commands from a server (guild)");
    		break;
	    }
	    if (myVoiceChannel == null) {
    		message.channel.send("I'm not even in a voice channel");
    		break;
	    }
	    if (myDispatcher != null && playing == true) {
    		myDispatcher.pause();
    		playing = false;
	    }
	    break;

	case "resume":
	    if (!(message.member)) {
    		message.channel.send("You must use voice commands from a server (guild)");
    		break;
	    }
	    if (myVoiceChannel == null) {
    		message.channel.send("I'm not even in call");
    		break;
	    }
	    if (myDispatcher != null) {
    		myDispatcher.resume();
    		playing = true;
	    } else {
            message.channel.send("I have nothing to resume, " + message.author);
	    }
	    break;

	case "stop":
	    if (!(message.member)) {
    		message.channel.send("You must use voice commands from a server (guild)");
    		break;
	    }
	    if (myVoiceChannel == null) {
    		message.channel.send("I'm not even in call");
    		break;
	    }
	    if (myDispatcher != null) {
    		myDispatcher.end();
    		myDispatcher = null;
    		playing = false;
	    } else {
            message.channel.send("I have nothing to stop, " + message.author);
	    }
	    break;

	case "send me nudes":
	    message.channel.send(message.author + " ok cutie :kissing_heart:");
	    fs.readdir(rsDir + "meme/", (err, files) => {
		message.author.send(new Discord.Attachment(rsDir + "meme/" + files[ Math.floor(files.length * Math.random()) ]));
	    });
	    //message.author.send(new Discord.Attachment("./resources/fear.jpg"));
	    break;

	case "react":
	    if (toggleReact) {
	    	message.channel.send(message.author + " Ok, i'll stop");
	    } else {
            message.channel.send(message.author + " ready to \:trumpdab: on 'em");
	    }
	    toggleReact = !(toggleReact);
	    break;

	case "help":

	    fs.readFile(rsDir + "help2.txt", (err, data) => {
		if (data) {
			message.author.send({embed: {
			"title": "BeatRatBot Command list",
			"color": 3447044,
			"description": "*All Commands issued with a message starting with @BeatRatBot* \n" + data.toString()}});

		} else {
            message.author.send("Something went wrong");
		}
	    });
	    break;

    // Wildcards?
	case "ballad of amoor":
	case "ballad of Amoor":
	case "Ballad of amoor":
	case "Ballad of Amoor":
	    fs.readFile(rsDir + "ballad_of_Amoor.txt", (err, data) => { message.channel.send(data.toString(), {tts:true, split:true} ); } );
	    break;

	default:
        return 0;
	}
    return 1;
}

function Emoji_react(bot, msg) {
    m = msg.cleanContent;
    if ( m.match(/beat/i) || m.match(/rat/i) ) {
        msg.react(bot.emojis.find("name", "beatrat").id);
    }
    if ( m.match(/dab/i)  ) {
        msg.react(bot.emojis.find("name", "squidwarddab").id);
        msg.react(bot.emojis.find("name", "trumpdab").id);
    }
    if ( m.match(/ranch/i) || m.match(/bird/i) || m.match(/ up/i) ) {
        msg.react(bot.emojis.find("name", "ranch").id);
    }
    if ( m.match(/gay/i) || m.match(/kiss/i) ) {
        msg.react(bot.emojis.find("name", "gayboys").id);
    }
    if ( m.match(/smoke/i) || m.match(/toke/i) ) {
        msg.react(bot.emojis.find("name", "smoke").id);
    }
    if ( m.match(/yeet/i) || m.match(/lit/i) ) {
        msg.react(bot.emojis.find("name", "yeet").id);
    }
    if ( m.match(/do it to em/i) || m.match(/swag/i) ) {
        msg.react(bot.emojis.find("name", "doittoem").id);
    }
    if ( m.match(/ettang/i) || m.match(/thug/i) || m.match(/vic/i) || m.match(/gtx/i) ) {
        msg.react(bot.emojis.find("name", "bigVic").id);
    }
    if ( m.match(/noodle/i) || m.match(/goof/i) ) {
        msg.react(bot.emojis.find("name", "noodle").id);
    }
    if ( m.match(/skip/i) || m.match(/dish/i)) {
        msg.react(bot.emojis.find("name", "skip").id);
    }
    if ( m.match(/frog/i) || m.match(/jam/i)) {
        msg.react(bot.emojis.find("name", "frogthejam").id);
    }
    if ( m.match(/cute/i) || m.match(/sex/i) ){
        msg.react(bot.emojis.find("name", "princess_gallarza").id);
    }
    if ( m.match(/whip/i) || m.match(/mayo/i) ){
        msg.react(bot.emojis.find("name", "whip").id);
    }
    if ( m.match(/fail/i) || m.match(/fall/i) || m.match(/jarrett/i) ){
        msg.react(bot.emojis.find("name", "jarrettfish").id);
    }
    if ( m.match(/disguise/i) || m.match(/myster/i) || m.match(/who/i) || m.match(/shh/i) ){
        msg.react(bot.emojis.find("name", "disguised").id);
    }
    if ( m.match(/sick/i) || m.match(/cool/i) || m.match(/dope/i) ) {
        msg.react(bot.emojis.find("name", "gnarly").id);
    }
    if ( m.match(/kill/i) || m.match(/die/i) || m.match(/death/i) ) {
        msg.react(bot.emojis.find("name", "skulled").id);
    }
    if ( m.match(/yogurt/i) || m.match(/milk/i) || m.match(/bronn/i) ) {
        msg.react(bot.emojis.find("name", "bronnPog").id);
    }
    if ( m.match(/shrek/i) || m.match(/green/i) ) {
        msg.react(bot.emojis.find("name", "joshrek").id);
    }
    if ( m.match(/amoor/i) || m.match(/legend/i) ) {
        msg.react(bot.emojis.find("name", "MattPog").id);
    }
    if ( m.match(/ko/i) || m.match(/sleep/i) || m.match(/boring/i) ) {
        msg.react(bot.emojis.find("name", "nichoKO").id);
    }
    if ( m.match(/meme/i) || m.match(/dank/i) || m.match(/woke/i) ) {
        msg.react(bot.emojis.find("name", "gnomeChild").id);
    }
    if ( m.match(/computer/i) || m.match(/big/i) || m.match(/omg/i) ) {
        msg.react(bot.emojis.find("name", "agentIudiciani").id);
    }
    if ( m.match(/stogie/i) || m.match(/hide/i) || m.match(/ball/i) ) {
        msg.react(bot.emojis.find("name", "ballsy").id);
    }
    if ( m.match(/melee/i) ) {
        msg.react(bot.emojis.find("name", "protmelee").id);
    }
    if ( m.match(/mage/i) || m.match(/magic/i)) {
        msg.react(bot.emojis.find("name", "protmage").id);
    }
    if ( m.match(/range/i) ) {
        msg.react(bot.emojis.find("name", "protmissles").id);
    }
    if ( m.match(/ian/i) || m.match(/fishingfreak/i) || m.match(/malakeith/i) || m.match(/schem/i)) {
        msg.react(bot.emojis.find("name", "flyingfreak").id);
    }
    if ( m.match(/brayden/i) || m.match(/rolorox/i) || m.match(/gargo/i) || m.match(/wow/i) || m.match(/whoa/i) ) {
        msg.react(bot.emojis.find("name", "braydenPog").id);
    }
    if ( m.match(/nicho/i) || m.match(/neekso/i) || m.match(/damn/i) ) {
        msg.react(bot.emojis.find("name", "doittoem").id);
    }
    if ( m.match(/steve/i) || m.match(/onion/i) ) {
        msg.react(bot.emojis.find("name", "stevePog").id);
        msg.react(bot.emojis.find("name", "joshrek").id);
    }
    if ( m.match(/jojo/i) || m.match(/rune/i) || m.match(/scape/i) || m.match(/whom/i) ) {
        msg.react(bot.emojis.find("name", "stevethink").id);
    }
    if ( m.match(/personal/i) || m.match(/trap/i) || m.match(/watch this/i) ) {
        msg.react(bot.emojis.find("name", "animeglasses").id);
    }
    if ( m.includes("?") || m.match(/hmm/i) || m.match(/think/i) ) {
        msg.react("🤔");
    }
    if ( m.match(/duck/i) ) {
        msg.react("🦆");
    }
    if ( m.match(/bone/i) ) {
        msg.react(bot.emojis.find("name", "philmnm").id);
    }
    if ( m.match(/100/i) || m.match(/a1/i)) {
        msg.react("💯");
    }
    if ( m.match(/b/i) || m.match(/🅱/i) ) {
        msg.react("🅱");
    }
    if ( m.match(/\$/i) || m.match(/cash/i) || m.match(/money/) ) {
        msg.react("💰");
    }
}

// Tract User in voice channel
bot.on("voiceStateUpdate", function(oldMember, newMember) {
  if (followee != null && followee.id === newMember.user.id) {
	if (typeof newMember.voiceChannel != 'undefined') {
	    newMember.voiceChannel.join()
		.then(connection => {
			myVoiceChannel = newMember.voiceChannel;
			console.log("Connected to " + myVoiceChannel.name); })
		.catch(console.error);
	} else if (myVoiceChannel != null) {
		myVoiceChannel.leave();
		myVoiceChannel = null;
		if (myDispatcher != null) {
			myDispatcher.end()
			myDispatcher = null;
			playing = false;
		}
	}
  }
});

bot.on("error", function(error) {
  console.log("ERROR event occurred:\n" + error.message);
  if (error.message.contains == "ECONNRESET") {
	console.log("Attempting to reconnect...");
	bot.setInterval(bot.login, 5000, Auth.token);
  }
});

