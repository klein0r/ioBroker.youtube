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

        const apiKey = this.config.apiKey;
        const enableVideoInformation = this.config.enableVideoInformation;

        await this.setObjectNotExistsAsync(cpath + '.lastUpdate', {
            type: 'state',
            common: {
                name: 'Last Update',
                type: 'number',
                role: 'date',
                read: true,
                write: false
            },
            native: {}
        });

        await this.setObjectNotExistsAsync(cpath + '.statistics', {
            type: 'channel',
            common: {
                name: 'Statistics'
            },
            native: {}
        });

        await this.setObjectNotExistsAsync(cpath + '.statistics.viewCount', {
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

        await this.setObjectNotExistsAsync(cpath + '.statistics.videoViewCountAvg', {
            type: 'state',
            common: {
                name: 'Avg views per video',
                type: 'number',
                role: 'value',
                read: true,
                write: false
            },
            native: {}
        });

        await this.setObjectNotExistsAsync(cpath + '.statistics.subscriberCount', {
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

        await this.setObjectNotExistsAsync(cpath + '.statistics.videoSubscriberCountAvg', {
            type: 'state',
            common: {
                name: 'Avg subscribers per video',
                type: 'number',
                role: 'value',
                read: true,
                write: false
            },
            native: {}
        });

        await this.setObjectNotExistsAsync(cpath + '.statistics.videoCount', {
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

        await this.setObjectNotExistsAsync(cpath + '.snippet', {
            type: 'channel',
            common: {
                name: 'Snippet'
            },
            native: {}
        });

        await this.setObjectNotExistsAsync(cpath + '.snippet.title', {
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

        await this.setObjectNotExistsAsync(cpath + '.snippet.description', {
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

        await this.setObjectNotExistsAsync(cpath + '.snippet.customUrl', {
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

        await this.setObjectNotExistsAsync(cpath + '.snippet.publishedAt', {
            type: 'state',
            common: {
                name: 'Channel Publish Date',
                type: 'number',
                role: 'date',
                read: true,
                write: false
            },
            native: {}
        });

        return new Promise((resolve, reject) => {

            if (apiKey) {
                this.log.debug('youtube/v3/channels - Request init - ' + id);

                axios({
                    method: 'get',
                    baseURL: 'https://www.googleapis.com/youtube/v3/',
                    url: '/channels?part=snippet,statistics&id=' + id + '&key=' + apiKey,
                    timeout: 4500,
                    responseType: 'json'
                }).then(
                    (response) => {
                        this.log.debug('youtube/v3/channels - Request done - ' + id);
                        this.log.debug('received data (' + response.status + '): ' + JSON.stringify(response.data));

                        const content = response.data;

                        if (content && Object.prototype.hasOwnProperty.call(content, 'items') && Array.isArray(content['items']) && content['items'].length > 0) {
                            const firstItem = content['items'][0];

                            if (Object.prototype.hasOwnProperty.call(firstItem, 'statistics')) {
                                this.setStateAsync(cpath + '.statistics.viewCount', {val: firstItem.statistics.viewCount, ack: true});
                                this.setStateAsync(cpath + '.statistics.videoViewCountAvg', {val: Math.round(firstItem.statistics.viewCount / firstItem.statistics.videoCount), ack: true});
                                this.setStateAsync(cpath + '.statistics.subscriberCount', {val: firstItem.statistics.subscriberCount, ack: true});
                                this.setStateAsync(cpath + '.statistics.videoSubscriberCountAvg', {val: Math.round(firstItem.statistics.subscriberCount / firstItem.statistics.videoCount), ack: true});
                                this.setStateAsync(cpath + '.statistics.videoCount', {val: firstItem.statistics.videoCount, ack: true});
                            }

                            if (Object.prototype.hasOwnProperty.call(firstItem, 'snippet')) {
                                this.setStateAsync(cpath + '.snippet.title', {val: firstItem.snippet.title, ack: true});
                                this.setStateAsync(cpath + '.snippet.description', {val: firstItem.snippet.description, ack: true});
                                this.setStateAsync(cpath + '.snippet.customUrl', {val: firstItem.snippet.customUrl, ack: true});
                                this.setStateAsync(cpath + '.snippet.publishedAt', {val: new Date(firstItem.snippet.publishedAt).getTime(), ack: true});
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
                            this.setStateAsync(cpath + '.lastUpdate', {val: new Date(updateTime - updateTime.getTimezoneOffset() * 60000).getTime(), ack: true});
                        } else {
                            this.log.warn('youtube/v3/channels - received empty response - check channel id');
                        }
                    }
                ).catch(reject);

                if (enableVideoInformation) {
                    // Fill latest video information
                    // Documentation: https://developers.google.com/youtube/v3/docs/search/list

                    axios({
                        method: 'get',
                        baseURL: 'https://www.googleapis.com/youtube/v3/',
                        url: '/search?part=id,snippet&type=video&order=date&maxResults=5&channelId=' + id + '&key=' + apiKey,
                        timeout: 4500,
                        responseType: 'json'
                    }).then(
                        async (response) => {
                            this.log.debug('youtube/v3/search Request done - ' + id);
                            this.log.debug('received data (' + response.status + '): ' + JSON.stringify(response.data));

                            const content = response.data;

                            if (content && Object.prototype.hasOwnProperty.call(content, 'items') && Array.isArray(content['items']) && content['items'].length > 0) {
                                for (let i = 0; i < content['items'].length; i++) {

                                    const v = content['items'][i];
                                    const path = cpath + '.video.' + i + '.';

                                    await this.setObjectNotExists(path.slice(0, -1), { // remove trailing dot
                                        type: 'channel',
                                        common: {
                                            name: 'Video data ' + (i + 1)
                                        },
                                        native: {}
                                    });

                                    await this.setObjectNotExists(path + 'id', {
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
                                    await this.setStateAsync(path + 'id', {val: v.id.videoId, ack: true});

                                    await this.setObjectNotExists(path + 'url', {
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
                                    await this.setStateAsync(path + 'url', {val: 'https://youtu.be/' + v.id.videoId, ack: true});

                                    await this.setObjectNotExists(path + 'title', {
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
                                    await this.setStateAsync(path + 'title', {val: v.snippet.title, ack: true});

                                    await this.setObjectNotExists(path + 'published', {
                                        type: 'state',
                                        common: {
                                            name: 'Published',
                                            type: 'number',
                                            role: 'date',
                                            read: true,
                                            write: false
                                        },
                                        native: {}
                                    });
                                    await this.setStateAsync(path + 'published', {val: new Date(v.snippet.publishedAt).getTime(), ack: true});

                                    await this.setObjectNotExists(path + 'description', {
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
                                    await this.setStateAsync(path + 'description', {val: v.snippet.description, ack: true});
                                }
                            } else {
                                this.log.warn('youtube/v3/search - received empty response - check channel id');
                            }

                        }
                    ).catch(
                        (error) => {
                            this.log.warn(error);
                        }
                    );
                }
            } else {
                reject('API Key not configured');
            }
        });
    }

    async onReady() {
        const channels = this.config.channels;
        const channelDataList = [];

        this.getChannelsOf(
            'channels',
            async (err, states) => {

                const channelsAll = [];
                const channelsKeep = [];

                // Collect all types
                if (states) {
                    for (let i = 0; i < states.length; i++) {
                        const id = this.removeNamespace(states[i]._id);

                        // Check if the state is a direct child (e.g. channels.HausAutomatisierungCom)
                        if (id.split('.').length === 2) {
                            channelsAll.push(id);
                        }
                    }
                }

                if (channels && Array.isArray(channels)) {
                    this.log.debug('Found ' + channels.length + ' channels, fetching data');

                    for (const c in channels) {
                        const channel = channels[c];
                        const cleanChannelName = channel.name.replace(/\s/g, '').replace(/[^\p{Ll}\p{Lu}\p{Nd}]+/gu, '_');

                        channelsKeep.push('channels.' + cleanChannelName);

                        await this.setObjectNotExists('channels.' + cleanChannelName, {
                            type: 'channel',
                            common: {
                                name: channel.name
                            },
                            native: {}
                        });

                        const channelData = await this.getChannelData(channel.id, 'channels.' + cleanChannelName);
                        if (typeof channelData === 'object') {
                            channelDataList.push(channelData);
                        }
                    }

                    channelDataList.sort(function(a, b) {
                        return b.subscriberCount - a.subscriberCount;
                    });

                    await this.setStateAsync('summary.json', {val: JSON.stringify(channelDataList), ack: true});
                } else {
                    this.log.warn('No channels configured');
                }

                // Delete non existent channels
                for (let i = 0; i < channelsAll.length; i++) {
                    const id = channelsAll[i];

                    if (channelsKeep.indexOf(id) === -1) {
                        this.delObject(id, {recursive: true}, () => {
                            this.log.debug('Channel deleted: ' + id);
                        });
                    }
                }
            }
        );

        this.killTimeout = setTimeout(this.stop.bind(this), 60000);
    }

    removeNamespace(id) {
        const re = new RegExp(this.namespace + '*\.', 'g');
        return id.replace(re, '');
    }

    onUnload(callback) {
        try {

            if (this.killTimeout) {
                this.log.debug('clearing kill timeout');
                clearTimeout(this.killTimeout);
            }

            this.log.debug('cleaned everything up...');
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