var gopro = require('./lib/gopro.js');
var child = require('child_process').fork('./lib/ping.js');
var serverProcess = require('child_process').fork('./server.js');

function ping() {
    child.send('start');
}

function startServer() {
    serverProcess.send('start');
}

ping();
startServer();




