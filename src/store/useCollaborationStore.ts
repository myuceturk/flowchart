import { create } from 'zustand';
import { addEdge as reactFlowAddEdge } from 'reactflow';
import type { Edge } from 'reactflow';
import type { NodeData } from '../nodes/types';
import useDiagramStore from './useDiagramStore';
import * as collaborationService from '../app/services/collaborationService';
import type { CollabMessage } from '../app/services/collaborationService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CollaboratingUser {
  /** Server-assigned user id */
  id: string;
  /** Display name (email) */
  name: string;
  /** Deterministic color assigned by the server */
  color: string;
  /** Last known cursor position in flow coordinates */
  cursor?: { x: number; y: number };
}

interface CollaborationState {
  activeUsers: CollaboratingUser[];
  isConnected: boolean;
}

interface CollaborationActions {
  connect: (diagramId: string, userId: string, userName: string, token: string) => void;
  disconnect: () => void;
  sendNodeMoved: (nodeId: string, position: { x: number; y: number }) => void;
  sendNodeUpdated: (nodeId: string, data: Partial<NodeData>) => void;
  sendEdgeCreated: (edge: Edge) => void;
  sendEdgeDeleted: (edgeId: string) => void;
  sendCursorMoved: (x: number, y: number) => void;
}

export type CollaborationStore = CollaborationState & CollaborationActions;

// ─── Message handler (defined outside create to avoid stale closures) ─────────

function handleMessage(set: (fn: (s: CollaborationState) => Partial<CollaborationState>) => void) {
  return (msg: CollabMessage) => {
    switch (msg.type) {
      case 'room_state': {
        const members = (msg.members as CollaboratingUser[] | undefined) ?? [];
        set(() => ({ activeUsers: members }));
        break;
      }

      case 'user_joined': {
        const { userId: id, userName: name, color } = msg as {
          userId: string; userName: string; color: string;
        };
        set((state) => ({
          activeUsers: [
            ...state.activeUsers.filter((u) => u.id !== id),
            { id, name, color },
          ],
        }));
        break;
      }

      case 'user_left': {
        const { userId: id } = msg as { userId: string };
        set((state) => ({
          activeUsers: state.activeUsers.filter((u) => u.id !== id),
        }));
        break;
      }

      case 'cursor_moved': {
        const { userId: id, x, y } = msg as { userId: string; x: number; y: number };
        set((state) => ({
          activeUsers: state.activeUsers.map((u) =>
            u.id === id ? { ...u, cursor: { x, y } } : u,
          ),
        }));
        break;
      }

      // Apply remote structural changes directly via setState to bypass store
      // methods (which broadcast) and avoid feedback loops.

      case 'node_moved': {
        const { nodeId, position } = msg as {
          nodeId: string; position: { x: number; y: number };
        };
        useDiagramStore.setState((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId ? { ...n, position } : n,
          ),
        }));
        break;
      }

      case 'node_updated': {
        const { nodeId, data } = msg as { nodeId: string; data: Partial<NodeData> };
        useDiagramStore.setState((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n,
          ),
        }));
        break;
      }

      case 'edge_created': {
        const { edge } = msg as { edge: Edge };
        useDiagramStore.setState((state) => ({
          edges: reactFlowAddEdge(edge, state.edges),
        }));
        break;
      }

      case 'edge_deleted': {
        const { edgeId } = msg as { edgeId: string };
        useDiagramStore.setState((state) => ({
          edges: state.edges.filter((e) => e.id !== edgeId),
        }));
        break;
      }

      default:
        break;
    }
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

const useCollaborationStore = create<CollaborationStore>()((set) => {
  // Register the message handler once at store creation time.
  collaborationService.setMessageHandler(handleMessage(set));

  return {
    activeUsers: [],
    isConnected: false,

    connect(diagramId, userId, userName, token) {
      collaborationService.connect(diagramId, userId, userName, token);
      set({ isConnected: true, activeUsers: [] });
    },

    disconnect() {
      collaborationService.disconnect();
      set({ activeUsers: [], isConnected: false });
    },

    sendNodeMoved(nodeId, position) {
      collaborationService.send({ type: 'node_moved', nodeId, position });
    },

    sendNodeUpdated(nodeId, data) {
      collaborationService.send({ type: 'node_updated', nodeId, data: data as Record<string, unknown> });
    },

    sendEdgeCreated(edge) {
      collaborationService.send({ type: 'edge_created', edge: edge as unknown as Record<string, unknown> });
    },

    sendEdgeDeleted(edgeId) {
      collaborationService.send({ type: 'edge_deleted', edgeId });
    },

    sendCursorMoved(x, y) {
      collaborationService.send({ type: 'cursor_moved', x, y });
    },
  };
});

export default useCollaborationStore;
