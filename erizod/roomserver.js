const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const erizod = require('./roomerizod');
let log = erizod.log;

const app = express();

app.use(express.static('.'))

const server = http.createServer(app);
const wss = new WebSocket.Server({
  server
});
let conn = null;
let conn1 = null;

wss.on('connection', function connection(ws, req) {
  let sendmessage = (j) => {
    ws.send(JSON.stringify(j));
  };
  let onmessage = (data) => {

    if (data.option == 'publish' && data.type == 'sdp') {
      if (conn == null) {
        conn = erizod.publish();
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
        conn.setSdp(data.sdp);
      }
    }

    if (data.option == 'publish' && data.type == 'candidate') {
      conn.addCandidate(data.candidate);
    }

    if (data.option == 'subscribe' && data.type == 'sdp') {
      if (conn1 == null) {
        conn1 = erizod.subscribe();
        conn1.sendCandidate = (e) => {
          sendmessage({
            option: 'subscribe',
            type: 'candidate',
            candidate: e
          });
        };
        conn1.sendSDP = (e) => {
          sendmessage({
            option: 'subscribe',
            type: 'sdp',
            sdp: e
          });
        };
        conn1.sendSubscribeOK = () => {
          sendmessage({
            option: 'subscribeok'
          });
        };
        conn1.setSdp(data.sdp);
      }
    }

    if (data.option == 'subscribe' && data.type == 'candidate') {
      conn1.addCandidate(data.candidate);
    }
  };
  ws.on('message', function (message) {
    let j = JSON.parse(message);
    log.info('received', message);
    onmessage(j);
  });
});

server.listen(8082, function listening() {
  log.info('listening', server.address().port);
});