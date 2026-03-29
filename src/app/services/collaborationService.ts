/**
 * Singleton WebSocket client for real-time collaboration.
 *
 * Usage:
 *   import * as collaborationService from './collaborationService';
 *   collaborationService.connect(diagramId, userId, userName, token);
 *   collaborationService.send({ type: 'node_moved', nodeId, position });
 *   collaborationService.disconnect();
 */

const WS_URL = 'ws://localhost:3001/ws';
const MAX_RECONNECT_ATTEMPTS = 3;

export interface CollabMessage {
  type: string;
  userId?: string;
  [key: string]: unknown;
}

type MessageHandler = (msg: CollabMessage) => void;

// ─── Module-level state ───────────────────────────────────────────────────────

let _ws: WebSocket | null = null;
let _diagramId: string | null = null;
let _token: string | null = null;
let _handler: MessageHandler | null = null;
let _reconnectCount = 0;
let _reconnectTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * True while a remote message is being dispatched to the handler.
 * Diagram store methods check this to avoid re-broadcasting remote changes.
 */
export let isApplyingRemote = false;

// ─── Public API ───────────────────────────────────────────────────────────────

export function setMessageHandler(handler: MessageHandler): void {
  _handler = handler;
}

export function connect(
  diagramId: string,
  _userId: string,
  _userName: string,
  token: string,
): void {
  _diagramId = diagramId;
  _token = token;
  _reconnectCount = 0;
  _openSocket();
}

export function disconnect(): void {
  _cancelReconnect();
  _closeSocket(/* preventReconnect */ true);
  _diagramId = null;
  _token = null;
  _reconnectCount = 0;
}

export function send(msg: CollabMessage): void {
  if (_ws?.readyState === WebSocket.OPEN) {
    _ws.send(JSON.stringify(msg));
  }
}

export function isConnected(): boolean {
  return _ws?.readyState === WebSocket.OPEN;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function _openSocket(): void {
  _closeSocket(/* preventReconnect */ false);

  const url = `${WS_URL}?token=${encodeURIComponent(_token!)}`;
  _ws = new WebSocket(url);

  _ws.onopen = () => {
    _reconnectCount = 0;
    // Join the diagram room immediately after connecting
    _ws!.send(JSON.stringify({ type: 'join_room', diagramId: _diagramId }));
  };

  _ws.onmessage = ({ data }) => {
    if (!_handler) return;
    let msg: CollabMessage;
    try {
      msg = JSON.parse(data as string) as CollabMessage;
    } catch {
      return;
    }
    isApplyingRemote = true;
    try {
      _handler(msg);
    } finally {
      isApplyingRemote = false;
    }
  };

  _ws.onclose = () => {
    _ws = null;
    _scheduleReconnect();
  };

  _ws.onerror = () => {
    // onclose fires right after onerror — no separate handling needed
  };
}

function _closeSocket(preventReconnect: boolean): void {
  if (preventReconnect) _cancelReconnect();
  if (_ws) {
    // Detach handlers so onclose doesn't trigger reconnect
    if (preventReconnect) {
      _ws.onopen = null;
      _ws.onmessage = null;
      _ws.onclose = null;
      _ws.onerror = null;
    }
    _ws.close();
    _ws = null;
  }
}

function _scheduleReconnect(): void {
  if (_reconnectCount >= MAX_RECONNECT_ATTEMPTS || !_diagramId) return;
  const delay = Math.pow(2, _reconnectCount) * 1000; // 1s, 2s, 4s
  _reconnectCount++;
  _reconnectTimer = setTimeout(_openSocket, delay);
}

function _cancelReconnect(): void {
  if (_reconnectTimer !== null) {
    clearTimeout(_reconnectTimer);
    _reconnectTimer = null;
  }
}
