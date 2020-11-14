const fs = require('fs');

// 1. function that is called when event occurs (created event embed, send accounting for channel), "deletes" its timeout and set Timeout for next (with monthly logic)
// 2. read from events "database" and setTimout for the events (with monthly logic) (account for duplicates, and cull events which have passed and don't repeat) rewrite updated events back (json).
// 3. when new event is set write into "Database"

// error handling
// option 1: command file handles everything, this trusts completely
// option 2: throw error back to command file
//      same throw risk as fs sync functions
// option 3: accept callback and send (result, error)
//      same throw risk as fs async functions

// should there be an ignoreList to disallow spamming?
// should set in the command file stage creation to double check info with user?
//      events can be:
// public and visible
// public and hidden (surprise)
// private and visible to particpants, (if given event name you can signup)
// private and hidden (timed message)

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

    }
}

//const events = new Set([...(msg.client._timeouts), ...(msg.client._intervals)]);