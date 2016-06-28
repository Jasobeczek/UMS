'use strict';

var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var isInRoom = false;
var localStream;
var pc;
var remoteStream;
var turnReady;

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
    if (room !== '' && room) {
        socket.emit('create or join', room);
        console.log('Attempted to create or  join room', room);
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
        console.log('Joined room' + room);
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
    //Log messages are message shown on server site
    //useful for debugging
    socket.on('leave', function(array) {
        console.log('Leaved: ' + room);
        if (pc) {
            pc.close();
        }
        pc = null;
        socket = null;
        isInRoom = false;
    });

    socket.on('offer', function(message) {
        if (!isInitiator && !isStarted) {
            maybeStart();
        }
        pc.setRemoteDescription(new RTCSessionDescription(message));
        doAnswer();
    });

    socket.on('answer', function(message) {
        if (isStarted) {
            pc.setRemoteDescription(new RTCSessionDescription(message));
        }
    });

    socket.on('candidate', function(message) {
        if (isStarted) {
            var candidate = new RTCIceCandidate({
                sdpMLineIndex: message.label,
                candidate: message.candidate
            });
            pc.addIceCandidate(candidate);
        }
    });

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

////////////////////////////////////////////////

function sendMessage(message) {
    console.log('Client sending message: ', message);
    socket.emit('message', message);
}


if (location.hostname !== 'localhost') {
    requestTurn(
        //'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
        'https://umsproj.doms.net:8443/turn?username=41784574&key=4080218913'
    );
}

function maybeStart() {
    console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
    if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
        console.log('>>>>>> creating peer connection');
        createPeerConnection();
        pc.addStream(localStream);
        isStarted = true;
        console.log('isInitiator', isInitiator);
        if (isInitiator) {
            doCall();
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
window.onbeforeunload = function() {
    if (socket) {
        socket.emit('bye', room);
    }
};

/////////////////////////////////////////////////////////

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
        /*sendMessage({
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
        });*/
    } else {
        console.log('End of candidates.');
    }
}

function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
    remoteStream = event.stream;
}

function handleCreateOfferError(event) {
    console.log('createOffer() error: ', event);
}

function doCall() {
    console.log('Sending offer to peer');
    pc.createOffer(setLocalAndSendOffer, handleCreateOfferError);
}

function doAnswer() {
    console.log('Sending answer to peer.');
    pc.createAnswer().then(
        setLocalAndSendAnswer,
        onCreateSessionDescriptionError
    );
}

function setLocalAndSendOffer(sessionDescription) {
    // Set Opus as the preferred codec in SDP if Opus is present.
    //  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
    pc.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    socket.emit('offer', [sessionDescription, room]);
    //sendMessage(sessionDescription);
}

function setLocalAndSendAnswer(sessionDescription) {
    // Set Opus as the preferred codec in SDP if Opus is present.
    //  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
    pc.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    socket.emit('answer', [sessionDescription, room]);
    //sendMessage(sessionDescription);
}

function onCreateSessionDescriptionError(error) {
    console.log('Failed to create session description: ' + error.toString());
}

function requestTurn(turnURL) {
    var turnExists = false;
    for (var i in pcConfig.iceServers) {
        if (pcConfig.iceServers[i].url.substr(0, 5) === 'turn:') {
            turnExists = true;
            turnReady = true;
            break;
        }
    }
}

function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
    remoteStream = event.stream;
}

function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
}

function hangup() {
    console.log('Hanging up.');
    stop();
    sendMessage('bye');
}

function handleRemoteHangup() {
    console.log('Session terminated.');
    stop();
    isInitiator = false;
}

function stop() {
    isStarted = false;
    // isAudioMuted = false;
    // isVideoMuted = false;
    pc.close();
    pc = null;
}

///////////////////////////////////////////

// Set Opus as the default audio codec if it's present.
function preferOpus(sdp) {
    var sdpLines = sdp.split('\r\n');
    var mLineIndex;
    // Search for m line.
    for (var i = 0; i < sdpLines.length; i++) {
        if (sdpLines[i].search('m=audio') !== -1) {
            mLineIndex = i;
            break;
        }
    }
    if (mLineIndex === null) {
        return sdp;
    }

    // If Opus is available, set it as the default in m line.
    for (i = 0; i < sdpLines.length; i++) {
        if (sdpLines[i].search('opus/48000') !== -1) {
            var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
            if (opusPayload) {
                sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex],
                    opusPayload);
            }
            break;
        }
    }

    // Remove CN in m line and sdp.
    sdpLines = removeCN(sdpLines, mLineIndex);

    sdp = sdpLines.join('\r\n');
    return sdp;
}

function extractSdp(sdpLine, pattern) {
    var result = sdpLine.match(pattern);
    return result && result.length === 2 ? result[1] : null;
}

// Set the selected codec to the first in m line.
function setDefaultCodec(mLine, payload) {
    var elements = mLine.split(' ');
    var newLine = [];
    var index = 0;
    for (var i = 0; i < elements.length; i++) {
        if (index === 3) { // Format of media starts from the fourth.
            newLine[index++] = payload; // Put target payload to the first.
        }
        if (elements[i] !== payload) {
            newLine[index++] = elements[i];
        }
    }
    return newLine.join(' ');
}

// Strip CN from sdp before CN constraints is ready.
function removeCN(sdpLines, mLineIndex) {
    var mLineElements = sdpLines[mLineIndex].split(' ');
    // Scan from end for the convenience of removing an item.
    for (var i = sdpLines.length - 1; i >= 0; i--) {
        var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
        if (payload) {
            var cnPos = mLineElements.indexOf(payload);
            if (cnPos !== -1) {
                // Remove CN payload from m line.
                mLineElements.splice(cnPos, 1);
            }
            // Remove CN line in sdp
            sdpLines.splice(i, 1);
        }
    }

    sdpLines[mLineIndex] = mLineElements.join(' ');
    return sdpLines;
}
