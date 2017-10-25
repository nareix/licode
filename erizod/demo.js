console.log('started');
var socket = new WebSocket('ws://localhost:8081');

let main = (conn) => {
    let config = {
        iceServers: [{"urls":"stun:webrtc.qiniuapi.com:3478"},{"urls":"turn:webrtc.qiniuapi.com:3478","username":"ninefingers","credential":"youhavetoberealistic"}],
        iceTransportPolicy: 'all',
        rtcpMuxPolicy: 'require',
        iceCandidatePoolSize: 0,
    };
    let pcConstraints = {};

    let pc = new RTCPeerConnection(config, pcConstraints);

    conn.onmessage = (j) => {
        switch (j.type) {
        case 'candidate':
            pc.addIceCandidate(j.candidate);
            break;
        case 'sdp':
            pc.setRemoteDescription({type: 'answer', sdp: j.sdp});
            break;
        }
    };

    pc.onicecandidate = (e) => {
        console.log('onicecandidate', e, e.candidate);
        if (e.candidate == null) {
            return;
        }
        conn.sendmessage({
            candidate: {
                sdpMid: e.candidate.sdpMid, sdpMLineIndex: e.candidate.sdpMLineIndex, candidate: e.candidate.candidate
            },
            type: 'candidate',
        });
    };

    pc.onicegatheringstatechange = (e) => {
        console.log('onicegatheringstatechange', e);
    };

    pc.oniceconnectionstatechange = (e) => {
        console.log('oniceconnectionstatechange', e);
    };

    navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
    }).then((stream) => {
        pc.addStream(stream);
        return pc.createOffer({ offerToReceiveAudio: 0, offerToReceiveVideo: 0 });
    }).then((desc) => {
        offerdesc = desc;
        conn.sendmessage(desc);
        return pc.setLocalDescription(desc);
    }).then((e) => {
        console.log('done', e);
    });
};

socket.addEventListener('open', function (event) {
    let conn = {};

    conn.sendmessage = (j) => {
        console.log('send', j);
        let s = JSON.stringify(j);
        socket.send(s);
    };

    socket.addEventListener('message', function (event) {
        console.log('Message from server', event.data);
        conn.onmessage(JSON.parse(event.data));
    });

    main(conn);
});

