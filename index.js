const Discord = require("discord.js");

require('dotenv').config();
const prefix= process.env.PREFIX;
const token= process.env.TOKEN;
var port = process.env.PORT || 1337;


const ytdl = require("ytdl-core");

const client = new Discord.Client();

const queue = new Map();

client.once("ready", () => {
    console.log("Ready to go, porg chicken pendejo!");
});

client.once("reconnecting", () => {
    console.log("Reconnecting porg chicken pendejo!");
});

client.once("disconnect", () => {
    console.log("Disconnecting porg chicken pendejo!");
});

client.on("message", async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const serverQueue = queue.get(message.guild.id);

    if (message.content.startsWith(`${prefix}play`)) {
        execute(message, serverQueue);
        return;
    }
    else if (message.content.startsWith(`${prefix}reset`)) {
        execute(message, undefined);
        return;
    }

    else if (message.content.startsWith(`${prefix}again`)) {
        play(message.guild, serverQueue.songs[0]);
        return;
    }
    else if (message.content.startsWith(`${prefix}skip`)) {
        skip(message, serverQueue);
        return;

    } else if (message.content.startsWith(`${prefix}stop`)) {
        stop(message, serverQueue);
        return;

    } else {
        message.channel.send("Enter a valid porg chicken command!");
    }
});

async function execute(message, serverQueue) {
    const args = message.content.split(" ");

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
        return message.channel.send(
            "Halt pendejo, you need to be in a porg voice channel!"
        );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.channel.send(
            "I need the permissions to join and speak in your porg channel!"
        );
    }

    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
        title: songInfo.title,
        url: songInfo.video_url
    };

    if (!serverQueue) {
        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };

        queue.set(message.guild.id, queueContruct);

        queueContruct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            play(message.guild, queueContruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    } else {
        serverQueue.songs.push(song);
        return message.channel.send(`${song.title} has been added to porg chicken queue!`);
    }
}

function skip(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send(
            "Halt pendejo, you need to be in a porg voice channel to skip the music!"
        );
    if (!serverQueue)
        return message.channel.send("Porg chicken has no songs to skip!");
    serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send(
            "Halt pendejo, you need to be in a porg voice channel to stop the music!"
        );
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection
        .play(ytdl(song.url))
        .on("finish", () => {
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

client.login(token);