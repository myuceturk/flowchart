import { v4 as uuidv4 } from 'uuid';
import type { Node } from 'reactflow';
import { clearAutosavedDiagram } from '../app/services/diagramPersistence';
import type { AlignmentDirection, AppState, ClipboardPayload } from '../types';
import type { AppNodeType, NodeData } from '../nodes/types';
import type { EdgeStylePartial } from '../edges/types';
import useDiagramStore from '../store/useDiagramStore';
import useHistoryStore from '../store/useHistoryStore';
import useUIStore from '../store/useUIStore';
import {
  DUPLICATE_OFFSET,
  cloneEdge,
  cloneNode,
} from '../store/store.utils';

type PastePosition = { x: number; y: number };

export type DiagramCommands = {
  deleteSelection: () => void;
  duplicateSelection: () => void;
  pasteClipboard: (position?: PastePosition) => void;
  copySelection: () => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  beginNodeResize: () => void;
  undoCommand: () => void;
  redoCommand: () => void;
  clearCanvasCommand: () => void;
  addNode: (node: Node<NodeData>) => void;
  updateNodeType: (nodeId: string, type: AppNodeType) => void;
  updateNodeColor: (nodeId: string, color: string | null) => void;
  updateEdgeData: (edgeId: string, label: string) => void;
  updateEdgeStyle: (edgeId: string, style: EdgeStylePartial) => void;
  toggleNodeLock: (nodeId: string) => void;
  alignNodes: (nodeIds: string[], direction: AlignmentDirection) => void;
};

function buildClipboard(
  nodes: AppState['nodes'],
  edges: AppState['edges'],
  selectedNodeIds: string[],
): ClipboardPayload | null {
  if (selectedNodeIds.length === 0) {
    return null;
  }

  const selectedSet = new Set(selectedNodeIds);
  const copiedNodes = nodes.filter((node) => selectedSet.has(node.id)).map(cloneNode);
  const copiedEdges = edges
    .filter((edge) => selectedSet.has(edge.source) && selectedSet.has(edge.target))
    .map(cloneEdge);

  return {
    nodes: copiedNodes,
    edges: copiedEdges,
  };
}

function createDiagramCommands(): DiagramCommands {
  return {
    deleteSelection: () => {
      const uiStore = useUIStore.getState();
      const diagramStore = useDiagramStore.getState();
      const { selectedNodeIds, selectedEdgeIds } = uiStore;

      // Skip locked nodes — they are protected from deletion
      const nodesMap = new Map(diagramStore.nodes.map((n) => [n.id, n]));
      const deletableNodeIds = selectedNodeIds.filter((id) => !nodesMap.get(id)?.data?.locked);

      if (deletableNodeIds.length === 0 && selectedEdgeIds.length === 0) {
        return;
      }

      useHistoryStore.getState().pushSnapshot(diagramStore.createSnapshot());
      diagramStore.deleteNodesAndEdges(deletableNodeIds, selectedEdgeIds);
      uiStore.clearSelection();
    },

    duplicateSelection: () => {
      const uiStore = useUIStore.getState();
      const diagramStore = useDiagramStore.getState();
      const { selectedNodeIds } = uiStore;

      if (selectedNodeIds.length === 0) {
        return;
      }

      useHistoryStore.getState().pushSnapshot(diagramStore.createSnapshot());
      const { newNodeIds } = diagramStore.duplicateNodesAndEdges(selectedNodeIds);
      useUIStore.setState({
        selectedNodeIds: newNodeIds,
        selectedEdgeIds: [],
      });
    },

    pasteClipboard: (position) => {
      const uiStore = useUIStore.getState();
      const diagramStore = useDiagramStore.getState();
      const { clipboard } = uiStore;
      const { nodes, edges } = diagramStore;

      if (!clipboard || clipboard.nodes.length === 0) {
        return;
      }

      const referenceX = Math.min(...clipboard.nodes.map((node) => node.position.x));
      const referenceY = Math.min(...clipboard.nodes.map((node) => node.position.y));
      const offsetX = position ? position.x - referenceX : DUPLICATE_OFFSET;
      const offsetY = position ? position.y - referenceY : DUPLICATE_OFFSET;
      const idMap = new Map<string, string>();

      const pastedNodes = clipboard.nodes.map((node) => {
        const id = uuidv4();
        idMap.set(node.id, id);

        return {
          ...cloneNode(node),
          id,
          position: {
            x: node.position.x + offsetX,
            y: node.position.y + offsetY,
          },
          selected: true,
        };
      });

      const pastedEdges = clipboard.edges.map((edge) => ({
        ...cloneEdge(edge),
        id: uuidv4(),
        source: idMap.get(edge.source) ?? edge.source,
        target: idMap.get(edge.target) ?? edge.target,
        selected: false,
      }));

      useHistoryStore.getState().pushSnapshot(diagramStore.createSnapshot());
      useDiagramStore.setState({
        nodes: [...nodes.map((node) => (node.selected ? { ...node, selected: false } : node)), ...pastedNodes],
        edges: [...edges.map((edge) => (edge.selected ? { ...edge, selected: false } : edge)), ...pastedEdges],
      });
      useUIStore.setState({
        selectedNodeIds: pastedNodes.map((node) => node.id),
        selectedEdgeIds: [],
      });
    },

    copySelection: () => {
      const { selectedNodeIds } = useUIStore.getState();
      const { nodes, edges } = useDiagramStore.getState();

      useUIStore
        .getState()
        .setClipboard(buildClipboard(nodes as AppState['nodes'], edges, selectedNodeIds));
    },

    updateNodeData: (nodeId, data) => {
      const diagramStore = useDiagramStore.getState();
      useHistoryStore.getState().pushSnapshot(diagramStore.createSnapshot());
      diagramStore.updateNode(nodeId, data);
    },

    beginNodeResize: () => {
      const diagramStore = useDiagramStore.getState();
      useHistoryStore.getState().pushSnapshot(diagramStore.createSnapshot());
    },

    undoCommand: () => {
      const diagramStore = useDiagramStore.getState();
      const currentSnapshot = diagramStore.createSnapshot();
      const previousSnapshot = useHistoryStore.getState().undo(currentSnapshot);

      if (!previousSnapshot) {
        return;
      }

      diagramStore.replaceFromSnapshot(previousSnapshot);
      useUIStore.getState().clearSelection();
    },

    redoCommand: () => {
      const diagramStore = useDiagramStore.getState();
      const currentSnapshot = diagramStore.createSnapshot();
      const nextSnapshot = useHistoryStore.getState().redo(currentSnapshot);

      if (!nextSnapshot) {
        return;
      }

      diagramStore.replaceFromSnapshot(nextSnapshot);
      useUIStore.getState().clearSelection();
    },

    clearCanvasCommand: () => {
      const diagramStore = useDiagramStore.getState();
      const uiStore = useUIStore.getState();
      const { nodes, edges } = diagramStore;

      if (nodes.length === 0 && edges.length === 0) {
        uiStore.closeContextMenu();
        useUIStore.setState({ clipboard: null });
        clearAutosavedDiagram();
        return;
      }

      useHistoryStore.getState().pushSnapshot(diagramStore.createSnapshot());
      diagramStore.clearDiagram();
      useUIStore.setState({
        selectedNodeIds: [],
        selectedEdgeIds: [],
        clipboard: null,
        contextMenu: { open: false },
      });
      clearAutosavedDiagram();
    },

    addNode: (node) => {
      useHistoryStore.getState().pushSnapshot(useDiagramStore.getState().createSnapshot());
      useDiagramStore.getState().addNode(node);
    },

    updateNodeType: (nodeId, type) => {
      useHistoryStore.getState().pushSnapshot(useDiagramStore.getState().createSnapshot());
      useDiagramStore.getState().updateNodeType(nodeId, type);
    },

    updateNodeColor: (nodeId, color) => {
      useHistoryStore.getState().pushSnapshot(useDiagramStore.getState().createSnapshot());
      useDiagramStore.getState().updateNodeColor(nodeId, color);
    },

    updateEdgeData: (edgeId, label) => {
      useHistoryStore.getState().pushSnapshot(useDiagramStore.getState().createSnapshot());
      useDiagramStore.getState().updateEdgeData(edgeId, label);
    },

    updateEdgeStyle: (edgeId, style) => {
      useHistoryStore.getState().pushSnapshot(useDiagramStore.getState().createSnapshot());
      useDiagramStore.getState().updateEdgeStyle(edgeId, style);
    },

    toggleNodeLock: (nodeId) => {
      useHistoryStore.getState().pushSnapshot(useDiagramStore.getState().createSnapshot());
      useDiagramStore.getState().toggleNodeLock(nodeId);
    },

    alignNodes: (nodeIds, direction) => {
      // Skip locked nodes from alignment
      const nodesMap = new Map(useDiagramStore.getState().nodes.map((n) => [n.id, n]));
      const unlocked = nodeIds.filter((id) => !nodesMap.get(id)?.data?.locked);

      if (unlocked.length < 2) {
        return;
      }

      useHistoryStore.getState().pushSnapshot(useDiagramStore.getState().createSnapshot());
      useDiagramStore.getState().alignNodes(unlocked, direction);
    },
  };
}

const diagramCommands = createDiagramCommands();

export function useDiagramCommands() {
  return diagramCommands;
}

export function getDiagramCommands() {
  return diagramCommands;
}
