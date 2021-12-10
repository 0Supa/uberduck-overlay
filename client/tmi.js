const commandPrefix = '!'
const tmi = new ReconnectingWebSocket('wss://irc-ws.chat.twitch.tv', null, { automaticOpen: false, reconnectInterval: 2000 })

tmi.addEventListener('close', () => {
    console.log('Chat Disconnected')
})

tmi.addEventListener('open', () => {
    console.log(`Connected to Chat`)

    tmi.send('PASS blah\r\n');
    tmi.send(`NICK justinfan${Math.floor(Math.random() * 99999)}\r\n`);
    tmi.send('CAP REQ :twitch.tv/commands twitch.tv/tags\r\n');
    tmi.send(`JOIN #${channel.login}`);
})

tmi.addEventListener('message', ({ data }) => {
    const messages = data.split('\r\n')

    for (let i = 0; i < messages.length; i++) {
        const line = messages[i]
        if (!line) return

        const msg = parseIRC(line)
        if (!msg.command) return

        switch (msg.command) {
            case "PING":
                tmi.send(`PONG ${msg.params[0]}`);
                break;

            case "JOIN":
                console.log(`Joined channel #${channel.login}`);
                break;

            case "PRIVMSG": {
                if (msg.params[0] !== `#${channel.login}` || !msg.params[1] || !msg.params[1].startsWith(commandPrefix) || !msg.tags.badges) return;
                if (!msg.tags.mod && !msg.tags.badges.split(',').includes('broadcaster/1')) return;

                const args = msg.params[1].slice(commandPrefix.length).trim().split(/ +/);
                const commandName = args.shift().toLowerCase();

                const command = commands[commandName]
                if (!command) return

                command(args)
                console.log(`Command "${commandName}" has been executed by "${msg.tags['display-name']}"`)
                break;
            }
        }
    }
})

tmi.open()
