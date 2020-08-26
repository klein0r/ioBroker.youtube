/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
'use strict';

const utils = require('@iobroker/adapter-core');
const axios = require('axios');
const adapterName = require('./package.json').name.split('.').pop();

class Youtube extends utils.Adapter {

    constructor(options) {
        super({
            ...options,
            name: adapterName,
        });

        this.killTimeout = null;

        this.on('ready', this.onReady.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    async getChannelData(id, cpath) {
        // Documentation: https://developers.google.com/youtube/v3/docs/channels

        return new Promise(function (resolve, reject) {

            const apiKey = this.config.apiKey;
            const enableVideoInformation = this.config.enableVideoInformation;

            this.setObjectNotExists(cpath + '.lastUpdate', {
                type: 'state',
                common: {
                    name: 'Last Update',
                    type: 'string',
                    role: 'value.datetime',
                    read: true,
                    write: false
                },
                native: {}
            });

            this.setObjectNotExists(cpath + '.statistics', {
                type: 'channel',
                common: {
                    name: 'Statistics'
                },
                native: {}
            });

            this.setObjectNotExists(cpath + '.statistics.viewCount', {
                type: 'state',
                common: {
                    name: 'View Count',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false
                },
                native: {}
            });

            this.setObjectNotExists(cpath + '.statistics.subscriberCount', {
                type: 'state',
                common: {
                    name: 'Subscriber Count',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false
                },
                native: {}
            });

            this.setObjectNotExists(cpath + '.statistics.videoCount', {
                type: 'state',
                common: {
                    name: 'Video Count',
                    type: 'number',
                    role: 'value',
                    read: true,
                    write: false
                },
                native: {}
            });

            this.setObjectNotExists(cpath + '.snippet', {
                type: 'channel',
                common: {
                    name: 'Snippet'
                },
                native: {}
            });

            this.setObjectNotExists(cpath + '.snippet.title', {
                type: 'state',
                common: {
                    name: 'Channel Title',
                    type: 'string',
                    role: 'value',
                    read: true,
                    write: false
                },
                native: {}
            });

            this.setObjectNotExists(cpath + '.snippet.description', {
                type: 'state',
                common: {
                    name: 'Channel Description',
                    type: 'string',
                    role: 'value',
                    read: true,
                    write: false
                },
                native: {}
            });

            this.setObjectNotExists(cpath + '.snippet.customUrl', {
                type: 'state',
                common: {
                    name: 'Channel Custom Url',
                    type: 'string',
                    role: 'value',
                    read: true,
                    write: false
                },
                native: {}
            });

            this.setObjectNotExists(cpath + '.snippet.publishedAt', {
                type: 'state',
                common: {
                    name: 'Channel Publish Date',
                    type: 'string',
                    role: 'value.datetime',
                    read: true,
                    write: false
                },
                native: {}
            });

            if (apiKey) {
                this.log.debug('youtube/v3/channels - Request init - ' + id);

                axios({
                    method: 'get',
                    baseURL: 'https://www.googleapis.com/youtube/v3/',
                    url: '/channels?part=snippet,statistics&id=' + id + '&key=' + apiKey,
                    timeout: 4500,
                    responseType: 'json'
                }).then(
                    function (response) {
                        this.log.debug('youtube/v3/channels - Request done - ' + id);
                        this.log.debug('received data (' + response.status + '): ' + JSON.stringify(response.data));

                        const content = response.data;

                        if (content && Object.prototype.hasOwnProperty.call(content, 'items') && Array.isArray(content['items']) && content['items'].length > 0) {
                            const firstItem = content['items'][0];

                            if (Object.prototype.hasOwnProperty.call(firstItem, 'statistics')) {
                                this.setState(cpath + '.statistics.viewCount', {val: firstItem.statistics.viewCount, ack: true});
                                this.setState(cpath + '.statistics.subscriberCount', {val: firstItem.statistics.subscriberCount, ack: true});
                                this.setState(cpath + '.statistics.videoCount', {val: firstItem.statistics.videoCount, ack: true});
                            }

                            if (Object.prototype.hasOwnProperty.call(firstItem, 'snippet')) {
                                this.setState(cpath + '.snippet.title', {val: firstItem.snippet.title, ack: true});
                                this.setState(cpath + '.snippet.description', {val: firstItem.snippet.description, ack: true});
                                this.setState(cpath + '.snippet.customUrl', {val: firstItem.snippet.customUrl, ack: true});
                                this.setState(cpath + '.snippet.publishedAt', {val: firstItem.snippet.publishedAt, ack: true});
                            }

                            if (Object.prototype.hasOwnProperty.call(firstItem, 'statistics') && Object.prototype.hasOwnProperty.call(firstItem, 'snippet')) {
                                resolve({
                                    _id: id,
                                    title: firstItem.snippet.title,
                                    subscriberCount: firstItem.statistics.subscriberCount,
                                    viewCount: firstItem.statistics.viewCount,
                                    videoCount: firstItem.statistics.videoCount
                                });
                            }

                            const updateTime = new Date();
                            this.setState(cpath + '.lastUpdate', {val: new Date(updateTime - updateTime.getTimezoneOffset() * 60000).toISOString(), ack: true});
                        } else {
                            this.log.warn('youtube/v3/channels - received empty response - check channel id');
                        }
                    }.bind(this)
                ).catch(
                    function (error) {
                        reject(error);
                    }.bind(this)
                );

                if (enableVideoInformation) {
                    // Fill latest video information

                    axios({
                        method: 'get',
                        baseURL: 'https://www.googleapis.com/youtube/v3/',
                        url: '/search?part=id,snippet&type=video&order=date&maxResults=5&channelId=' + id + '&key=' + apiKey,
                        timeout: 4500,
                        responseType: 'json'
                    }).then(
                        function (response) {
                            this.log.debug('youtube/v3/search Request done - ' + id);
                            this.log.debug('received data (' + response.status + '): ' + JSON.stringify(response.data));

                            const content = response.data;

                            if (content && Object.prototype.hasOwnProperty.call(content, 'items') && Array.isArray(content['items']) && content['items'].length > 0) {
                                for (let i = 0; i < content['items'].length; i++) {

                                    const v = content['items'][i];
                                    const path = cpath + '.video.' + i + '.';

                                    this.setObjectNotExists(path, {
                                        type: 'channel',
                                        common: {
                                            name: 'Video data ' + (i + 1)
                                        },
                                        native: {}
                                    });

                                    this.setObjectNotExists(path + 'id', {
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
                                    this.setState(path + 'id', {val: v.id.videoId, ack: true});

                                    this.setObjectNotExists(path + 'url', {
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
                                    this.setState(path + 'url', {val: 'https://youtu.be/' + v.id.videoId, ack: true});

                                    this.setObjectNotExists(path + 'title', {
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
                                    this.setState(path + 'title', {val: v.snippet.title, ack: true});

                                    this.setObjectNotExists(path + 'published', {
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
                                    this.setState(path + 'published', {val: v.snippet.publishedAt, ack: true});

                                    this.setObjectNotExists(path + 'description', {
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
                                    this.setState(path + 'description', {val: v.snippet.description, ack: true});
                                }
                            } else {
                                this.log.warn('youtube/v3/search - received empty response - check channel id');
                            }

                        }.bind(this)
                    ).catch(
                        function (error) {
                            this.log.warn(error);
                        }.bind(this)
                    );
                }
            } else {
                reject('API Key not configured');
            }
        }.bind(this));
    }

    async onReady() {
        const channels = this.config.channels;

        const channelDataList = [];

        if (channels && Array.isArray(channels)) {
            this.log.debug('Found other channels, fetching data');

            for (const c in channels) {
                const channel = channels[c];
                const cleanChannelName = channel.name.replace(/\s/g,'');

                this.setObjectNotExists('channels.' + cleanChannelName, {
                    type: 'channel',
                    common: {
                        name: channel.name
                    },
                    native: {}
                });

                const channelData = await this.getChannelData(channel.id, 'channels.' + cleanChannelName);
                if (typeof channelData !== 'undefined') {
                    channelDataList.push(channelData);
                }
            }

            channelDataList.sort(function(a, b) {
                return b.subscriberCount - a.subscriberCount;
            });

            this.setState('summary.json', {val: JSON.stringify(channelDataList), ack: true});

            this.killTimeout = setTimeout(this.stop.bind(this), 30000);
        }
    }

    onUnload(callback) {
        try {

            if (this.killTimeout) {
                this.log.debug('clearing kill timeout');
                clearTimeout(this.killTimeout);
            }

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