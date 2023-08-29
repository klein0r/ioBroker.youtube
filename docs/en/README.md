![Logo](../../admin/youtube.png)

# ioBroker.youtube

## Requirements

- nodejs 14.5 (or later)
- js-controller 4.0.15 (or later)
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
on({ id: 'youtube.0.summary.json', change: 'any' }, async (obj) => {
    try {
        const youtubeJson = obj.state.val;
        const channels = JSON.parse(youtubeJson);
        const ts = Date.now();

        for (const channel of channels) {
            const alias = channel.customUrl.substr(1); // remove leading @

            await this.sendToAsync('influxdb.0', 'storeState', {
                id: `youtube.0.channels.${alias}.subscribers`,
                state: {
                    ts,
                    val: channel.subscriberCount,
                    ack: true,
                    from: `system.adapter.javascript.0.${scriptName}`,
                }
            });

            await this.sendToAsync('influxdb.0', 'storeState', {
                id: `youtube.0.channels.${alias}.views`,
                state: {
                    ts,
                    val: channel.viewCount,
                    ack: true,
                    from: `system.adapter.javascript.0.${scriptName}`,
                }
            });
        }
    } catch (err) {
        console.error(err);
    }
});
```
