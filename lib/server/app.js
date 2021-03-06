var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
app.configure(function () {
    app.use(express.static(__dirname + '/../../static'));
});
var server = app.listen(port);
var io = require('socket.io').listen(server);
io.set('log level', 1);
io.configure('production', function () {
    io.set('log level', 1);
});
io.configure(function () {
    io.set('transports', ['xhr-polling']);
    io.set('polling duration', 5);
    io.set('heartbeat timeout', 7);
    io.set('heartbeat interval', 5);
    io.set('close timeout', 10);
});
require('./game')(io);