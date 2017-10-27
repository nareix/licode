const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const erizod = require('./erizod2');
let log = erizod.log;

const app = express();

app.use(express.static('.'))

const server = http.createServer(app);
const wss = new WebSocket.Server({
  server
});
let conn = null;
let conn1 = null;
let conn2 = null;

wss.on('connection', function connection(ws, req) {
  let sendmessage = (j) => {
    ws.send(JSON.stringify(j));
  };
  let onmessage = (j) => {

    switch (j.option) {
      case 'publish':
        switch (j.type) {
          case 'sdp':
            if (conn == null) {
              conn = erizod.publish('123');
              conn.sendCandidate = (e) => {
                sendmessage({
                  option: 'publish',
                  type: 'candidate',
                  candidate: e
                });
              };
              conn.sendSDP = (e) => {
                sendmessage({
                  option: 'publish',
                  type: 'sdp',
                  sdp: e
                });
              };
              conn.sendPublishOK = () => {
                sendmessage({
                  option: 'publishok'
                });
              };
              conn.setSdp(j.sdp);
            }
            break;
          case 'candidate':
            conn.addCandidate(j.candidate);
            break;
        }
        break;
      case 'subscribe':
        switch (j.pc) {
          case 1:
            switch (j.type) {
              case 'sdp':
                if (conn1 == null) {
                  conn1 = erizod.subscribe('456');
                  conn1.sendCandidate = (e) => {
                    sendmessage({
                      option: 'subscribe',
                      type: 'candidate',
                      candidate: e,
                      pc: 1,
                    });
                  };
                  conn1.sendSDP = (e) => {
                    sendmessage({
                      option: 'subscribe',
                      type: 'sdp',
                      sdp: e,
                      pc: 1,
                    });
                  };
                  conn1.sendSubscribeOK = () => {
                    sendmessage({
                      option: 'subscribeok'
                    });
                  };
                  conn1.setSdp(j.sdp);
                }
                break;
              case 'candidate':
                conn1.addCandidate(j.candidate);
                break;
            }
            break;
          case 2:
            switch (j.type) {
              case 'sdp':
                if (conn2 == null) {
                  conn2 = erizod.subscribe('789');
                  conn2.sendCandidate = (e) => {
                    sendmessage({
                      option: 'subscribe',
                      type: 'candidate',
                      candidate: e,
                      pc: 2,
                    });
                  };
                  conn2.sendSDP = (e) => {
                    sendmessage({
                      option: 'subscribe',
                      type: 'sdp',
                      sdp: e,
                      pc: 2,
                    });
                  };
                  conn2.sendSubscribeOK = () => {
                    sendmessage({
                      option: 'subscribeok'
                    });
                  };
                  conn2.setSdp(j.sdp);
                }
                break;
              case 'candidate':
                conn2.addCandidate(j.candidate);
                break;
            }
            break;
        }
        break;
    }

  };
  ws.on('message', function (message) {
    let j = JSON.parse(message);
    log.info('received', message);
    onmessage(j);
  });
});

server.listen(8081, function listening() {
  log.info('listening', server.address().port);
});