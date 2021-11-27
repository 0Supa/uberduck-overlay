let channel
const params = new URLSearchParams(window.location.search);
const channelId = params.get('channel_id')
if (!channelId) throw new Error('"channel_id" param is required');

const res = fetch(`https://api.ivr.fi/twitch/resolve/${encodeURIComponent(channelId)}?id=1`).then((response) => {
    return response.json();
}).then((json) => {
    if (json.error) throw new Error('invalid channel_id');
    channel = json
});
