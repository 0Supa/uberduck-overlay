const getUser = async (login) => {
    const res = await fetch(`https://api.ivr.fi/twitch/resolve/${encodeURIComponent(login)}`)
    const data = await res.json()
    return data
}

const commands = {
    "skiptts": () => {
        if (!queue.length) return
        queue.shift()
        tts.pause()
        if (queue.length) playNext()
        toast.message(`⏭ TTS Skipped`)
    },
    "ignoretts": async (args) => {
        if (!args.length) return

        const user = await getUser(args[0])
        if (!user.id) return
        if (ignoredUsers.has(user.id)) return

        ignoredUsers.add(user.id)
        toast.message(`⛔ Ignoring "${user.displayName}"`)
    },
    "unignoretts": async (args) => {
        if (!args.length) return

        const user = await getUser(args[0])
        if (!user.id) return
        if (!ignoredUsers.has(user.id)) return

        ignoredUsers.delete(user.id)
        toast.message(`✅ Unignored "${user.displayName}"`)
    }
}
