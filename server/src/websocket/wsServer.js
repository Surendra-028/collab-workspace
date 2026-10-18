const { WebSocketServer } = require('ws');
const roomManager = require('../managers/RoomManager');

function setupWebSocketServer(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const roomId = urlParams.get('room') || 'default-room';

    roomManager.addClient(roomId, ws);

    ws.on('message', (message) => {
      roomManager.broadcast(roomId, message.toString(), ws);
    });

    ws.on('close', () => {
      roomManager.removeClient(roomId, ws);
    });
  });

  return wss;
}

module.exports = setupWebSocketServer;