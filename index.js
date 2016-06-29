'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var https = require('https'); //Https server
var socketIO = require('socket.io');
var fs = require('fs'); //File system

//var pg = require('pg'); //Postgresql connection
//var connectionString = "postgres://ums:ums.123@localhost/ums";
//var client = new pg.Client(connectionString);
//client.connect();

//SSL options for server
var options = {
    key: fs.readFileSync('/etc/ssl/private/umsproj.doms.net.key'),
    cert: fs.readFileSync('/etc/ssl/certs/umsproj.doms.net.crt')
};

var fileServer = new(nodeStatic.Server)(); //Static server to serve socket.io to web browser
var app = https.createServer(options, function(req, res) {
    fileServer.serve(req, res);
}).listen(8443);

//Start server
var io = socketIO.listen(app);
console.log("Server is running...");

io.sockets.on('connection', function(socket) {

    //Convenience function to log server messages on the client
    function log() {
        var array = ['Message from server:'];
        array.push.apply(array, arguments);
        socket.emit('log', array);
    }

    socket.on('offer', function(array) {
        var message = array[0];
        var room = array[1];
        console.log('Received offer from ' + socket.id + ' in room: ' + room);
        socket.to(room).emit('offer', message);

    });

    socket.on('answer', function(array) {
        var message = array[0];
        var room = array[1];
        console.log('Received answer from ' + socket.id + ' in room: ' + room);
        socket.to(room).emit('answer', message);
    });

    socket.on('candidate', function(array) {
        var message = array[0];
        var room = array[1];
        console.log('Received candidate from ' + socket.id + ' in room: ' + room);

        socket.to(room).emit('candidate', message);

    });

    socket.on('got media', function(room) {
        console.log('Received got media from ' + socket.id + ' in room: ' + room);
        socket.to(room).emit('got media', room);
    });

    //Server received bye message
    //Remove this socket from room
    socket.on('bye', function(room) {
        console.log('Client ID ' + socket.id + ' leaving room ' + room);
        socket.emit('leave');
        socket.to(room).emit('bye', room);
        socket.leave(room);
        //socket.disconnect();
        var ioRooms = io.sockets.adapter.rooms;
        if (ioRooms[room]) {
            var numClients = ioRooms[room].length;
            console.log('Room ' + room + ' now has ' + numClients + ' client(s)');
        } else console.log('Room ' + room + ' does not exits');

    });

    //Server received create or join message
    socket.on('create or join', function(room) {
        log('Received request to create or join room ' + room);
        console.log('Received request to create or join room ' + room);

        var ioRooms = io.sockets.adapter.rooms;
        if (ioRooms[room] === undefined) { //Room doesn't exists
            socket.join(room);
            socket.emit('created', room);
        } else { //Room exists
            if (ioRooms[room].length >= 2) {
                socket.emit('full', room); //Send message to initiator - room is full
            } else {
                socket.join(room);
                socket.emit('joined', room); //Sned message to initiator to inform that he is in room
                socket.to(room).emit('join', room); //Send message to clients that someone joined room
            }
        }
        var numClients = ioRooms[room].length;
        log('Room ' + room + ' now has ' + numClients + ' client(s)');
        console.log('Room ' + room + ' now has ' + numClients + ' client(s)');
    });

    //Server received ipaddr message
    //This is unused? 
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
