var restify = require('restify');
var server = restify.createServer({ name: 'gopro-server' });
var resolve = require('path').resolve;
var gopro = require('./lib/gopro.js');
var noop = function() {};
var Rx = require('rx');
var stopCapture = new Rx.Subject();
var capturing = false;


server.use(
    function crossOrigin(req,res,next){
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        return next();
    }
);
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.listen(3000, function() {
    console.log('%s listening at %s', server.name, server.url)
});

server.get('/test', function(req, res, next) {
    res.send({status: 'ok'});
    next();
});

server.get('/capture', function(req, res, next) {
    if (capturing) {
        res.send(400, { status: 'capture in progress'});
        return next();
    }

    capturing = true;

    var seconds = parseInt(req.params.s, 10);
    seconds = isNaN(seconds) ? 3 : seconds;
    gopro.takeClip(seconds)
        .takeUntil(stopCapture)
        .doAction(function(clip) {
            res.send(clip);
        }, function() {capturing = false; }, function() {capturing = false;})
        .subscribe(noop, sendError(res), next);
});

server.get('/latest', function(req, res, next) {
    gopro.getNthClipLocation(-1, req.params.get)
        .doAction(function(clip) {
            res.send({clip: clip});
            next();
        })
        .subscribe(noop, sendError(res), next);
});

server.get('/status', function(req, res, next) {
    gopro.getCameraStatus()
        .doAction(function(status) {
            res.send(status);
        })
        .subscribe(noop, sendError(res), next);
});

server.get('/stop', function(req, res, next) {
    stopCapture.onNext();
    gopro.endCapture().subscribe();
    res.send({status: 'ok'});
    next();
});

server.get(/\/media\/.*/, restify.serveStatic({
    directory: './public',
    default: 'index.html'
}));


function sendError(res) {
    return function(err) { res.send(500, err); };
}