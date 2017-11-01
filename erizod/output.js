'use strict';

var ws = null;
var localStream = null;
var localPC = null;

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

function createLocalPC(stream) {
    var date = new Date();
    var id = String(date.getTime());
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
                id: id,
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
                option: 'publish',
                id: id,
            });
        },
        function (error) {
            console.log('Failed to create session description:', error);
        }
    );
}

document.getElementById("startrecord").onclick = function(e){
    console.log('startrecord')
    ws.sendmsg({
        option: 'startrecord',
    });
};
document.getElementById("stoprecord").onclick = function(e){
    console.log('stoprecord')
    ws.sendmsg({
        option: 'stoprecord',
    });
};

connect('ws://localhost:8081');