const fs = require('fs');
const discord = require('discord.js');

// 1. function that is called when event occurs (created event embed, send accounting for channel), "deletes" its timeout and set Timeout for next (with monthly logic)
// 2. read from events "database" and setTimout for the events (with monthly logic) (account for duplicates, and cull events which have passed and don't repeat) rewrite updated events back (json).
// 3. when new event is set write into "Database"

// error handling:throw error back to command file
//      same throw risk as fs sync functions


// should there be an ignoreList to disallow spamming?
//      scheduler can make:
// visible events (listed publicly, sends to guild)
// hidden events (does not list, sends to guild)
// hidden private events (does not list, sends to DMs)
// visible* private events, (listed publicly, sends to DMs)

// How to Handle mentions?
// we need user.id, if in a guild we can make then @username and grab it
// if in DM they can't @username so we would have to grab it from the cache
//      but thats not guarenteed to have all users

module.exports = {
    // this adds the timeout to the client (always a normal timeout)
    // timeout calls procEvent which will set _destroyed (no _repeat)
    // mutually call createTimeout if repeat is desired calculating interval required for monthly repeat
    procEvent: (client, eventArgs) => {
        
    },
    createTimeoutSync: (client, eventArgs) => {
        // we want to send this event and then...

        // ... we want to setup the next one with createTimeout()
    },
    //
    listEventsSync(client, user = null) {
        // if user also check for private events
    },
    getEventSync(client, eventStr, user = null) {

    },
    deleteEventSync(client, eventStr) {

    },
    includeUserSync(client, user, eventStr) {

    },
    removeUserSync(client, user, eventStr) {

    },
    createEmbed(eventArgs) {
        const embed = new discord.MessageEmbed()
        if (eventArgs.name) embed.setTitle(eventArgs.name);
        if (eventArgs.authorName) embed.setFooter(eventArgs.authorName);
        if (eventArgs.attachmentURL) embed.setImage(eventArgs.attachmentURL);
        if (eventArgs.message) embed.setDescription(eventArgs.mentions.join(' ') + '\n' + eventArgs.message);
        embed.setTimestamp();
        
        return embed;
    }
}

//const events = new Set([...(msg.client._timeouts), ...(msg.client._intervals)]);