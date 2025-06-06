const fs = require("fs");
const wiegine = require("ws3-fca");
const express = require("express");
const app = express();

const config = JSON.parse(fs.readFileSync("config.json", "utf8"));
const port = config.port || 3000;

// Load commands from the cmds folder
const commandFiles = fs.readdirSync('./cmds').filter(file => file.endsWith('.js'));
console.log("\n\n\n");
console.log("=====COMMANDS LOADED=====");
console.log("====={}=====");
commandFiles.forEach(file => {
    console.log(`[~] ${file.replace('.js', '')}`);
});
console.log("====={}=====");
console.log("\n\n\n");

// Load command modules into an object
const commands = {};
commandFiles.forEach(file => {
    const command = require(`./cmds/${file}`);
    commands[command.name] = command;
});

// Read the cookie string from appstate.txt
let cookie;
try {
    cookie = fs.readFileSync("appstate.txt", "utf8").trim();
    if (!cookie) throw new Error("appstate.txt is empty or invalid.");
} catch (error) {
    console.error("Failed to load a valid appstate.txt:", error);
    process.exit(1);
}

// Login using the raw cookie string
wiegine.login(cookie, {
    forceLogin: true,
    listenEvents: true,
    logLevel: "silent",
    updatePresence: true,
    bypassRegion: "PNB",
    selfListen: false,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:118.0) Gecko/20100101 Firefox/118.0",
    online: true,
    autoMarkDelivery: true,
    autoMarkRead: true
}, (err, api) => {
    if (err) return console.error("Login failed:", err);

    // Save the session (cookie) back to appstate.txt after login
    try {
        fs.writeFileSync("appstate.txt", cookie, "utf-8");
        console.log("Saved session cookie to appstate.txt");
    } catch (e) {
        console.error("Failed to save appstate.txt:", e);
    }

    // Function to change bot's bio
    function updateBotBio(api) {
        const bio = `Prefix: ${config.prefix}\nOwner: ${config.botOwner}`;
        api.changeBio(bio, (err) => {
            if (err) {
                console.error("Failed to update bot bio:", err);
            } else {
                console.log("Bot bio updated successfully.");
            }
        });
    }

    updateBotBio(api);
    console.log("[ Bilyabits-Hub ] Refreshing fb_dtsg every 1 hour");

    // Notify the user that the bot is online with basic information
    const adminUserThread = config.adminID;
    const botID = api.getCurrentUserID();
    api.sendMessage(`I am online!\nBot Owner Name: ${config.botOwnerName}\nBot ID: ${botID}`, adminUserThread);

    // Refresh fb_dtsg every hour
    const refreshInterval = 60 * 60 * 1000;
    setInterval(() => {
        if (api.refreshFb_dtsg) {
            api.refreshFb_dtsg();
            console.log("Refreshed fb_dtsg at:", new Date().toLocaleString());
        }
    }, refreshInterval);

    // Handle commands
    function handleCommand(event) {
        const prefix = config.prefix;
        const message = event.body;

        if (!message.startsWith(prefix)) return;

        const args = message.slice(prefix.length).split(/ +/);
        const commandName = args.shift().toLowerCase();

        if (!commandName) {
            api.sendMessage("No command input, please type `/help` for available commands.", event.threadID);
            return;
        }

        if (!commands[commandName]) {
            api.sendMessage("This command is not available or it is invalid.", event.threadID);
            return;
        }

        // Execute the command
        try {
            commands[commandName].execute(api, event, args);
        } catch (error) {
            console.error(`Error executing command ${commandName}:`, error);
            api.sendMessage(`There was an error executing the ${commandName} command.`, event.threadID);
        }
    }

    // Start listening for messages/events
    api.listenMqtt((err, event) => {
        if (err) return console.error("Error while listening:", err);

        console.log("Event received:", event);

        switch (event.type) {
            case "message":
                handleCommand(event);
                break;
            case "event":
                console.log("Other event type:", event);
                break;
        }
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Define a simple route
app.get("/", (req, res) => {
    res.send("Bot is running");
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
