var Q = require('q');
module.exports = function (io) {
    io.on('connection', handleConnection);
};
function handleConnection(socket) {
    console.log('client connected');
    socket.on('disconnect', function () {
        console.log('client disconnected');
    });
}