authorize url:
https://discord.com/oauth2/authorize?client_id=123456789012345678&scope=bot

misc features:
https://discordjs.guide/popular-topics/faq.html

encapsulating class for all the state variables?
-> just add to existing bot object

dynamic commands:
the commands folder creates a commands "module" or is the file the module?
The file is what is "required" so probably the file.
requiring recieves an object which we can use

exports keyword is an object that is exposed by require()ing that file
exports points? to module.exports so reassigning it will not be usable, but mutating it is, you can reassign module.exports

TODO:
schedule command
schedule refactor with database
schedule ignore? disallows getting spammed without having to block botrat
schedule set staging
botban command (disallow that user to use bot);
voice https://discordjs.guide/voice/
canvas fun? https://discordjs.guide/popular-topics/canvas.html#basic-image-loading
currency system https://discordjs.guide/sequelize/currency.html
about command couple with README?
command cooldown?