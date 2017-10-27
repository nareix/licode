console.log('started');
var socket = new WebSocket('ws://localhost:8081');

var pc = null;
var pc1 = null;
var pc2 = null;

var localstream;

var config = {
    iceServers: [{
        "urls": "stun:webrtc.qiniuapi.com:3478"
    }],
    iceTransportPolicy: 'all',
    rtcpMuxPolicy: 'require',
    iceCandidatePoolSize: 0,
};

var pcConstraints = {};

var main = (conn) => {

    pc = new RTCPeerConnection(config, pcConstraints);

    conn.onmessage = (j) => {
        switch (j.option) {
            case 'publish':
                switch (j.type) {
                    case 'candidate':
                        pc.addIceCandidate(j.candidate);
                        break;
                    case 'sdp':
                        pc.setRemoteDescription({
                            type: 'answer',
                            sdp: j.sdp
                        });
                        break;
                }
                break;
            case 'subscribe':
                switch (j.pc) {
                    case 1:
                        switch (j.type) {
                            case 'candidate':
                                pc1.addIceCandidate(j.candidate);
                                break;
                            case 'sdp':
                                pc1.setRemoteDescription({
                                    type: 'answer',
                                    sdp: j.sdp
                                });
                                break;
                        }
                        break;
                    case 2:
                        switch (j.type) {
                            case 'candidate':
                                pc2.addIceCandidate(j.candidate);
                                break;
                            case 'sdp':
                                pc2.setRemoteDescription({
                                    type: 'answer',
                                    sdp: j.sdp
                                });
                                break;
                        }
                        break;
                }
                break;
            case 'publishok':
                pc1 = new RTCPeerConnection(config, pcConstraints);

                pc1.createOffer({
                    offerToReceiveAudio: 1,
                    offerToReceiveVideo: 1
                }).then((desc) => {
                    offerdesc = desc;
                    conn.sendmessage({
                        sdp: desc.sdp,
                        type: 'sdp',
                        option: 'subscribe',
                        pc: 1,
                    });
                    return pc1.setLocalDescription(desc);
                }).then((e) => {
                    console.log('done', e);
                });

                pc1.onicecandidate = (e) => {
                    console.log('onicecandidate', e, e.candidate);
                    if (e.candidate == null) {
                        return;
                    }
                    conn.sendmessage({
                        candidate: {
                            sdpMid: e.candidate.sdpMid,
                            sdpMLineIndex: e.candidate.sdpMLineIndex,
                            candidate: e.candidate.candidate
                        },
                        type: 'candidate',
                        option: 'subscribe',
                        pc: 1,
                    });
                };

                pc1.onicegatheringstatechange = (e) => {
                    console.log('onicegatheringstatechange', e);
                };

                pc1.oniceconnectionstatechange = (e) => {
                    console.log('oniceconnectionstatechange', e);
                };

                pc1.onaddstream = (e) => {
                    console.log('onaddstream onaddstream onaddstream', e);
                    document.getElementById('my_subscribed_video1').srcObject = e.stream;
                }

                pc2 = new RTCPeerConnection(config, pcConstraints);

                pc2.createOffer({
                    offerToReceiveAudio: 1,
                    offerToReceiveVideo: 1
                }).then((desc) => {
                    offerdesc = desc;
                    conn.sendmessage({
                        sdp: desc.sdp,
                        type: 'sdp',
                        option: 'subscribe',
                        pc: 2,
                    });
                    return pc2.setLocalDescription(desc);
                }).then((e) => {
                    console.log('done', e);
                });

                pc2.onicecandidate = (e) => {
                    console.log('onicecandidate', e, e.candidate);
                    if (e.candidate == null) {
                        return;
                    }
                    conn.sendmessage({
                        candidate: {
                            sdpMid: e.candidate.sdpMid,
                            sdpMLineIndex: e.candidate.sdpMLineIndex,
                            candidate: e.candidate.candidate
                        },
                        type: 'candidate',
                        option: 'subscribe',
                        pc: 2,
                    });
                };

                pc2.onicegatheringstatechange = (e) => {
                    console.log('onicegatheringstatechange', e);
                };

                pc2.oniceconnectionstatechange = (e) => {
                    console.log('oniceconnectionstatechange', e);
                };

                pc2.onaddstream = (e) => {
                    console.log('onaddstream onaddstream onaddstream', e);
                    document.getElementById('my_subscribed_video2').srcObject = e.stream;
                }

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
                sdpMid: e.candidate.sdpMid,
                sdpMLineIndex: e.candidate.sdpMLineIndex,
                candidate: e.candidate.candidate
            },
            type: 'candidate',
            option: 'publish'
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
        localstream = stream;
        document.getElementById('my_local_video').srcObject = stream;
        // pc.addTrack(stream.getAudioTracks()[0], stream);
        // pc.addTrack(stream.getVideoTracks()[0], stream);
        pc.addStream(stream)
        return pc.createOffer({
            offerToReceiveAudio: 0,
            offerToReceiveVideo: 0
        });
    }).then((desc) => {
        offerdesc = desc;
        conn.sendmessage({
            sdp: desc.sdp,
            type: 'sdp',
            option: 'publish'
        });
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