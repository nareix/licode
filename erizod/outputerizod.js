const addon = require('./lib/addon.node');

class Logger {
    constructor(name) {
        this.c = new addon.CxxLogger(name);
    }
    info(...args) {
        let args_ = args.map(x => {
            if (x == null)
                return 'null';
            if (typeof (x) == 'object')
                return JSON.stringify(x);
            return x;
        });
        this.c.info(args_.join(' '));
    }
}

let log = new Logger('erizod');
exports.log = log;

let threadPool = new addon.ThreadPool(24);
threadPool.start();

let ioThreadPool = new addon.IOThreadPool(1);
// ioThreadPool.start();

let mediaConfig = {};

mediaConfig.extMappings = [
    "urn:ietf:params:rtp-hdrext:ssrc-audio-level",
    "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",
    "urn:ietf:params:rtp-hdrext:toffset",
    "urn:3gpp:video-orientation",
    // "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",
    "http://www.webrtc.org/experiments/rtp-hdrext/playout-delay",
    "urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id"
];
mediaConfig.rtpMappings = {};
mediaConfig.rtpMappings.vp8 = {
    payloadType: 100,
    encodingName: 'VP8',
    clockRate: 90000,
    channels: 1,
    mediaType: 'video',
    feedbackTypes: [
        'ccm fir',
        'nack',
        'nack pli',
        'goog-remb',
        //        'transport-cc',
    ],
};
mediaConfig.rtpMappings.pcmu = {
    payloadType: 0,
    encodingName: 'PCMU',
    clockRate: 8000,
    channels: 1,
    mediaType: 'audio',
};
mediaConfig.rtpMappings.telephoneevent = {
    payloadType: 126,
    encodingName: 'telephone-event',
    clockRate: 8000,
    channels: 1,
    mediaType: 'audio',
};

let stunserver = 'webrtc.qiniuapi.com';
let stunport = 3478;
let minport = 10000;
let maxport = 20000;

var
    CONN_INITIAL = 101,
    CONN_STARTED = 102,
    CONN_GATHERED = 103,
    CONN_READY = 104,
    CONN_FINISHED = 105,
    CONN_CANDIDATE = 201,
    CONN_SDP = 202,
    CONN_FAILED = 500,
    WARN_NOT_FOUND = 404,
    WARN_CONFLICT = 409,
    WARN_PRECOND_FAILED = 412,
    WARN_BAD_CONNECTION = 502;


var muxer = null;
var url = '/tmp/record.mkv';
var externalOutput = null;
exports.publish = () => {
    // let pcid = 'newconn' + Date.now();
    let pcid = '123';
    let conn = {};
    let pc = new addon.WebRtcConnection(threadPool, ioThreadPool, pcid,
        stunserver,
        stunport,
        minport,
        maxport,
        true, //trickle
        JSON.stringify(mediaConfig),
        false, //useNicer,
        '', //turnserver
        0, //turnport
        '', //turnusername,
        '', //turnpass,
        '' //networkinterface
    );
    muxer = new addon.OneToManyProcessor();
    pc.setAudioReceiver(muxer);
    pc.setVideoReceiver(muxer);
    muxer.setPublisher(pc);

    let onevent = (e, msg) => {
        log.info('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', e);
        switch (e) {
            case CONN_CANDIDATE:
                let j = JSON.parse(msg);
                j.candidate = j.candidate.substr(2);
                conn.sendCandidate(j);
                break;
            case CONN_READY:
                conn.sendPublishOK();
                break
        }
    };

    if (!pc.init(onevent)) {
        log.info('initFailed');
    }

    conn.addCandidate = (e) => {
        pc.addRemoteCandidate(e.sdpMid, e.sdpMLineIndex, 'a=' + e.candidate);
    };

    conn.setSdp = (e) => {
        pc.setRemoteSdp(e);
        conn.sendSDP(pc.getLocalSdp())
    };

    conn.startrecord = (e) => {
        externalOutput = new addon.ExternalOutput(url, JSON.stringify(mediaConfig));
        externalOutput.init();
        muxer.addExternalOutput(externalOutput, url);
    }

    conn.stoprecord = (e) => {
        muxer.removeSubscriber(url);
        externalOutput.close();
    }
    return conn;
};


exports.subscribe = () => {
    let conn = {};
    let pc = new addon.WebRtcConnection(threadPool, ioThreadPool, '456',
        stunserver,
        stunport,
        minport,
        maxport,
        true, //trickle
        JSON.stringify(mediaConfig),
        false, //useNicer,
        '', //turnserver
        0, //turnport
        '', //turnusername,
        '', //turnpass,
        '' //networkinterface
    );
    muxer.addSubscriber(pc, '456');

    let onevent = (e, msg) => {
        log.info('yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy', e);
        switch (e) {
            case CONN_CANDIDATE:
                let j = JSON.parse(msg);
                j.candidate = j.candidate.substr(2);
                conn.sendCandidate(j);
                break;
            case CONN_READY:
                conn.sendSubscribeOK();
                break
        }
    };

    if (!pc.init(onevent)) {
        log.info('initFailed');
    }

    conn.addCandidate = (e) => {
        pc.addRemoteCandidate(e.sdpMid, e.sdpMLineIndex, 'a=' + e.candidate);
    };

    conn.setSdp = (e) => {
        pc.setRemoteSdp(e);
        conn.sendSDP(pc.getLocalSdp())
    };

    return conn;
};