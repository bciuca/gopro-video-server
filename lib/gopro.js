'use strict';

var Rx = require('rx');
var rxHttpClient = require('rx-http-client');
var rxGet = rxHttpClient.getJSON;
var rxGetStream = rxHttpClient.getStream;
var fs = require('fs');
var noop = function() {};
var resolve = require('path').resolve;

var IP = '10.5.5.9';

Rx.Observable.prototype.subscribeWithErrorHandler = function() {
    return this.subscribe(noop, function(err) {console.error(err);}, noop);
};

Rx.Observable.prototype.toConsole = function() {
    return this.doAction(function(data) {
        console.log('onNext:', data);
    }, function(err) {
        console.error(err);
    }, function() {
        console.log('completed.');
    });
};

Rx.Observable.prototype.debug = function() {
    return this.toConsole().subscribeWithErrorHandler();
};

function getCameraStatus() {
    return rxGet('http://' + IP + '/gp/gpControl/status');
}

function setMode(mode, submode) {
    return rxGet('http://' + IP + '/gp/gpControl/command/sub_mode?mode=' + mode + '&sub_mode=' + submode);

}

function startCapture() {
    console.log('>> start capture');
    return rxGet('http://' + IP + '/gp/gpControl/command/shutter?p=1');
}

function endCapture() {
    console.log('>> end capture');
    return rxGet('http://' + IP + '/gp/gpControl/command/shutter?p=0');
}

function getMediaList() {
    console.log('getting media list');
    return rxGet('http://' + IP + '/gp/gpMediaList');
}

function getMedia(mediaPath) {
    console.log('getting media');
    return Rx.Observable.create(function(observer) {
        var path = resolve(__dirname + '/../public/media');
        var url = 'http://' + IP + '/videos/DCIM/' + mediaPath;
        var name = url.split('/');
        name = path + '/' + name[name.length-1];
        console.log('getting media from camera', url);
        console.log('saving to server', name);

        var outStream = fs.createWriteStream(name);
        outStream.on('error' ,function(err) { observer.onError(err); });
        outStream.on('end'   ,function() { console.log('stream end'); });
        outStream.on('finish',function() { console.log('stream finish'); });
        outStream.on('close' ,function() { console.log('stream close'); observer.onNext(); observer.onCompleted();});

        var totalSize = 0;
        rxGetStream(url)
            .doAction(function(data) {
                outStream.write(data.chunk);
            }, noop, function() {
                console.log('should end here');
                observer.onNext();
                observer.onCompleted();
            }, function(err) {
                console.error(err);
                observer.onError(err);
            })
            .map(function(data) {
                var length = data.totalLength
                totalSize += data.chunk.length;
                return (totalSize/length * 100).toFixed();
            })
            .distinctUntilChanged()
            .doAction(function(progress) {
                process.stdout.write('');
                process.stdout.write(progress + '%\n');
                process.stdout.write('');
            })
            .subscribe();
    });
}

function getNthClip(n) {
    console.log('getting nth clip', n);
    return getMediaList()
        .map(function(mediaList) {
            console.log('nthclip mediaList', mediaList);
            var path = mediaList.media[0];
            var dir = path.d;
            var fileList = path.fs;
            var index = n < 0 || isNaN(n) ? -1 : n;
            var lastMediaEntry = fileList[index < 0 ? fileList.length + n : n];
            // Example lastMediaEntry:
            //{
            //    dir: '100GOPRO',
            //    media: {
            //       n: 'GOPR1329.MP4',
            //       mod: '1425560652',
            //       ls: '869891',
            //       s: '31049995'
            //   }
            //}

            var mediaPath = dir + '/' + lastMediaEntry.n;
            console.log('mediaPath=', mediaPath);
            return mediaPath;
        });
}

function getNthClipLocation(n, getMediaAsset) {
    return getNthClip(n)
        .flatMap(function(clip) {
            if (getMediaAsset) {
                return getMedia(clip)
                    .map(function() {
                        console.log('get media name', clip.replace(/.*\//, ''));
                        return clip.replace(/.*\//, '');
                    });
            } else {
                return Rx.Observable.return('media/' + clip.replace(/.*\//, ''));
            }
        });
}

function getLatestClip() {
    return getNthClip(-1)
        .flatMap(function(path) {
            return getMedia(path);
        });
}

var capturing;
var captureObservable;
function takeClip(durationInSeconds) {
    function captureComplete() {
        console.log('!!!!!!!!!!!!!!!! setting capture complete. !!!!!!!!!!!!!!!!!!!');
        capturing = false;
        captureObservable = null;
    }

    return Rx.Observable.defer(function() {
        if (capturing) throw new Error('capture in progress');
        console.log('>>>>>>>>>>  starting capture <<<<<<<<<<<<<');
        capturing = true;
        return Rx.Observable.return(capturing);
    }).flatMap(function() {
        return getNthClip(-1)
            .map(function(clip) {
                var clipName = 'media/'
                    + clip.replace(/.*\//, '').match(/[A-Z]+/)[0]
                    + (parseInt(clip.replace(/.*\//, '').match(/\d+/)[0]) + 1)
                    + '.MP4';

                // this is shitty i know.
                captureObservable = startCapture()
                    .delay(durationInSeconds * 1000)
                    .flatMap(function() { return endCapture(); })
                    .delay(1000)
                    .flatMap(function() {
                        console.log('should save to disk');
                        // save the media to disk
                        return getNthClip(-1);
                    })
                    .flatMap(function(name) {
                        console.log('Getting file...', name);
                        return getMedia(name);
                    })
                    .doAction(noop, function(err) {console.error(err); capturing = false; },captureComplete);


                captureObservable.subscribe();

                return { clip: clipName };
            });
    });
}

function getCaptureInProgress() {
    return captureObservable || Rx.Observable.return(null);
}

function ping(delay) {
    delay = delay || 2000;
    // We need to ping the gopro so the connection doesnt die.
    // Might be a bug with Mac OS X wireless.
    return Rx.Observable.interval(delay)
        .flatMap(function() {
            return getCameraStatus();
        });
}


module.exports = {
    rxGet: rxGet,
    getCameraStatus: getCameraStatus,
    setMode: setMode,
    startCapture: startCapture,
    endCapture: endCapture,
    getMediaList: getMediaList,
    getMedia: getMedia,
    getLatestClip: getLatestClip,
    takeClip: takeClip,
    getNthClip: getNthClip,
    getNthClipLocation: getNthClipLocation,
    getCaptureInProgress: getCaptureInProgress,
    ping: ping
};



