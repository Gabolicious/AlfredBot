let LastPerson = "439959655448313866"; //Last person to send a message to the one word story channel in PIGS discord
const botconfig = require("./botconfig.json");
const Discord = require("discord.js");
const fs = require("fs");
const mysql = require("mysql")
const authentication = require("./authentication");
const {
    google
} = require('googleapis'); //allows you to use googles api
const con = mysql.createConnection({ //connect to database
    host: "localhost",
    user: "root",
    password: "admin",
    database: "rc"
});

con.connect(function (err) { //perform connection
    if (err) throw err;
    console.log("Connected to SQL!")
})

const bot = new Discord.Client({
    partials: ['REACTION', "MESSAGE"],
    presence: {status: "online", activity: {
        application: {id: "487059411001540618"},
        name: "Transport Tycoon",
        type: "PLAYING"
    }}
}) //declares new bot that can't @ everyone

bot.con = con; //save connection to bot so i can access in commands

bot.RTSCommands = new Discord.Collection(); //Store all commands inside a discord collection
bot.PIGSCommands = new Discord.Collection();
bot.BothCommands = new Discord.Collection();

bot.login(botconfig.token) //logs in the bot with the token found in botconfig.json



fs.readdir("./Bothcommands/", (err, files) => { //Gets all files in the Bothcommands folder
    if (err) console.log(err);
    const jsfile = files.filter(f => f.split(".").pop() == "js") //only finds files that are .js
    if (jsfile.length <= 0) { //if there aren't any files in folder
        console.log("Couldn't find any BOTH commands");
        return;
    }

    jsfile.forEach((f, i) => { //For each js file in the folder
        const props = require(`./Bothcommands/${f}`); //loads the file (module.exports)
        console.log(`BOTH ${f} loaded!`); //Logs that it got the file correctly
        bot.BothCommands.set(props.help.name, props); //adds to the discord collection with key props.help.name and then value props
    });
})
fs.readdir("./RTScommands/", (err, files) => { //Gets all files in the RTScommands folder
    if (err) console.log(err);
    const jsfile = files.filter(f => f.split(".").pop() == "js") //only finds files that are .js
    if (jsfile.length <= 0) { //if there aren't any files in folder
        console.log("Couldn't find RTS commands");
        return;
    }

    jsfile.forEach((f, i) => { //For each js file in the folder
        const props = require(`./RTScommands/${f}`); //loads the file (module.exports)
        console.log(`RTS ${f} loaded!`) //logs that it got the file correctly
        bot.RTSCommands.set(props.help.name, props); //adds to the discord collection with key props.help.name and then value props
    });
});

fs.readdir("./PIGScommands/", (err, files) => {
    if (err) console.log(err);
    const jsfile = files.filter(f => f.split(".").pop() == "js") //Only finds files that are .js
    if (jsfile.length <= 0) { //if there aren't any files in folder
        console.log("Couldn't find PIGS commands");
        return;
    }

    jsfile.forEach((f, i) => { //For each js file in the folder
        const props = require(`./PIGScommands/${f}`); //Loads the file (module.exports)
        console.log(`PIGS ${f} loaded!`) //Logs that it got the file correctly
        bot.PIGSCommands.set(props.help.name, props); //adds to the discord collection with key props.help.name and then value props
    });
});

bot.on("ready", async () => { //When the bot logs in
    // bot.user.setActivity("Transport Tycoon", {
    //     type: "PLAYING"
    // }); //sets the current game. Can be PLAYING STREAMING WATCHING LISTENING

    bot.channels.cache.get(botconfig.RTSCEOSpamChannel).send("Restarted."); //Send a message to a channel

    console.clear(); //Remove all the loaded console logs
    console.log(`${bot.user.username} is online!`); //logs that the bot is online


});

bot.on("messageDeleteBulk", async messages => { //When multiple messages are deleted (.clear)
    let DeletedMessages = new Discord.MessageEmbed()
        .setTitle("Deleted Messages")
        .setColor("RANDOM")
    messages.forEach(async message => { //loop through all the deleted messages
        if (message.partial) await message.fetch()
        if (message.content) DeletedMessages.addField(message.member.displayName, message.content, true)
    });

    if (messages.array()[0].guild.id == botconfig.PIGSServer) { //if the first message is in the PIGS server (then all messages are in pigs server)
        bot.channels.cache.get(botconfig.PIGSLogs).send(DeletedMessages); //send to pigs logs channel
    } else if (messages.array()[0].guild.id == botconfig.RTSServer) { //rts server
        bot.channels.cache.get(botconfig.RTSLogs).send(DeletedMessages); //send to rts logs channel
    }
})

bot.on("messageDelete", async (message) => { //When a single message is deleted
    if (message.partial) await message.fetch()
    let DeletedMessage = new Discord.MessageEmbed() //same as messageDeleteBulk except don't have to loop through multiple messages
        .setTitle("Deleted Message")
        .setColor("RANDOM")
        .addField("Author", message.author)
        .addField("Content", message.content)
        .addField("Channel", message.channel)

    if (message.guild.id == botconfig.PIGSServer) {
        bot.channels.cache.get(botconfig.PIGSLogs).send(DeletedMessage)
    } else if (message.guild.id == botconfig.RTSServer) {
        bot.channels.cache.get(botconfig.RTSLogs).send(DeletedMessage)
    }
})

bot.on("guildMemberAdd", async member => { //When someone joins the guild
    if (member.user.bot) { //if its a bot
        if (member.guild.id == botconfig.RTSServer) { //joined rts server
            return member.roles.add(botconfig.RTSBotRole) //Adds the rts bot role and ends
        } else if (member.guild.id == botconfig.PIGSServer) { //joined pigs server
            return member.roles.add(botconfig.PIGSBotRole) //adds pigs bot role and ends
        }
    }
    if (member.guild.id == botconfig.RTSServer) { //rts server and not bot
        bot.channels.cache.get(botconfig.RTSWelcome).send(`Welcome to ${member.guild.name} ${member}!`) //Says welcome in the rts server
        member.roles.add(botconfig.RTSGuestRole)
    } else if (member.guild.id == botconfig.PIGSServer) { //pigs commands
        bot.channels.cache.get(botconfig.PIGSWelcome).send(`Welcome to ${member.guild.name} ${member}!`) //Says welcome in the pigs server
        member.roles.add(botconfig.PIGSGuestRole)
    }
})

bot.on("guildMemberRemove", async member => { //When someone leaves the server
    if (member.guild.id == botconfig.RTSServer) { //rts server
        bot.channels.cache.get(botconfig.RTSWelcome).send(`${member} (${member.displayName}) has left the server.`); //says that the username has left. Doesn't @ in case they change their name and also is glitchy sometimes
    } else if (member.guild.id == botconfig.PIGSServer) {
        bot.channels.cache.get(botconfig.PIGSWelcome).send(`${member} (${member.displayName}) has left the server.`); //says that the username has left. Doesn't @ in case they change their name and also is glitchy sometimes
    }
})

bot.on("message", async message => { //Someone sends a message in a channel
    if (message.partial) await message.fetch()
    ProcessMessage(message)
});

bot.on("messageUpdate", async (oldMessage, newMessage) => {
    if (newMessage.partial) newMessage.fetch()
    ProcessMessage(newMessage)
})

async function ProcessMessage(message) {
    if (message.author.bot || message.channel.type == "dm") return; //if message is from a bot or is in a DM with the bot
    if (message.channel.id == botconfig.PIGSOneWordStory) { //If its in the one word story channel
        if ((message.content.split(" ").length > 1 || message.content.split("-").length > 1 || message.content.split("_").length > 1) || message.content.includes(":")) { //if the message contains an emoji or is more than one word
            message.delete() //deletes it
        } else if (LastPerson == message.member.id) message.delete() //if the last person to send a message is also the person then delete it
        else LastPerson = message.member.id; //if its one word and a new person then don't delete it and set the last person to the new person
    }
    if (message.content.includes("https://discord.gg/") && !message.member.hasPermission("KICK_MEMBERS")) { //if the message has a discord invite and its not from a manager
        message.delete() //delete it
        message.channel.send("No invites plz and thx")
    }

    if (message.guild.id == botconfig.PIGSServer) var prefix = botconfig.prefix.PIGS //in case of a different prefix for each server
    else if (message.guild.id == botconfig.RTSServer) var prefix = botconfig.prefix.RTS
    const messageArray = message.content.split(' '); //splits the message into an array for every space into an array
    const cmd = messageArray[0].toLowerCase(); //command is first word in lowercase
    const args = messageArray.slice(1); //args is everything after the first word
    if (message.mentions.members.size > 0 && message.mentions.members.first().id == "472060657081122818") {
        message.channel.startTyping(); //start type in the channel
        await bot.BothCommands.get("ask").run(bot, message, args)
        message.channel.stopTyping(true) //stops typing in the channel after the command finishes
    }
    if (!message.content.startsWith(prefix)) return; //if it doesn't start with the prefix

    if (message.guild.id == botconfig.RTSServer) { //if said in the rts server
        const AllowedRTSCommands = [".status", ".8ball", ".ud", ".hello"]

        var commandfile = bot.RTSCommands.get(cmd.slice(prefix.length)); //Trys to get a rts command with the specified cmd without the prefix
        if (commandfile && (message.channel.id != botconfig.RTSPublicBotCommandsChannel && message.channel.id != botconfig.RTSBotCommandsChannel && message.channel.id != botconfig.RTSBennysChannel) && !message.member.hasPermission("KICK_MEMBERS") && !AllowedRTSCommands.includes(cmd)) return message.channel.send(`Do this in <#${botconfig.RTSPublicBotCommandsChannel}> or <#${botconfig.RTSBotCommandsChannel}>`) //if theres a command but its not in one of the allowed channels
        if (commandfile) console.log("RTS", commandfile.help.name, args) //if theres a command file then log that its rts and then the name and args
        else if (cmd.slice(prefix.length) == "vouchers") commandfile = bot.RTSCommands.get("voucher")
    } else if (message.guild.id == botconfig.PIGSServer) { //if said in the pigs server
        const AllowedPIGSCommands = [".status", ".8ball", ".ud", ".hello"]

        var commandfile = bot.PIGSCommands.get(cmd.slice(prefix.length)); // try to get a pigs command with the specified cmd without the prefix
        if (commandfile && (message.channel.id != "511853214858084364" && message.channel.id != botconfig.PIGSBotCommandsChannel && message.channel.id != botconfig.PIGSVoucherChannel) && !message.member.hasPermission("KICK_MEMBERS") && !AllowedPIGSCommands.includes(cmd)) return message.channel.send(`Do this in ${botconfig.PIGSBotCommandsChannel} instead`) //if theres a command but its said in the wrong channel
        if (commandfile) console.log("PIGS", commandfile.help.name, args) //if theres a command file then log that its pigs and then the name and args
        else if (cmd.slice(prefix.length) == "voucher") commandfile = bot.PIGSCommands.get("vouchers")

    }
    if (!commandfile) { //if theres isn't a pigs or rts command
        var commandfile = bot.BothCommands.get(cmd.slice(prefix.length)) //try to get a both server command with the specified cmd without the prefix
        if (commandfile) console.log("BOTH", commandfile.help.name, args) //logs that theres a command file
    }
    if (commandfile) { //if theres a command file in both, rts, or pigs
        message.channel.startTyping(); //start type in the channel
        await commandfile.run(bot, message, args); //if there is a command in the bot it runs the module.exports.run part of the file.
        message.channel.stopTyping(true) //stops typing in the channel after the command finishes
    }
}

bot.on("presenceUpdate", (oldPresence, newPresence) => { //When a guild member's presence changes (online/offline or games)
    if (!oldPresence) return;
    if (oldPresence.member.hasPermission("KICK_MEMBERS") && newPresence.guild.id == botconfig.PIGSServer && !newPresence.user.bot) { //if its a pigs manager and the update is triggered in the pigs server
        if (newPresence.status == "offline" && !newPresence.member.roles.cache.has(botconfig.PIGSUnavailableRole)) return newPresence.member.roles.add(botconfig.PIGSUnavailableRole) // if they are now offline and don't have the pigs unavailable role, add the unavailable role
        else if (newPresence.status == "online" && newPresence.member.roles.cache.has(botconfig.PIGSUnavailableRole) && (newPresence.member.id == botconfig.AltTabsID || newPresence.member.id == "330015505211457551" || newPresence.member.id == "164326090825793536")) return newPresence.member.roles.remove(botconfig.PIGSUnavailableRole) //If they are now online and have the unavailable role and are alt tabs or solid 2 hours it will auto make em available
    } else if (oldPresence.member.hasPermission("KICK_MEMBERS") && newPresence.guild.id == botconfig.RTSServer) { //if its a rts manager and the update is triggered in the rts server
        if (newPresence.status == "offline" && !newPresence.member.roles.cache.has(botconfig.RTSUnavailableRole)) return newPresence.member.roles.add(botconfig.RTSUnavailableRole) //If they are offline now and don't have the unavailable role it adds it
    }

    if (oldPresence.member.roles.cache.has(botconfig.RTSGuestRole) || oldPresence.guild.id == botconfig.PIGSServer) return; //if its a guest or is in the pigs server stop the command

    if (newPresence.user.presence.activities[0] && newPresence.user.presence.activities[0].name == "Transport Tycoon") { //If they are playing a game and the games name is Transport Tycoon
        oldPresence.member.roles.add(botconfig.RTSFiveMRole); //adds the fivem role
    } else if (!newPresence.user.presence.activities && newPresence.member.roles.cache.has(botconfig.RTSFiveMRole)) { //If they aren't playing a game but have the fivem role
        newPresence.member.roles.remove(botconfig.RTSFiveMRole); //removes role
    }
});

bot.on("message", async message => { //When a message is sent to a channel. Not in the other bot.on message because its easier to read
    if (message.partial) await message.fetch()
    if (message.author.bot || message.author.id == botconfig.GlitchDetectorID || !message.mentions.members) return; //if its from a bot or is from glitch himself
    message.mentions.members.forEach(function (Mention) { //go through all the mentions in the message
        if (Mention.user.id == botconfig.GlitchDetectorID) { //if they mentioned glitch
            message.delete() //delete the message

            let GlitchEmbed = new Discord.MessageEmbed() //make an embed with info about the message
                .setColor("#bc0000")
                .setTitle("Pinged Glitch")
                .addField("Author", message.member.displayName)
                .addField("Message", message.content)
                .addField("Date", message.createdAt)
                .addField("In Channel", message.channel)

            if (message.guild.id == botconfig.RTSServer) bot.channels.cache.get(botconfig.RTSLogs).send(GlitchEmbed) //if its in rts send to rts logs
            else if (message.guild.id == botconfig.PIGSServer) bot.channels.cache.get(botconfig.PIGSLogs).send(GlitchEmbed) //if its in pigs send to pigs logs
        }
    })
})
let LatestFeedID = 0;
bot.on("message", async message => {
    if (message.partial) await message.fetch()
    if (message.channel.id == "630947095456514077" && (message.author.id == "404650985529540618" || message.author.id == "330000865215643658" || message.author.id == "453742447483158539")) {
        if (parseInt(message.content)) {
            authentication.authenticate().then(async (auth) => {
                const sheets = google.sheets({
                    version: 'v4',
                    auth
                });

                sheets.spreadsheets.values.append({ //append all the hired people
                    auth: auth,
                    spreadsheetId: botconfig.BabySheet,
                    range: "B3:D9999",
                    valueInputOption: "USER_ENTERED",
                    insertDataOption: "OVERWRITE",
                    includeValuesInResponse: true,
                    resource: {
                        majorDimension: "ROWS",
                        values: [
                            [new Date().toDateString(), new Date().toLocaleTimeString(), message.content]
                        ]
                    }
                }, function (err, response) {
                    if (err) return console.log(err)
                    message.channel.send("GOO GOO GAA GAA THANKS FOR THE SUSTENANCE")

                    sheets.spreadsheets.values.batchGet({ //get spreadsheet range
                        spreadsheetId: botconfig.BabySheet,
                        ranges: ["H2", "J2", "J5"],
                        valueRenderOption: "UNFORMATTED_VALUE",
                        dateTimeRenderOption: "FORMATTED_STRING",
                        auth: auth
                    }, (err, res) => {
                        if (err) {
                            channel.send(`The API returned an ${err}`);
                            return;
                        }
                        const FoodThresh = res.data.valueRanges[0].values[0]
                        const SoonPing = res.data.valueRanges[1].values[0] * 60000
                        const LongPing = res.data.valueRanges[2].values[0] * 60000

                        const FeedID = LatestFeedID + 1;

                        LatestFeedID = FeedID;

                        if (parseInt(message.content) < FoodThresh) {
                            setTimeout(() => {
                                if (LatestFeedID == FeedID) message.channel.send("<@453742447483158539> GOO GOO GAA GAA FEED ME IM STARVING")
                            }, SoonPing);
                        } else {
                            setTimeout(() => {
                                if (LatestFeedID == FeedID) message.channel.send("<@453742447483158539> GOOD GOOD GAA GAA FEED ME IN GONNA DIE SOON")
                            }, LongPing);
                        }

                    })
                })
            })
            return;
        }
        switch (message.content.toLowerCase()) {
            case "recent":
                authentication.authenticate().then(async (auth) => {
                    const sheets = google.sheets({
                        version: 'v4',
                        auth
                    });

                    sheets.spreadsheets.values.get({ //get spreadsheet range
                        spreadsheetId: botconfig.BabySheet,
                        range: "B3:D9999",
                    }, (err, res) => {
                        if (err) {
                            channel.send(`The API returned an ${err}`);
                            return;
                        }

                        const rows = res.data.values;
                        if (rows.length) {
                            const BabyEmbed = new Discord.MessageEmbed()
                                .setTitle("Baby Food")

                            for (let i = rows.length - 1; i > rows.length - 6 && i > -1; i--) {
                                BabyEmbed.addField(`${rows[i][0]} at ${rows[i][1]}`, rows[i][2])
                            }

                            message.channel.send(BabyEmbed)
                        }

                    })
                })
                break;
        }

    }
})

bot.on("messageReactionAdd", async (reaction, user) => {
    if (reaction.message.partial) await reaction.message.fetch();

    const fakeMessage = {
        "mentions": {
            "members": new Discord.Collection()
        },
        "guild": reaction.message.guild,
        "channel": user,
        "member": reaction.message.guild.members.cache.get(user.id)
    }
    switch (reaction.message.id) {
        case "705249775984836640":
        case "705179916915834891":
            //Refresh Roles
            bot.BothCommands.get("roles").run(bot, fakeMessage, [])
            break;
        case "705179978706190467":
            //ATS
            bot.RTSCommands.get("ats").run(bot, fakeMessage, [])
            break;
        case "705180001229865001":
            //ETS2
            bot.RTSCommands.get("ets2").run(bot, fakeMessage, [])
            break;
        case "705180042644422696":
            //NSFW
            bot.RTSCommands.get("owo").run(bot, fakeMessage, [])
            break;
        case "705180148650999869":
            //Warzone
            bot.RTSCommands.get("warzone").run(bot, fakeMessage, [])
            break;
        case "705249848810799186":
            //PIGS NSFW
            bot.PIGSCommands.get("kys").run(bot, fakeMessage, [])
            break;
        case "705249920013303848":
            //Warthogs
            bot.PIGSCommands.get("warthogs").run(bot, fakeMessage, [])
            break;
        case "705251722557128725":
            //Voucher
            const botCommandsChannel = reaction.message.guild.channels.cache.get("483312512217907220")
            fakeMessage.channel = botCommandsChannel
            bot.RTSCommands.get("voucher").run(bot, fakeMessage, [])
            reaction.remove()
            botCommandsChannel.send(`${user}`)
            break;
        case "705253371468185651":
            //Voucher
            const pigsBotChannel = reaction.message.guild.channels.cache.get("487621053494067200")
            fakeMessage.channel = pigsBotChannel
            bot.PIGSCommands.get("vouchers").run(bot, fakeMessage, [])
            reaction.remove()
            pigsBotChannel.send(`${user}`)
            break;
    }
    //if (reaction.partial) await reaction.fetch()
})

bot.on("messageReactionRemove", async (reaction, user) => {
    if (reaction.message.partial) await reaction.message.fetch();

    const fakeMessage = {
        "mentions": {
            "members": new Discord.Collection()
        },
        "guild": reaction.message.guild,
        "channel": user,
        "member": reaction.message.guild.members.cache.get(user.id)
    }
    switch (reaction.message.id) {
        case "705179978706190467":
            //ATS
            bot.RTSCommands.get("ats").run(bot, fakeMessage, [])
            break;
        case "705180001229865001":
            //ETS2
            bot.RTSCommands.get("ets2").run(bot, fakeMessage, [])
            break;
        case "705180042644422696":
            //NSFW
            bot.RTSCommands.get("owo").run(bot, fakeMessage, [])
            break;
        case "705180148650999869":
            //Warzone
            bot.RTSCommands.get("warzone").run(bot, fakeMessage, [])
            break;
        case "705249848810799186":
            //PIGS NSFW
            bot.PIGSCommands.get("kys").run(bot, fakeMessage, [])
            break;
        case "705249920013303848":
            //Warthogs
            bot.PIGSCommands.get("warthogs").run(bot, fakeMessage, [])
            break;
    }
    //if (reaction.partial) await reaction.fetch()
})

bot.on("error", (error) => { //when theres a discord error
    console.log(error)
})

bot.on("shardDisconnect", (event, shardID) => { //when the bot disconnects
    bot.login(botconfig.token) //reconnect
})