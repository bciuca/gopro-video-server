var gopro = require('./lib/gopro.js');
var child = require('child_process').fork('./lib/ping.js');

function ping() {
    child.send('start');
}

function getLatest() {
    gopro.getLatestClip().debug();
}
ping();
//console.log(process.stderr.__proto__);
//getLatest();
//gopro.getNthClip(-2).debug();

//console.log(require('path').resolve(__dirname + '/../media'));




