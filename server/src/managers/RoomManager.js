class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  addClient(roomId, ws) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(ws);
  }

  removeClient(roomId, ws) {
    const clients = this.rooms.get(roomId);
    if (clients) {
      clients.delete(ws);
      if (clients.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  broadcast(roomId, message, senderWs) {
    const clients = this.rooms.get(roomId);
    if (!clients) return;

    clients.forEach((client) => {
      if (client !== senderWs && client.readyState === client.OPEN) {
        client.send(message);
      }
    });
  }
}

module.exports = new RoomManager();