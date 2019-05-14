/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
'use strict';

const utils = require('@iobroker/adapter-core');
const request = require('request');

class Youtube extends utils.Adapter {

    constructor(options) {
        super({
            ...options,
            name: 'youtube',
        });
        this.on('ready', this.onReady.bind(this));
    }

    async onReady() {
        var self = this;
        var apiKey = this.config.apiKey;
        var channelId = this.config.channelId;

        if (apiKey && channelId) {
            request(
                {
                    url: 'https://www.googleapis.com/youtube/v3/channels?part=statistics&id=' + channelId + '&key=' + apiKey,
                    json: true
                },
                function (error, response, content) {
                    self.log.debug('request done');

                    if (!error && response.statusCode == 200) {

                        if (content && content.hasOwnProperty('items') && Array.isArray(content['items']) && content['items'].length > 0) {
                            var firstItem = content['items'][0];

                            if (firstItem.hasOwnProperty('statistics')) {
                                self.setState('statistics.viewCount', {val: firstItem.statistics.viewCount, ack: true});
                                self.setState('statistics.subscriberCount', {val: firstItem.statistics.subscriberCount, ack: true});
                                self.setState('statistics.videoCount', {val: firstItem.statistics.videoCount, ack: true});
                            }
                        }
    
                    } else {
                        self.log.warn(error);
                    }
                }
            );
        }

        setTimeout(this.stop.bind(this), 10000);
    }

    onUnload(callback) {
        try {
            this.log.info('cleaned everything up...');
            callback();
        } catch (e) {
            callback();
        }
    }
}

// @ts-ignore parent is a valid property on module
if (module.parent) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<ioBroker.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new Youtube(options);
} else {
    // otherwise start the instance directly
    new Youtube();
}