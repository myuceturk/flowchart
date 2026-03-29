'use strict';

const { WebSocketServer, WebSocket } = require('ws');
const { verifyToken } = require('./auth');
const db = require('./db');

// rooms: Map<diagramId, Map<WebSocket, { userId, userName, color }>>
const rooms = new Map();

const PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#6366f1', '#ec4899', '#8b5cf6',
];

function colorFor(userId) {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h << 5) - h + userId.charCodeAt(i);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function broadcast(diagramId, msg, exclude) {
  const room = rooms.get(diagramId);
  if (!room) return;
  const data = JSON.stringify(msg);
  for (const [ws] of room) {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) ws.send(data);
  }
}

function leaveRoom(ws, diagramId, userId, userName) {
  if (!diagramId) return;
  const room = rooms.get(diagramId);
  if (room) {
    room.delete(ws);
    if (room.size === 0) rooms.delete(diagramId);
  }
  broadcast(diagramId, { type: 'user_left', userId, userName }, ws);
}

function setup(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Authenticate via token in query string: /ws?token=<jwt>
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    const user = db.getUserById(payload.sub);
    if (!user) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    const userId = user.id;
    const userName = user.email;
    const color = colorFor(userId);
    let currentDiagramId = null;

    ws.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      const { type, ...rest } = msg;

      switch (type) {
        case 'join_room': {
          const { diagramId } = rest;
          if (!diagramId) return;

          // Leave current room if already in one
          if (currentDiagramId) {
            leaveRoom(ws, currentDiagramId, userId, userName);
          }

          currentDiagramId = diagramId;
          if (!rooms.has(diagramId)) rooms.set(diagramId, new Map());
          rooms.get(diagramId).set(ws, { userId, userName, color });

          // Send current room members to the new joiner
          const members = [];
          for (const [, info] of rooms.get(diagramId)) {
            if (info.userId !== userId) members.push(info);
          }
          ws.send(JSON.stringify({ type: 'room_state', members }));

          broadcast(diagramId, { type: 'user_joined', userId, userName, color }, ws);
          break;
        }

        case 'node_moved':
        case 'node_updated':
        case 'edge_created':
        case 'edge_deleted':
        case 'cursor_moved': {
          if (!currentDiagramId) return;
          broadcast(currentDiagramId, { type, userId, ...rest }, ws);
          break;
        }

        default:
          break;
      }
    });

    ws.on('close', () => {
      leaveRoom(ws, currentDiagramId, userId, userName);
    });

    ws.on('error', (err) => {
      console.error('[WS] socket error:', err.message);
    });
  });

  console.log('[WS] WebSocket server attached to /ws');
  return wss;
}

module.exports = { setup };
