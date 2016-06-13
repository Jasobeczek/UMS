'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var https = require('https');
var socketIO = require('socket.io');
var fs = require('fs');
var pg = require('pg');
var connectionString = "postgres://ums:ums.123@localhost/ums";

var client = new pg.Client(connectionString);
client.connect();

//SSL options
var options = {
    key: fs.readFileSync('/etc/ssl/private/umsproj.doms.net.key'),
    cert: fs.readFileSync('/etc/ssl/certs/umsproj.doms.net.crt')
};

var fileServer = new(nodeStatic.Server)();
var app = https.createServer(options, function(req, res) {
    fileServer.serve(req, res);
}).listen(8443);

var io = socketIO.listen(app);
console.log("Server is running...")

io.sockets.on('connection', function(socket) {

    // convenience function to log server messages on the client
    function log() {
        var array = ['Message from server:'];
        array.push.apply(array, arguments);
        socket.emit('log', array);
    }

    socket.on('message', function(message) {
        log('Client said: ', message);
        console.log('Client said: ', message);

        // for a real app, would be room-only (not broadcast)
        socket.broadcast.emit('message', message);
    });
    socket.on('bye', function(room) {
        console.log('Client ID ' + socket.id + ' leaving room ' + room);
        socket.leave(room);
        socket.emit('leave', room, socket.id);

    });

    socket.on('create or join', function(room) {
        log('Received request to create or join room ' + room);
        console.log('Received request to create or join room ' + room);

        var numClients = io.sockets.sockets.length;
        log('Room ' + room + ' now has ' + numClients + ' client(s)');

        if (numClients === 1) {
            socket.join(room);
            log('Client ID ' + socket.id + ' created room ' + room);
            console.log('Client ID ' + socket.id + ' created room ' + room);
            socket.emit('created', room, socket.id);

        } else if (numClients === 2) {
            log('Client ID ' + socket.id + ' joined room ' + room);
            console.log('Client ID ' + socket.id + ' joined room ' + room);
            io.sockets.in(room).emit('join', room);
            socket.join(room);
            socket.emit('joined', room, socket.id);
            io.sockets.in(room).emit('ready');
        } else { // max two clients
            socket.emit('full', room);
        }
    });

    socket.on('ipaddr', function() {
        var ifaces = os.networkInterfaces();
        for (var dev in ifaces) {
            ifaces[dev].forEach(function(details) {
                if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
                    socket.emit('ipaddr', details.address);
                }
            });
        }
    });

});
