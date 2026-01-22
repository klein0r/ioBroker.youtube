![Logo](../../admin/youtube.png)

# ioBroker.youtube

## Anforderungen

- nodejs 20.0 (oder neuer)
- js-controller 6.0.11 (oder neuer)
- Admin Adapter 7.6.17 (oder neuer)

## Konfiguration

Um einen API-Key zu erstellen, gehe zu [console.developers.google.com](https://console.developers.google.com/apis/dashboard).

1. Erstelle ein neues Projekt
2. Erstelle einen neuen API Schlüssel
3. Füge "YouTube Data API v3" aus der Bibliothek hinzu
4. Nutze diesen API-Key in den Instanz-Einstellungen
5. Füge einen oder mehrere YouTube-Kanäle über das "Kanäle"-Tab im Admin hinzu

## Statistiken aller Kanäle in InfluxDB speichern

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
