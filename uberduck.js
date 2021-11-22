const config = require('./config.json')
const auth = Buffer.from(`${config.uberduck.key}:${config.uberduck.secret}`).toString('base64')
const got = require('got')

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const check = async (uuid) => {
    const res = await got(`https://api.uberduck.ai/speak-status?uuid=${uuid}`).json()
    return res
}

exports.getResult = async (uuid) => {
    while (true) {
        await sleep(1000)
        const result = await check(uuid)

        if (result.path) return result
        if (result.failed_at) throw `TTS Failed: ${uuid} [${JSON.stringify(result)}]`
        if (Date.parse(result.started_at) > Date.now() - 600000) throw `TTS Took to much to process: ${uuid} [${JSON.stringify(result)}]`
    }
}

exports.queue = async (voice, speech) => {
    const { body: res } = await got.post('https://api.uberduck.ai/speak', {
        throwHttpErrors: false,
        responseType: 'json',
        headers: { Authorization: `Basic ${auth}` },
        json: { voice, speech }
    })

    if (!res.uuid) throw res.detail || "Unknown error"
    return res.uuid
}
