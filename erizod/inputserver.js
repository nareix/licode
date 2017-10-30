const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const erizod = require('./inputerizod');
let log = erizod.log;

const app = express();

app.use(express.static('.'))

const server = http.createServer(app);
const wss = new WebSocket.Server({
  server
});

var conn = null;

erizod.publish()

wss.on('connection', function connection(ws, req) {
  let sendmessage = (j) => {
    ws.send(JSON.stringify(j));
  };


  let onmessage = (data) => {

    if (data.option == 'subscribe' && data.type == 'sdp') {
      if (conn == null) {
        conn = erizod.subscribe();
        conn.sendCandidate = (e) => {
          sendmessage({
            option: 'subscribe',
            type: 'candidate',
            candidate: e,
          });
        };
        conn.sendSDP = (e) => {
          sendmessage({
            option: 'subscribe',
            type: 'sdp',
            sdp: e,
          });
        };
        conn.sendSubscribeOK = () => {
          sendmessage({
            option: 'subscribeok'
          });
        };
        conn.setSdp(data.sdp);
      }
    }
    if (data.option == 'subscribe' && data.type == 'candidate') {
      conn.addCandidate(data.candidate);
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