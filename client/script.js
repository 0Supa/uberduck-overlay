const ttsServer = io(window.location.pathname)

const voices = {
    "6d59b12f-b04d-4d0d-a69e-a49e8068e9e0": "spongebob",
    "7d1418e9-82f4-4c53-9735-f549034baeed": "kendrick-lamar",
    "0dad1f1d-9a88-4d07-b394-33eb5e9acd60": "albert-einstein",
    "4d0a1f7b-3c4e-4b97-bf6d-685bbd97239a": "arthur-morgan",
    "4635dd41-2054-45ba-aa00-ed06e342bdfb": "alexa"
}

const channelId = "108311159" // kazimir33
let ping
const queue = []

const tts = document.getElementById('tts')

const addToQueue = (url) => {
    queue.push(url)

    if (tts.paused) playNext()
}

const playNext = () => {
    const [url] = queue
    if (!url) return

    play(url)
}

const play = (url) => {
    tts.setAttribute('src', url)
}

tts.addEventListener("ended", () => {
    queue.shift()
    playNext()
})

tts.addEventListener('error', () => {
    queue.shift()
    playNext()
})

ttsServer.on('disconnect', () => {
    console.log('TTS Socket Disconnected')
})

ttsServer.on('connect', () => {
    console.log(`Connected to TTS Socket`)
})

ttsServer.on('tts result', res => {
    if (!res.url) return console.error(res)
    addToQueue(res.url)
})

const pubsub = new ReconnectingWebSocket('wss://pubsub-edge.twitch.tv', null, { automaticOpen: false })

pubsub.addEventListener('close', () => {
    console.log('PubSub Disconnected')
    clearInterval(ping)
})

pubsub.addEventListener('open', () => {
    console.log(`Connected to PubSub`)

    let message = {
        'type': 'LISTEN',
        'nonce': 'xd',
        'data': {
            'topics': [`community-points-channel-v1.${channelId}`]
        }
    }
    pubsub.send(JSON.stringify(message))

    ping = setInterval(() => {
        pubsub.send(JSON.stringify({
            type: 'PING',
        }))
    }, 250 * 1000)
})

pubsub.addEventListener('message', ({ data }) => {
    const msg = JSON.parse(data)
    switch (msg.type) {
        case 'RESPONSE':
            if (msg.error) console.error(msg)
            else console.log('Successfully created redeem listener')
            break

        case 'MESSAGE': {
            if (!msg.data) return console.error(`No data associated with message [${JSON.stringify(msg)}]`)

            const msgData = JSON.parse(msg.data.message)

            if (msgData.type !== "reward-redeemed") return

            const redemption = msgData.data.redemption

            const voice = voices[redemption.reward.id]
            const text = redemption.user_input

            if (!voice || !text) return

            ttsServer.emit('tts', { voice, text })
            break
        }

        case 'RECONNECT':
            console.log('Pubsub server sent a reconnect message. restarting the socket')
            pubsub.refresh()
            break
    }
})

pubsub.open()
