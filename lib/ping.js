'use strict';

var Rx = require('rx');
var stop = new Rx.Subject();
var gopro = require('./gopro.js');

process.on('message', function(action) {
    if (action === 'start') {
        startPing();
    } else if (action === 'stop') {
        stopPing();
    }
});

function ping() {
    return gopro.ping()
        .takeUntil(stop)
        .doAction(function() {
            console.log('ping %d', Date.now());
        })
        .subscribeWithErrorHandler();
}

function startPing() {
    console.log('starting ping');
    ping();
}

function stopPing() {
    console.log('stopping ping');
    stop.onNext();
}
