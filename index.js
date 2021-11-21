const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http, { path: '/kazittsxd' })
const { port } = require('./config.json')
const uberduck = require('./uberduck')

app.use('/', express.static(__dirname + '/client'))

io.on('connection', (socket) => {
    socket.on('tts', async tts => {
        try {
            if (!tts.voice || !tts.text) return

            const uuid = await uberduck.queue(tts.voice, tts.text)
            const res = await uberduck.getResult(uuid)

            socket.emit('tts result', { url: res.path })
        } catch (err) {
            console.error(err)
        }
    });
});

http.listen(port, () => {
    console.log(`listening on http://localhost:${port}/`)
});
