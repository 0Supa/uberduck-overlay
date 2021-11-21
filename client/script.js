const ttsServer = io('', {
    path: '/tts/socket.io',
    transports: ["websocket", "polling"]
})

const params = new URLSearchParams(window.location.search);
const channelId = params.get('channel_id')
if (!channelId) throw new Error('"channel_id" param is required');

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

            const text = redemption.user_input

            if (!text) return

            ttsServer.emit('tts', { channelId, rewardId: redemption.reward.id, text })
            break
        }

        case 'RECONNECT':
            console.log('Pubsub server sent a reconnect message. restarting the socket')
            pubsub.refresh()
            break
    }
})

pubsub.open()
