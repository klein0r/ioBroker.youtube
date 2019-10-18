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

            // Documentation: https://developers.google.com/youtube/v3/docs/channels

            request(
                {
                    url: 'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=' + channelId + '&key=' + apiKey,
                    json: true
                },
                function (error, response, content) {
                    self.log.debug('channels request done');

                    let updateTime = new Date();
                    self.setState('lastUpdate', {val: new Date(updateTime - updateTime.getTimezoneOffset() * 60000).toISOString(), ack: true});

                    if (!error && response.statusCode == 200) {

                        if (content && content.hasOwnProperty('items') && Array.isArray(content['items']) && content['items'].length > 0) {
                            var firstItem = content['items'][0];

                            if (firstItem.hasOwnProperty('statistics')) {
                                self.setState('statistics.viewCount', {val: firstItem.statistics.viewCount, ack: true});
                                self.setState('statistics.subscriberCount', {val: firstItem.statistics.subscriberCount, ack: true});
                                self.setState('statistics.videoCount', {val: firstItem.statistics.videoCount, ack: true});
                            }

                            if (firstItem.hasOwnProperty('snippet')) {
                                self.setState('snippet.title', {val: firstItem.snippet.title, ack: true});
                                self.setState('snippet.description', {val: firstItem.snippet.description, ack: true});
                                self.setState('snippet.customUrl', {val: firstItem.snippet.customUrl, ack: true});
                                self.setState('snippet.publishedAt', {val: firstItem.snippet.publishedAt, ack: true});
                            }
                        }
    
                    } else {
                        self.log.warn(error);
                    }
                }
            );

            request(
                {
                    url: 'https://www.googleapis.com/youtube/v3/search?part=id,snippet&type=video&order=date&maxResults=5&channelId=' + channelId + '&key=' + apiKey,
                    json: true
                },
                function (error, response, content) {
                    self.log.debug('search request done');

                    if (!error && response.statusCode == 200) {

                        if (content && content.hasOwnProperty('items') && Array.isArray(content['items']) && content['items'].length > 0) {
                            for (var i = 0; i < content['items'].length; i++) {

                                var v = content['items'][i];
                                var path = 'video.' + i + '.';

                                self.setObjectNotExists(path + 'id', {
                                    type: 'state',
                                    common: {
                                        name: 'Id',
                                        type: 'string',
                                        role: 'media.playid',
                                        read: true,
                                        write: false
                                    },
                                    native: {}
                                });
                                self.setState(path + 'id', {val: v.id.videoId, ack: true});

                                self.setObjectNotExists(path + 'url', {
                                    type: 'state',
                                    common: {
                                        name: 'URL',
                                        type: 'string',
                                        role: 'url.blank',
                                        read: true,
                                        write: false
                                    },
                                    native: {}
                                });
                                self.setState(path + 'url', {val: 'https://youtu.be/' + v.id.videoId, ack: true});

                                self.setObjectNotExists(path + 'title', {
                                    type: 'state',
                                    common: {
                                        name: 'Title',
                                        type: 'string',
                                        role: 'media.title',
                                        read: true,
                                        write: false
                                    },
                                    native: {}
                                });
                                self.setState(path + 'title', {val: v.snippet.title, ack: true});

                                self.setObjectNotExists(path + 'published', {
                                    type: 'state',
                                    common: {
                                        name: 'Published',
                                        type: 'string',
                                        role: 'media.date',
                                        read: true,
                                        write: false
                                    },
                                    native: {}
                                });
                                self.setState(path + 'published', {val: v.snippet.publishedAt, ack: true});

                                self.setObjectNotExists(path + 'description', {
                                    type: 'state',
                                    common: {
                                        name: 'Description',
                                        type: 'string',
                                        role: 'state',
                                        read: true,
                                        write: false
                                    },
                                    native: {}
                                });
                                self.setState(path + 'description', {val: v.snippet.description, ack: true});
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