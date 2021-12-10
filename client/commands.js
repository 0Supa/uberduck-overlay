const getUser = async (login) => {
    const res = await fetch(`https://api.ivr.fi/twitch/resolve/${encodeURIComponent(login)}`)
    const data = await res.json()
    return data
}

const commands = {
    "skiptts": () => {
        queue.shift()
        tts.pause()
        if (queue.length) playNext()
    },
    "ignoretts": async (args) => {
        if (!args.length) return

        const user = await getUser(args[0])
        if (!user.id) return

        ignoredUsers.add(user.id)
    },
    "unignoretts": async (args) => {
        if (!args.length) return

        const user = await getUser(args[0])
        if (!user.id) return

        ignoredUsers.delete(user.id)
    }
}
