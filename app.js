var pingProcess = require('child_process').fork('./lib/ping.js');
var serverProcess = require('child_process').fork('./server.js');

function ping() {
    pingProcess.send('start');
}

function startServer() {
    serverProcess.send('start');
}

ping();
startServer();




