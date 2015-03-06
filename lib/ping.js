'use strict';

var Rx = require('rx');
var stop = new Rx.Subject();
var gopro = require('./gopro.js');

var FREQ = 10000;

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
        .doOnError(function(err) {
            console.error(err);
            console.log('failed to ping, retrying ... ');
        })
        .retry()
        .doAction(function() {
            console.log('ping %d', Date.now());
        })
        .subscribeWithErrorHandler();
}

function startPing() {
    console.log('starting ping');
    ping(FREQ);
}

function stopPing() {
    console.log('stopping ping');
    stop.onNext();
}
