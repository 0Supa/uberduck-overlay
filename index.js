const { port } = require('./config.json')
const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http, { path: `/tts/socket.io` })
const minify = require('express-minify');
const Redis = require("ioredis");
const redis = new Redis();
const uberduck = require('./uberduck')

app.use(minify())
app.use('/tts', express.static(__dirname + '/client'))

io.on('connection', (socket) => {
    socket.on('tts', async tts => {
        if (!tts.channelId || !tts.rewardId || !tts.text) return

        const voice = await redis.hget(`ttsv:${tts.channelId}`, tts.rewardId)
        if (!voice) return

        try {
            socket.emit('tts generating', { data: tts.data, voice })
            const uuid = await uberduck.queue(voice, tts.text)
            const res = await uberduck.getResult(uuid)
            socket.emit('tts result', { url: res.path })
        } catch (err) {
            socket.emit('tts error', { data: tts.data, voice })
            console.error(err)
        }
    });
});

http.listen(port, () => {
    console.log(`listening on http://localhost:${port}/`)
});
