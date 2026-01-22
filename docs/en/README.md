![Logo](../../admin/youtube.png)

# ioBroker.youtube

## Requirements

- nodejs 18.0 (or later)
- js-controller 5.0.0 (or later)
- Admin Adapter 6.0.0 (or later)

## Configuration

To get an API-Key you have to go to [console.developers.google.com](https://console.developers.google.com/apis/dashboard).

1. Create a new Project
2. Create a new API key
3. Add "YouTube Data API v3" of the library
4. Use that API-Key in the instance configuration
5. Add multiple channels in the channels tab by using the id and a custom name

## Log all statistics to InfluxDB

```javascript
// v0.3

const targetDb = 'influxdb.0';
const currentInstance = `javascript.${instance}`;

async function storeToDb(ts, prefix, subscriberCount, viewCount) {
    await this.sendToAsync(targetDb, 'storeState', {
        id: `youtube.0.${prefix}.subscribers`,
        state: {
            ts,
            val: subscriberCount,
            ack: true,
            from: `system.adapter.${currentInstance}.${scriptName}`,
        }
    });

    await this.sendToAsync(targetDb, 'storeState', {
        id: `youtube.0.${prefix}.views`,
        state: {
            ts,
            val: viewCount,
            ack: true,
            from: `system.adapter.${currentInstance}.${scriptName}`,
        }
    });
}

// Save all channels
on({ id: 'youtube.0.summary.json', change: 'any' }, async (obj) => {
    try {
        const youtubeJson = obj.state.val;
        const channels = JSON.parse(youtubeJson);
        const ts = Date.now();

        for (const channel of channels) {
            const alias = channel.customUrl.substr(1); // remove leading @

            await storeToDb(ts, `channels.${alias}`, channel.subscriberCount, channel.viewCount);
        }
    } catch (err) {
        console.error(err);
    }
});

// Save channels by group
$('youtube.0.groups.*.json').on(async (obj) => {
    try {
        const group = obj.id.slice('youtube.0.groups.'.length, '.json'.length * -1);

        const youtubeJson = obj.state.val;
        const channels = JSON.parse(youtubeJson);
        const ts = Date.now();

        for (const channel of channels) {
            const alias = channel.customUrl.substr(1); // remove leading @

            await storeToDb(ts, `groups.${group}.${alias}`, channel.subscriberCount, channel.viewCount);
        }
    } catch (err) {
        console.error(err);
    }
});
```
