'use strict';

var ws = null;
var remotePc = {};
var streams = [];

function connect(url) {
    ws = new WebSocket(url);

    ws.onopen = function (evt) {
        console.log('Connection open ...');
        subscribe();
    };

    ws.onmessage = function (evt) {
        console.log('Received Message:', evt.data);
        var data = JSON.parse(evt.data);

        if (data.option == 'subscribe' && data.type == 'sdp') {
            remotePc.setRemoteDescription({
                type: 'answer',
                sdp: data.sdp
            });
        }

        if (data.option == 'subscribe' && data.type == 'candidate') {
            remotePc.addIceCandidate(data.candidate);
        }
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

function subscribe() {
    createRemotePC();
}

function createRemotePC(from) {
    var servers = {
        iceServers: [{
            "urls": "stun:webrtc.qiniuapi.com:3478"
        }],
    };
    var pc = new RTCPeerConnection(servers);
    console.log('created remote peer connection object');

    remotePc = pc;
    pc.onicecandidate = function (event) {
        if (event.candidate) {
            ws.sendmsg({
                candidate: event.candidate,
                type: 'candidate',
                option: 'subscribe',
            });
        }
    };

    pc.ontrack = function (e) {
        document.getElementById('remoteVideo').srcObject = e.streams[0];
        // streams.push(e.streams)
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
                option: 'subscribe',
            });
        },
        function (error) {
            console.log('Failed to create session description:', error);
        }
    );
}

connect('ws://localhost:8081');