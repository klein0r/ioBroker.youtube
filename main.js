/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
'use strict';

const utils = require('@iobroker/adapter-core');
const axios = require('axios').default;
const adapterName = require('./package.json').name.split('.').pop();

class Youtube extends utils.Adapter {
    constructor(options) {
        super({
            ...options,
            name: adapterName,
        });

        this.on('ready', this.onReady.bind(this));
    }

    async getChannelData(id, cpath) {
        // Documentation: https://developers.google.com/youtube/v3/docs/channels

        const apiKey = this.config.apiKey;
        const enableVideoInformation = this.config.enableVideoInformation;

        await this.setObjectNotExistsAsync(`${cpath}.lastUpdate`, {
            type: 'state',
            common: {
                name: {
                    en: 'Last Update',
                    de: 'Letztes Update',
                    ru: 'Последнее обновление',
                    pt: 'Última atualização',
                    nl: 'Laatste update',
                    fr: 'Dernière mise à jour',
                    it: 'Ultimo aggiornamento',
                    es: 'Última actualización',
                    pl: 'Ostatnia aktualizacja',
                    'zh-cn': '最后更新',
                },
                type: 'number',
                role: 'date',
                read: true,
                write: false,
            },
            native: {},
        });

        await this.setObjectNotExistsAsync(`${cpath}.statistics`, {
            type: 'channel',
            common: {
                name: {
                    en: 'Statistics',
                    de: 'Statistiken',
                    ru: 'Статистика',
                    pt: 'Estatisticas',
                    nl: 'Statistieken',
                    fr: 'Statistiques',
                    it: 'Statistiche',
                    es: 'Estadísticas',
                    pl: 'Statystyka',
                    'zh-cn': '统计数据',
                },
            },
            native: {},
        });

        await this.setObjectNotExistsAsync(`${cpath}.statistics.viewCount`, {
            type: 'state',
            common: {
                name: {
                    en: 'View Count',
                    de: 'Anzahl der Aufrufe',
                    ru: 'Счетчик просмотров',
                    pt: 'Ver contagem',
                    nl: 'Kijkcijfers',
                    fr: 'Nombre de vues',
                    it: 'Visualizza conteggio',
                    es: 'Conteo de visitas',
                    pl: 'Licznik wyświetleń',
                    'zh-cn': '查看次数',
                },
                type: 'number',
                role: 'value',
                read: true,
                write: false,
            },
            native: {},
        });

        await this.setObjectNotExistsAsync(`${cpath}.statistics.videoViewCountAvg`, {
            type: 'state',
            common: {
                name: {
                    en: 'Avg views per video',
                    de: 'Durchschnittliche Aufrufe pro Video',
                    ru: 'Среднее количество просмотров на видео',
                    pt: 'Média de visualizações por vídeo',
                    nl: 'Gem. weergaven per video',
                    fr: 'Vues moyennes par vidéo',
                    it: 'Media visualizzazioni per video',
                    es: 'Promedio de visualizaciones por video',
                    pl: 'Średnia liczba wyświetleń na film',
                    'zh-cn': '每个视频的平均观看次数',
                },
                type: 'number',
                role: 'value',
                read: true,
                write: false,
            },
            native: {},
        });

        await this.setObjectNotExistsAsync(`${cpath}.statistics.subscriberCount`, {
            type: 'state',
            common: {
                name: {
                    en: 'Subscriber Count',
                    de: 'Abonnentenzahl',
                    ru: 'Количество подписчиков',
                    pt: 'Contagem de assinantes',
                    nl: 'Aantal abonnees',
                    fr: "Nombre d'abonnés",
                    it: 'Numero di iscritti',
                    es: 'Cuenta de suscriptores',
                    pl: 'Liczba subskrybentów',
                    'zh-cn': '订阅人数',
                },
                type: 'number',
                role: 'value',
                read: true,
                write: false,
            },
            native: {},
        });

        await this.setObjectNotExistsAsync(`${cpath}.statistics.videoSubscriberCountAvg`, {
            type: 'state',
            common: {
                name: {
                    en: 'Avg subscribers per video',
                    de: 'Durchschnittliche Abonnenten pro Video',
                    ru: 'Среднее количество подписчиков на видео',
                    pt: 'Média de assinantes por vídeo',
                    nl: 'Gem. abonnees per video',
                    fr: "Nombre moyen d'abonnés par vidéo",
                    it: 'Iscritti medi per video',
                    es: 'Promedio de suscriptores por video',
                    pl: 'Średnia liczba subskrybentów na film',
                    'zh-cn': '每个视频的平均订阅人数',
                },
                type: 'number',
                role: 'value',
                read: true,
                write: false,
            },
            native: {},
        });

        await this.setObjectNotExistsAsync(`${cpath}.statistics.videoCount`, {
            type: 'state',
            common: {
                name: {
                    en: 'Video Count',
                    de: 'Videoanzahl',
                    ru: 'Количество видео',
                    pt: 'Contagem de Vídeo',
                    nl: "Aantal video's",
                    fr: 'Nombre de vidéos',
                    it: 'Conteggio video',
                    es: 'Recuento de videos',
                    pl: 'Liczba filmów',
                    'zh-cn': '视频数',
                },
                type: 'number',
                role: 'value',
                read: true,
                write: false,
            },
            native: {},
        });

        await this.setObjectNotExistsAsync(`${cpath}.snippet`, {
            type: 'channel',
            common: {
                name: {
                    en: 'Snippet',
                    de: 'Ausschnitt',
                    ru: 'Фрагмент',
                    pt: 'Trecho',
                    nl: 'fragment',
                    fr: 'Fragment',
                    it: 'Frammento',
                    es: 'Retazo',
                    pl: 'Skrawek',
                    'zh-cn': '片段',
                },
            },
            native: {},
        });

        await this.setObjectNotExistsAsync(`${cpath}.snippet.title`, {
            type: 'state',
            common: {
                name: {
                    en: 'Channel name',
                    de: 'Kanal Name',
                    ru: 'Название канала',
                    pt: 'Nome do canal',
                    nl: 'Kanaal naam',
                    fr: 'Nom du canal',
                    it: 'Nome del canale',
                    es: 'Nombre del Canal',
                    pl: 'Nazwa kanału',
                    'zh-cn': '频道名称',
                },
                type: 'string',
                role: 'text',
                read: true,
                write: false,
            },
            native: {},
        });

        await this.setObjectNotExistsAsync(`${cpath}.snippet.description`, {
            type: 'state',
            common: {
                name: {
                    en: 'Channel Description',
                    de: 'Kanal Beschreibung',
                    ru: 'Описание канала',
                    pt: 'Descrição do canal',
                    nl: 'Kanaal beschrijving',
                    fr: 'Description de la chaîne',
                    it: 'Descrizione del canale',
                    es: 'Descripción del canal',
                    pl: 'Opis kanału',
                    'zh-cn': '频道说明',
                },
                type: 'string',
                role: 'text',
                read: true,
                write: false,
            },
            native: {},
        });

        await this.setObjectNotExistsAsync(`${cpath}.snippet.customUrl`, {
            type: 'state',
            common: {
                name: {
                    en: 'Channel Custom Url',
                    de: 'Benutzerdefinierte Kanal-URL',
                    ru: 'Пользовательский URL канала',
                    pt: 'URL personalizado do canal',
                    nl: 'Aangepaste kanaal-URL',
                    fr: 'URL personnalisée de la chaîne',
                    it: 'URL personalizzato del canale',
                    es: 'URL personalizada del canal',
                    pl: 'Niestandardowy adres URL kanału',
                    'zh-cn': '频道自定义网址',
                },
                type: 'string',
                role: 'text',
                read: true,
                write: false,
            },
            native: {},
        });

        await this.setObjectNotExistsAsync(`${cpath}.snippet.publishedAt`, {
            type: 'state',
            common: {
                name: {
                    en: 'Channel Publish Date',
                    de: 'Datum der Veröffentlichung des Kanals',
                    ru: 'Дата публикации канала',
                    pt: 'Data de Publicação do Canal',
                    nl: 'Publicatiedatum kanaal',
                    fr: 'Date de publication de la chaîne',
                    it: 'Data di pubblicazione del canale',
                    es: 'Fecha de publicación del canal',
                    pl: 'Data publikacji kanału',
                    'zh-cn': '频道发布日期',
                },
                type: 'number',
                role: 'date',
                read: true,
                write: false,
            },
            native: {},
        });

        return new Promise((resolve, reject) => {
            if (apiKey) {
                this.log.debug(`[getChannelData] youtube/v3/channels - request init: ${id}`);

                axios({
                    method: 'get',
                    baseURL: 'https://www.googleapis.com/youtube/v3/',
                    url: `/channels?part=snippet,statistics&id=${id}&key=${apiKey}`,
                    timeout: 4500,
                    responseType: 'json',
                })
                    .then(async (response) => {
                        this.log.debug(`[getChannelData] youtube/v3/channels - received data for ${id} (${response.status}): ${JSON.stringify(response.data)}`);

                        const content = response.data;

                        if (content?.items && Array.isArray(content['items']) && content['items'].length > 0) {
                            const firstItem = content['items'][0];

                            if (firstItem?.statistics) {
                                await this.setStateChangedAsync(`${cpath}.statistics.viewCount`, { val: parseInt(firstItem.statistics.viewCount), ack: true });
                                await this.setStateChangedAsync(`${cpath}.statistics.videoViewCountAvg`, { val: Math.round(firstItem.statistics.viewCount / firstItem.statistics.videoCount), ack: true });
                                await this.setStateChangedAsync(`${cpath}.statistics.subscriberCount`, { val: parseInt(firstItem.statistics.subscriberCount), ack: true });
                                await this.setStateChangedAsync(`${cpath}.statistics.videoSubscriberCountAvg`, {
                                    val: Math.round(firstItem.statistics.subscriberCount / firstItem.statistics.videoCount),
                                    ack: true,
                                });
                                await this.setStateChangedAsync(`${cpath}.statistics.videoCount`, { val: parseInt(firstItem.statistics.videoCount), ack: true });
                            }

                            if (firstItem?.snippet) {
                                await this.setStateChangedAsync(`${cpath}.snippet.title`, { val: firstItem.snippet.title, ack: true });
                                await this.setStateChangedAsync(`${cpath}.snippet.description`, { val: firstItem.snippet.description, ack: true });
                                await this.setStateChangedAsync(`${cpath}.snippet.customUrl`, { val: firstItem.snippet.customUrl, ack: true });
                                await this.setStateChangedAsync(`${cpath}.snippet.publishedAt`, { val: new Date(firstItem.snippet.publishedAt).getTime(), ack: true });
                            }

                            const updateTime = new Date();
                            await this.setStateAsync(`${cpath}.lastUpdate`, { val: new Date(updateTime.getTime() - updateTime.getTimezoneOffset() * 60000).getTime(), ack: true });

                            if (enableVideoInformation) {
                                await this.getChannelVideoData(id, cpath);
                            }

                            if (firstItem?.statistics && firstItem?.snippet) {
                                resolve({
                                    _id: id,
                                    title: firstItem.snippet.title,
                                    subscriberCount: firstItem.statistics.subscriberCount,
                                    viewCount: firstItem.statistics.viewCount,
                                    videoCount: firstItem.statistics.videoCount,
                                });
                            } else {
                                reject(`[getChannelData] youtube/v3/channels - missing statistic information in response`);
                            }
                        } else {
                            reject(`[getChannelData] youtube/v3/channels - received empty response - check channel id: ${id}`);
                        }
                    })
                    .catch(reject);
            } else {
                reject('[getChannelData] API Key not configured');
            }
        });
    }

    async getChannelVideoData(id, cpath) {
        // Documentation: https://developers.google.com/youtube/v3/docs/search/list

        await this.setObjectNotExistsAsync(`${cpath}.video`, {
            type: 'channel',
            common: {
                name: {
                    en: 'Videos',
                    de: 'Videos',
                    ru: 'Видео',
                    pt: 'Vídeos',
                    nl: 'Videos',
                    fr: 'Vidéos',
                    it: 'Video',
                    es: 'Videos',
                    pl: 'Filmy',
                    'zh-cn': '影片',
                },
            },
            native: {},
        });

        return new Promise((resolve) => {
            const apiKey = this.config.apiKey;

            this.log.debug(`[getChannelVideoData] youtube/v3/search - request init: ${id}`);

            axios({
                method: 'get',
                baseURL: 'https://www.googleapis.com/youtube/v3/',
                url: `/search?part=id,snippet&type=video&order=date&maxResults=5&channelId=${id}&key=${apiKey}`,
                timeout: 4500,
                responseType: 'json',
            })
                .then(async (response) => {
                    this.log.debug(`[getChannelVideoData] youtube/v3/search - received data for ${id} (${response.status}): ${JSON.stringify(response.data)}`);

                    const content = response.data;

                    if (content && Object.prototype.hasOwnProperty.call(content, 'items') && Array.isArray(content['items']) && content['items'].length > 0) {
                        for (let i = 0; i < content['items'].length; i++) {
                            const v = content['items'][i];
                            const path = `${cpath}.video.${i}`;

                            await this.setObjectNotExistsAsync(path, {
                                type: 'channel',
                                common: {
                                    name: 'Video data ' + (i + 1),
                                },
                                native: {},
                            });

                            await this.setObjectNotExistsAsync(`${path}.id`, {
                                type: 'state',
                                common: {
                                    name: {
                                        en: 'Video ID',
                                        de: 'Video-ID',
                                        ru: 'ID видео',
                                        pt: 'ID do vídeo',
                                        nl: 'Video-ID',
                                        fr: 'Identifiant de la vidéo',
                                        it: 'ID video',
                                        es: 'ID de video',
                                        pl: 'Identyfikator wideo',
                                        'zh-cn': '视频标识',
                                    },
                                    type: 'string',
                                    role: 'media.playid',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            });
                            await this.setStateChangedAsync(`${path}.id`, { val: v.id.videoId, ack: true });

                            await this.setObjectNotExistsAsync(`${path}.url`, {
                                type: 'state',
                                common: {
                                    name: {
                                        en: 'Video URL',
                                        de: 'Video-URL',
                                        ru: 'URL видео',
                                        pt: 'URL do vídeo',
                                        nl: 'Video URL',
                                        fr: 'URL de la vidéo',
                                        it: 'URL del video',
                                        es: 'URL del vídeo',
                                        pl: 'URL wideo',
                                        'zh-cn': '视频网址',
                                    },
                                    type: 'string',
                                    role: 'url.blank',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            });
                            await this.setStateChangedAsync(`${path}.url`, { val: 'https://youtu.be/' + v.id.videoId, ack: true });

                            await this.setObjectNotExistsAsync(`${path}.title`, {
                                type: 'state',
                                common: {
                                    name: {
                                        en: 'Video Title',
                                        de: 'Videotitel',
                                        ru: 'Название видео',
                                        pt: 'Título do vídeo',
                                        nl: 'titel van de video',
                                        fr: 'titre de la vidéo',
                                        it: 'Titolo del video',
                                        es: 'Titulo del Video',
                                        pl: 'Tytuł Filmu',
                                        'zh-cn': '影片名称',
                                    },
                                    type: 'string',
                                    role: 'media.title',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            });
                            await this.setStateChangedAsync(`${path}.title`, { val: v.snippet.title, ack: true });

                            await this.setObjectNotExistsAsync(`${path}.published`, {
                                type: 'state',
                                common: {
                                    name: {
                                        en: 'Publishing date',
                                        de: 'Erscheinungsdatum',
                                        ru: 'Дата публикации',
                                        pt: 'Data de publicação',
                                        nl: 'Publicatiedatum',
                                        fr: 'Date de publication',
                                        it: 'Data di pubblicazione',
                                        es: 'Fecha de publicación',
                                        pl: 'Data publikacji',
                                        'zh-cn': '出版日期',
                                    },
                                    type: 'number',
                                    role: 'date',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            });
                            await this.setStateChangedAsync(`${path}.published`, { val: new Date(v.snippet.publishedAt).getTime(), ack: true });

                            await this.setObjectNotExistsAsync(`${path}.description`, {
                                type: 'state',
                                common: {
                                    name: {
                                        en: 'Description',
                                        de: 'Beschreibung',
                                        ru: 'Описание',
                                        pt: 'Descrição',
                                        nl: 'Beschrijving',
                                        fr: 'La description',
                                        it: 'Descrizione',
                                        es: 'Descripción',
                                        pl: 'Opis',
                                        'zh-cn': '描述',
                                    },
                                    type: 'string',
                                    role: 'text',
                                    read: true,
                                    write: false,
                                },
                                native: {},
                            });
                            await this.setStateChangedAsync(`${path}.description`, { val: v.snippet.description, ack: true });
                        }
                    } else {
                        this.log.warn(`[getChannelVideoData] youtube/v3/search - received empty response - check channel id: ${id}`);
                    }

                    resolve(true);
                })
                .catch((err) => {
                    this.log.error(`[getChannelVideoData] youtube/v3/search - unable to fetch data for: ${id}: ${err}`);
                    resolve(false);
                });
        });
    }

    async onReady() {
        const channels = this.config.channels;
        const channelDataList = [];

        const states = await this.getChannelsOfAsync('channels');

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
            this.log.debug(`[onReady] found ${channels.length} channels in config, fetching data`);

            for (const c in channels) {
                const channel = channels[c];
                const cleanChannelName = channel.name.replace(/\s/g, '').replace(/[^\p{Ll}\p{Lu}\p{Nd}]+/gu, '_');

                channelsKeep.push(`channels.${cleanChannelName}`);

                await this.setObjectNotExistsAsync(`channels.${cleanChannelName}`, {
                    type: 'channel',
                    common: {
                        name: channel.name,
                    },
                    native: {},
                });

                try {
                    const channelData = await this.getChannelData(channel.id, `channels.${cleanChannelName}`);
                    if (typeof channelData === 'object') {
                        channelDataList.push(channelData);
                    }
                } catch (err) {
                    this.log.warn(`${err}`);
                }
            }

            channelDataList.sort(function (a, b) {
                return b.subscriberCount - a.subscriberCount;
            });

            await this.setStateAsync('summary.json', { val: JSON.stringify(channelDataList), ack: true });
        } else {
            this.log.warn('[onReady] No channels configured - check instance configuration');
        }

        // Delete non existent channels
        for (let i = 0; i < channelsAll.length; i++) {
            const id = channelsAll[i];

            if (channelsKeep.indexOf(id) === -1) {
                await this.delObjectAsync(id, { recursive: true });
                this.log.debug(`[onReady] Channel deleted: ${id}`);
            }
        }

        this.log.debug(`[onReady] everything done - instance will stop soon`);

        this.stop();
    }

    removeNamespace(id) {
        const re = new RegExp(this.namespace + '*\\.', 'g');
        return id.replace(re, '');
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
