const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const erizod = require('./outputerizod');
let log = erizod.log;

const app = express();

app.use(express.static('.'))

const server = http.createServer(app);
const wss = new WebSocket.Server({
  server
});

var conn = null;

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
            option: 'publishok',
          });
        };
        conn.setSdp(data.sdp);
      }
    }

    if (data.option == 'publish' && data.type == 'candidate') {
      conn.addCandidate(data.candidate);
    }

    if (data.option == 'startrecord') {
      conn.startrecord();
    }

    if (data.option == 'stoprecord') {
      conn.stoprecord();
    }
  };

  ws.on('message', function (message) {
    let data = JSON.parse(message);
    log.info('received', message);
    onmessage(data);
  });
});

server.listen(8081, function listening() {
  log.info('listening', server.address().port);
});