const channel = '8supa'

const ws = new ReconnectingWebSocket('wss://irc-ws.chat.twitch.tv', null, { automaticOpen: false, reconnectInterval: 2000 })

ws.addEventListener('close', () => {
    console.log('Chat Disconnected')
})

ws.addEventListener('open', () => {
    console.log(`Connected to Chat`)

    ws.send('PASS blah\r\n');
    ws.send('NICK justinfan' + Math.floor(Math.random() * 99999) + '\r\n');
    ws.send('CAP REQ :twitch.tv/commands twitch.tv/tags\r\n');
    ws.send(`JOIN #${channel}`);
})

ws.addEventListener('message', ({ data }) => {
    const messages = data.split('\r\n')

    const l = messages.length
    for (let i = 0; i < l; i++) {
        const line = messages[i]
        if (!line) return

        const msg = parseIRC(line)
        if (!msg.command) return

        switch (msg.command) {
            case "PING":
                socket.send(`PONG ${msg.params[0]}`);
                break;

            case "JOIN":
                console.log(`Joined channel #${channel}`);
                break;

            case "PRIVMSG": {
                if (msg.params[0] !== `#${channel}` || !msg.params[1]) return;
                if (msg.params[1].toLowerCase() !== "!skiptts" || typeof (msg.tags.badges) !== 'string') return

                let flag = false;
                msg.tags.badges.split(',').forEach(badge => {
                    badge = badge.split('/');
                    if (badge[0] === "moderator" || badge[0] === "broadcaster") {
                        flag = true;
                        return;
                    }
                });

                if (flag) {
                    if (!queue.length) return tts.pause()
                    queue.shift()
                    playNext()
                }
                break;
            }
        }
    }
})

ws.open()