'use strict';

var ws = null;
var localStream = null;
var localPC = null;
var remoteStream = null;
var remotePC = null;
var remoteStreams = {};
var remotePCs = {};

function connect(url) {
    ws = new WebSocket(url);

    ws.onopen = function (evt) {
        console.log('Connection open ...');
        publish();
    };

    ws.onmessage = function (evt) {
        console.log('Received Message:', evt.data);
        var data = JSON.parse(evt.data);

        if (data.option == 'publish' && data.type == 'sdp') {
            localPC.setRemoteDescription({
                type: 'answer',
                sdp: data.sdp
            });
        }

        if (data.option == 'publish' && data.type == 'candidate') {
            localPC.addIceCandidate(data.candidate);
        }

        if (data.option == 'subscribe' && data.type == 'sdp') {
            remotePC.setRemoteDescription({
                type: 'answer',
                sdp: data.sdp
            });
        }

        if (data.option == 'subscribe' && data.type == 'candidate') {
            remotePC.addIceCandidate(data.candidate);
        }

        if (data.option == 'publishok') {
            subscribe();
        }

        if (data.option == 'subscribeok') {}
    };

    ws.onclose = function (evt) {
        console.log('Connection closed.');
    };

    ws.sendmsg = function (data) {
        var dataStr = JSON.stringify(data);
        console.log('Send Message:', dataStr);
        ws.send(dataStr);
    }
}

function publish() {
    console.log('Requesting local stream');
    navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        })
        .then(function (stream) {
            localStream = stream;
            document.getElementById('localVideo').srcObject = stream;
            console.log('Received local stream:', stream);

            createLocalPC(stream);
        })
        .catch(function (error) {
            console.log('getUserMedia() error:', error);
        });
}

function unsubscribe() {

}

function subscribe() {
    createRemotePC();
}

function unpublish() {

}

function createLocalPC(stream) {
    var servers = {
        iceServers: [{
            "urls": "stun:webrtc.qiniuapi.com:3478"
        }],
    };
    var pc = new RTCPeerConnection(servers);
    console.log('created local peer connection object');

    localPC = pc;
    pc.onicecandidate = function (event) {
        if (event.candidate) {
            ws.sendmsg({
                candidate: event.candidate,
                type: 'candidate',
                option: 'publish',
            });
        }
    };

    stream.getTracks().forEach(
        function (track) {
            pc.addTrack(
                track,
                stream
            );
        }
    );
    console.log('Adding local stream to localPC');

    pc.createOffer({
        offerToReceiveAudio: 0,
        offerToReceiveVideo: 0
    }).then(
        function (desc) {
            pc.setLocalDescription(desc);
            ws.sendmsg({
                sdp: desc.sdp,
                type: 'sdp',
                option: 'publish'
            });
        },
        function (error) {
            console.log('Failed to create session description:', error);
        }
    );
}

function createRemotePC() {
    var servers = {
        iceServers: [{
            "urls": "stun:webrtc.qiniuapi.com:3478"
        }],
    };
    var pc = new RTCPeerConnection(servers);
    console.log('created remote peer connection object');

    remotePC = pc;
    pc.onicecandidate = function (event) {
        if (event.candidate) {
            ws.sendmsg({
                candidate: event.candidate,
                type: 'candidate',
                option: 'subscribe'
            });
        }
    };

    pc.ontrack = function (e) {
        document.getElementById('remoteVideo').srcObject = e.streams[0];
        remoteStream = e.streams[0]
        console.log('received remote stream');
    }

    pc.createOffer({
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
    }).then(
        function (desc) {
            pc.setLocalDescription(desc);
            ws.sendmsg({
                sdp: desc.sdp,
                type: 'sdp',
                option: 'subscribe'
            });
        },
        function (error) {
            console.log('Failed to create session description:', error);
        }
    );
}

connect('ws://localhost:8082');