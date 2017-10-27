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
let conns = {};
let muxers = {};

wss.on('connection', function connection(ws, req) {
  let sendmessage = (j) => {
    ws.send(JSON.stringify(j));
  };
  let onmessage = (data) => {

    if (data.option == 'publish' && data.type == 'sdp') {
      if (conns[data.id] == null) {
        var conn = erizod.publish(data.id);
        conns[data.id] = conn;
        muxers[data.id] = conn.muxer;
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
          var ids = [];
          for (var id in muxers) {
            ids.push(id);
          }
          sendmessage({
            option: 'publishok',
            ids: ids,
          });
        };
        conn.setSdp(data.sdp);
      }
    }

    if (data.option == 'publish' && data.type == 'candidate') {
      conns[data.id].addCandidate(data.candidate);
    }

    if (data.option == 'subscribe' && data.type == 'sdp') {
      if (conns[data.id] == null) {
        conn = erizod.subscribe(data.id, muxers[data.from]);
        conns[data.id] = conn;
        conn.sendCandidate = (e) => {
          sendmessage({
            option: 'subscribe',
            type: 'candidate',
            candidate: e,
            id: data.id,
          });
        };
        conn.sendSDP = (e) => {
          sendmessage({
            option: 'subscribe',
            type: 'sdp',
            sdp: e,
            id: data.id,
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
      conns[data.id].addCandidate(data.candidate);
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