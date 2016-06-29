'use strict';

/**
 * Status of channel 
 * @type {Boolean}
 */
var isChannelReady = false;
/**
 * Did client created the room
 * @type {Boolean}
 */
var isInitiator = false;
/**
 * Is connection already started
 * @type {Boolean}
 */
var isStarted = false;
/**
 * Is client in room
 * @type {Boolean}
 */
var isInRoom = false;
/**
 * Local stream
 */
var localStream;
/**
 * Peer connection
 */
var pc;
/**
 * Remote stream
 */
var remoteStream;

/**
 * PC configuration
 * @type {Object}
 */
var pcConfig = {
    'iceServers': [{
        'url': 'stun:stun.l.google.com:19302'
    }]
};
/**
 * SDP constraints
 * Set up audio and video regardless of what devices are present.
 * @type {Object}
 */
var sdpConstraints = {
    'mandatory': {
        'OfferToReceiveAudio': true,
        'OfferToReceiveVideo': true
    }
};
/**
 * Variable for current user room
 * Room is session?
 * @type {String}
 */
var room = null;
/**
 * Socket is object for communicating with server
 * @type  {object}
 */
var socket = null;
/**
 * Local video object 
 * @type {object}
 */
var localVideo = null;
/**
 * Remote video object
 * @type {object}
 */
var remoteVideo = null;

/**
 * * Start webRTC - video and audio communication
 * This create socket.io session to describe
 * connection variables.
 * Than create RTC peer communication for
 * video audio
 * @param  {string} roomName Name of room to join
 */
function startWebRTC(roomName) {
    room = roomName;
    socket = io.connect('https://umsproj.doms.net:8443');

    localVideo = document.querySelector('#localVideo');
    remoteVideo = document.querySelector('#remoteVideo');

    //Send join request to server
    if (room !== '' && room && !isInRoom) {
        socket.emit('create or join', room);
        console.log('Attempted to create or  join room', room);
    } else if (room !== '') {
        alert("Jesteś już połączony!");
        return null;
    } else {
        alert("Nie wybrałeś nazwy użytkownika!");
        return null;
    }

    //Respond to created message
    //This client created new room on server site
    socket.on('created', function(room) {
        console.log('Created room ' + room);
        isInitiator = true;
        isInRoom = true;
    });

    //Respond to full message
    //This client can't join the room cause there are 2 clients
    socket.on('full', function(room) {
        console.log('Room ' + room + ' is full');
        isInRoom = false;
        isChannelReady = false;
        isInitiator = false;
    });

    socket.on('joined', function(room) {
        console.log('Joined room ' + room);
        isChannelReady = true;
        isInRoom = true;
    });

    //Respond to join message from room
    //Other client was accepted to join the room
    socket.on('join', function(room) {
        console.log('Another peer joined room ' + room);
        isChannelReady = true;
        maybeStart();
    });

    //Respond to log message
    //Log messages are message shown on server site
    //useful for debugging
    socket.on('log', function(array) {
        console.log.apply(console, array);
    });

    //Respond to leave message
    //
    socket.on('leave', function() {
        console.log('Leaved: ' + room);
        if (pc) {
            pc.close();
        }
        pc = null;
        socket = null;
        isInRoom = false;
        isStarted = false;
        isChannelReady = false;
    });

    //Respond to offer message
    //Offer other host connection parameters for A/V session
    socket.on('offer', function(message) {
        if (!isStarted) {
            maybeStart();
        }
        pc.setRemoteDescription(new RTCSessionDescription(message));
        doAnswer();
    });

    //Respond to answer message
    //The answer message for offered connection parameters
    socket.on('answer', function(message) {
        if (isStarted) {
            pc.setRemoteDescription(new RTCSessionDescription(message));
        }
    });

    //Respond to candidate message
    //Candidate is parameters for video audio
    socket.on('candidate', function(message) {
        if (isStarted) {
            var candidate = new RTCIceCandidate({
                sdpMLineIndex: message.label,
                candidate: message.candidate
            });
            pc.addIceCandidate(candidate);
        }
    });

    //Respond to bye message
    //Bye is message for remote hangup
    socket.on('bye', function() {
        if (isStarted) {
            handleRemoteHangup();
        }
    });

    //Setup media device - camera, microphone
    navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        })
        .then(gotStream)
        .catch(function(e) {
            alert('getUserMedia() error: ' + e.name);
        });

    /**
     * Set streams for localVideo
     * @param  {object} stream Stream for video object
     */
    function gotStream(stream) {
        console.log('Adding local stream.');
        localVideo.src = window.URL.createObjectURL(stream);
        localStream = stream;
        socket.emit('got media', room);
        //sendMessage('got user media');
        if (isInitiator) {
            maybeStart();
        }
    }

    var constraints = {
        video: true,
        audio: true
    };

    console.log('Getting user media with constraints', constraints);
}

/**
 * Start connection
 */
function maybeStart() {
    console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
    if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
        console.log('>>>>>> creating peer connection');
        createPeerConnection();
        pc.addStream(localStream);
        isStarted = true;
        console.log('isInitiator', isInitiator);
        if (isInitiator) {
            sendOffer();
        }
    }
}

/**
 * Stop webRTC
 */
function maybeStop() {
    if (socket) {
        socket.emit('bye', room);
    }
    if (localStream) {
        for (var i = localStream.getTracks().length - 1; i >= 0; i--) {
            localStream.getTracks()[i].stop();
        }
    }
}
//On close or reload send bye message
window.onbeforeunload = function() {
    if (socket) {
        socket.emit('bye', room);
    }
};

/**
 * Create peer connection
 * @return {[type]} [description]
 */
function createPeerConnection() {
    try {
        pc = new RTCPeerConnection(null);
        pc.onicecandidate = handleIceCandidate;
        pc.onaddstream = handleRemoteStreamAdded;
        pc.onremovestream = handleRemoteStreamRemoved;
        console.log('Created RTCPeerConnnection');
    } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return;
    }
}

/**
 * Handle candidate
 * @param  {object} event Event object
 */
function handleIceCandidate(event) {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
        var message = {
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
        };
        socket.emit('candidate', [message, room]);
    } else {
        console.log('End of candidates.');
    }
}

/**
 * Remote stream added
 * @param  {object} event Event data
 */
function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
    remoteStream = event.stream;
}

/**
 * Create offer error
 * @param  {object} event Event data
 */
function handleCreateOfferError(event) {
    console.log('createOffer() error: ', event);
}

/**
 * Send offer to peer 
 */
function sendOffer() {
    console.log('Sending offer to peer');
    pc.createOffer(setLocalAndSendOffer, handleCreateOfferError);
}

/**
 * Answer - send answer to peer
 */
function doAnswer() {
    console.log('Sending answer to peer.');
    pc.createAnswer().then(
        setLocalAndSendAnswer,
        onCreateSessionDescriptionError
    );
}

/**
 * Set local parameters for session and emit offer
 */
function setLocalAndSendOffer(sessionDescription) {
    pc.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    socket.emit('offer', [sessionDescription, room]);
    //sendMessage(sessionDescription);
}

/**
 * Set local parameters for session and emit answer
 */
function setLocalAndSendAnswer(sessionDescription) {
    pc.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    socket.emit('answer', [sessionDescription, room]);
    //sendMessage(sessionDescription);
}
/**
 * Handle session description errors
 * @param  {object} error Error object
 */
function onCreateSessionDescriptionError(error) {
    console.log('Failed to create session description: ' + error.toString());
}

/**
 * Stream added 
 * @param  {object} event Event data
 */
function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
    remoteStream = event.stream;
}

/**
 * Stream removed 
 * @param  {object} event Event data
 */
function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
}

/**
 * Handle remote hangup 
 */
function handleRemoteHangup() {
    console.log('Session terminated.');
    stop();
    isInitiator = false;
}

/**
 * End call - hangup
 */
function hangup() {
    console.log('Hanging up.');
    stop();
    maybeStop();
}

/**
 * Stop webRTC
 */
function stop() {
    isStarted = false;
    // isAudioMuted = false;
    // isVideoMuted = false;
    if (pc) {
        pc.close();
    }
    pc = null;
}

//Make statistics
var statistics = {};
statistics.BytesReceivedAudio = 0;
statistics.BytesReceivedVideo = 0;
setInterval(function() {
    if (pc) {
        var aSelector = pc.getRemoteStreams()[0].getAudioTracks()[0];
        pc.getStats(function(stats) {
            var result = stats.result();
            for (var i = 0; i < result.length; ++i) {
                if (result[i].type === "ssrc") {
                    var ssrc = result[i];
                    var bytesReceived = parseInt(ssrc.stat("bytesReceived"));
                    var bitRate = (bytesReceived - statistics.BytesReceivedAudio) / 1024;
                    $('#BitRateAudio').val(bitRate + "KB/s");
                    $('#BytesReceivedAudio').val(ssrc.stat("bytesReceived"));
                    $('#PacketsReceivedAudio').val(ssrc.stat("packetsReceived"));
                    $('#PacketsLostAudio').val(ssrc.stat("packetsLost"));
                    statistics.BytesReceivedAudio = bytesReceived;
                }
            }
        }, aSelector);

        var vSelector = pc.getRemoteStreams()[0].getVideoTracks()[0];
        pc.getStats(function(stats) {
            var result = stats.result();
            for (var i = 0; i < result.length; ++i) {
                if (result[i].type === "ssrc") {
                    var ssrc = result[i];
                    var bytesReceived = parseInt(ssrc.stat("bytesReceived"));
                    var bitRate = (bytesReceived - statistics.BytesReceivedVideo) / 1024;
                    $('#BitRateVideo').val(bitRate + "KB/s");
                    $('#BytesReceivedVideo').val(ssrc.stat("bytesReceived"));
                    $('#PacketsReceivedVideo').val(ssrc.stat("packetsReceived"));
                    $('#PacketsLostVideo').val(ssrc.stat("packetsLost"));
                    statistics.BytesReceivedVideo = bytesReceived;
                }
            }
        }, vSelector);
    }
}, 2000);
