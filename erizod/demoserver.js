const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const erizod = require('./erizod');
let log = erizod.log;

const app = express();

app.use(express.static('.'))

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
let conn = null;

wss.on('connection', function connection(ws, req) {
  let sendmessage = (j) => {
    ws.send(JSON.stringify(j));
  };
  let onmessage = (j) => {
    switch (j.type) {
      case 'offer':
        if (conn == null) {
          conn = erizod.request(j);
          conn.sendCandidate = (e) => {
            sendmessage({ type: 'candidate', candidate: e });
          };
          conn.sendSDP = (e) => {
            sendmessage({ type: 'sdp', sdp: e });
          };
        }
        break;
      case 'candidate':
        conn.addCandidate(j.candidate);
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
