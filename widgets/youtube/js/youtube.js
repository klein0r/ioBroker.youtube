/*
    ioBroker.vis YouTube Widget-Set

    Copyright 2022 Matthias Kleine info@haus-automatisierung.com
*/
'use strict';

// add translations for edit mode
$.extend(
    true,
    systemDictionary,
    {
    }
);

// this code can be placed directly in youtube.html
vis.binds['youtube'] = {
    version: '3.0.1',
    showVersion: function () {
        if (vis.binds['youtube'].version) {
            console.log('Version youtube: ' + vis.binds['youtube'].version);
            vis.binds['youtube'].version = null;
        }
    },
    createWidget: function (widgetID, view, data, style) {
        var $div = $('#' + widgetID);
        // if nothing found => wait
        if (!$div.length) {
            return setTimeout(function () {
                vis.binds['youtube'].createWidget(widgetID, view, data, style);
            }, 100);
        }

        $div.find('.current-value').html(vis.states[data.oid + '.val']);

        // subscribe on updates of value
        if (data.oid) {
            vis.states.bind(data.oid + '.val', function (e, newVal, oldVal) {
                $div.find('.current-value').html(newVal);
            });
        }
    }
};

vis.binds['youtube'].showVersion();