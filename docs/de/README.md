![Logo](../../admin/youtube.png)

# ioBroker.youtube

## Anforderungen

- nodejs 14.5 (oder neuer)
- js-controller 4.0.15 (oder neuer)
- Admin Adapter 6.0.0 (oder neuer)

## Konfiguration

Um einen API-Key zu erstellen, gehe zu [console.developers.google.com](https://console.developers.google.com/apis/dashboard).

1. Erstelle ein neues Projekt
2. Erstelle einen neuen API Schlüssel
3. Füge "YouTube Data API v3" aus der Bibliothek hinzu
4. Nutze diesen API-Key in den Instanz-Einstellungen
5. Füge einen oder mehrere YouTube-Kanäle über das "Kanäle"-Tab im Admin hinzu

## Statistiken aller Kanäle in InfluxDB speichern

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
