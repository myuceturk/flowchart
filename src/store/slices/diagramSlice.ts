import type { StateCreator } from 'zustand';
import {
  addEdge as reactFlowAddEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from 'reactflow';
import type { Connection, Edge, EdgeChange, Node, NodeChange } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, ClipboardPayload } from '../../types';
import type { NodeData } from '../../nodes/types';
import { getDefaultNodeData } from '../../nodes/nodeRegistry';
import { alignNodes } from '../../utils/alignment';
import { clearAutosavedDiagram } from '../../app/services/diagramPersistence';
import {
  DEFAULT_NODE_SIZE,
  DUPLICATE_OFFSET,
  MAX_HISTORY_ENTRIES,
  cloneEdge,
  cloneNode,
  createNodeDuplicate,
  initialNodes,
} from '../store.utils';

function buildClipboard(
  nodes: Node<NodeData>[],
  edges: Edge[],
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

export const createDiagramSlice: StateCreator<AppState, [], [], Partial<AppState>> = (
  set,
  get,
) => ({
  nodes: initialNodes,
  edges: [],
  selectedNodeIds: [],
  selectedEdgeIds: [],
  diagramId: null,
  past: [],
  future: [],
  clipboardStyle: null,
  clipboard: null,
  isSaving: false,

  copyStyle: () => {
    const { nodes, selectedNodeIds } = get();
    const firstSelected = nodes.find((node) => node.id === selectedNodeIds[0]);

    if (firstSelected?.data?.color !== undefined) {
      set({ clipboardStyle: { color: firstSelected.data.color } });
    }
  },

  pasteStyle: () => {
    const { clipboardStyle, selectedNodeIds, nodes } = get();

    if (!clipboardStyle || selectedNodeIds.length === 0) {
      return;
    }

    get()._takeSnapshot();
    set({
      nodes: nodes.map((node) =>
        selectedNodeIds.includes(node.id)
          ? { ...node, data: { ...node.data, color: clipboardStyle.color } }
          : node,
      ),
    });
  },

  copySelection: () => {
    const { nodes, edges, selectedNodeIds } = get();
    set({
      clipboard: buildClipboard(nodes as Node<NodeData>[], edges, selectedNodeIds),
    });
  },

  pasteClipboard: (position) => {
    const { clipboard, nodes, edges } = get();

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
      } satisfies Node<NodeData>;
    });

    const pastedEdges = clipboard.edges.map((edge) => ({
      ...cloneEdge(edge),
      id: uuidv4(),
      source: idMap.get(edge.source) ?? edge.source,
      target: idMap.get(edge.target) ?? edge.target,
      selected: false,
    }));

    get()._takeSnapshot();

    set({
      nodes: [...nodes.map((node) => ({ ...node, selected: false })), ...pastedNodes],
      edges: [...edges.map((edge) => ({ ...edge, selected: false })), ...pastedEdges],
      selectedNodeIds: pastedNodes.map((node) => node.id),
      selectedEdgeIds: [],
    });
  },

  _takeSnapshot: () => {
    const { nodes, edges, past } = get();

    set({
      past: [
        ...past,
        {
          nodes: nodes.map(cloneNode),
          edges: edges.map(cloneEdge),
        },
      ].slice(-MAX_HISTORY_ENTRIES),
      future: [],
    });
  },

  onNodesChange: (changes: NodeChange[]) => {
    const nextNodes = applyNodeChanges(changes, get().nodes);
    set({
      nodes: nextNodes,
      selectedNodeIds: nextNodes.filter((node) => node.selected).map((node) => node.id),
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    const nextEdges = applyEdgeChanges(changes, get().edges);
    set({
      edges: nextEdges,
      selectedEdgeIds: nextEdges.filter((edge) => edge.selected).map((edge) => edge.id),
    });
  },

  onConnect: (params: Connection) => {
    if (!params.source || !params.target) {
      return;
    }

    const { nodes, edges } = get();
    const sourceNode = nodes.find((node) => node.id === params.source);
    const sourceColor = (sourceNode?.data as NodeData | undefined)?.color ?? null;

    if (sourceNode?.type === 'decision') {
      const outgoingEdges = edges.filter((edge) => edge.source === params.source);

      if (outgoingEdges.length >= 2) {
        return;
      }

      const label = outgoingEdges.length === 0 ? 'YES' : 'NO';
      const edgeWithData: Edge = {
        id: `e-${params.source}-${params.target}-${uuidv4()}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        type: 'labeled',
        data: { label, sourceColor },
      };

      get()._takeSnapshot();
      set({
        edges: reactFlowAddEdge(edgeWithData, edges),
      });
      return;
    }

    const defaultEdge: Edge = {
      id: `e-${params.source}-${params.target}-${uuidv4()}`,
      source: params.source,
      target: params.target,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle,
      type: 'labeled',
      data: { sourceColor },
    };

    get()._takeSnapshot();
    set({
      edges: reactFlowAddEdge(defaultEdge, edges),
    });
  },

  addNode: (node) => {
    get()._takeSnapshot();
    set({ nodes: [...get().nodes, node] });
  },

  updateNode: (nodeId, data) => {
    get()._takeSnapshot();
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node,
      ),
    });
  },

  updateNodeDimensions: (nodeId, dimensions, options) => {
    if (options?.snapshot !== false) {
      get()._takeSnapshot();
    }

    set({
      nodes: get().nodes.map((node) => {
        if (node.id !== nodeId) {
          return node;
        }

        const width = Math.round(dimensions.width);
        const height = Math.round(dimensions.height);

        return {
          ...node,
          width,
          height,
          position: {
            x: dimensions.x ?? node.position.x,
            y: dimensions.y ?? node.position.y,
          },
          data: {
            ...node.data,
            width,
            height,
          },
        };
      }),
    });
  },

  updateNodeColor: (nodeId, color) => {
    get()._takeSnapshot();
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, color } } : node,
      ),
    });
  },

  updateNodeType: (nodeId, type) => {
    get()._takeSnapshot();
    set({
      nodes: get().nodes.map((node) => {
        if (node.id !== nodeId) {
          return node;
        }

        const defaults = getDefaultNodeData(type);
        const width = node.data.width ?? defaults.width ?? DEFAULT_NODE_SIZE.width;
        const height = node.data.height ?? defaults.height ?? DEFAULT_NODE_SIZE.height;

        return {
          ...node,
          type,
          width,
          height,
          data: {
            ...node.data,
            ...defaults,
            width,
            height,
          },
        };
      }),
    });
  },

  updateEdgeData: (edgeId, label) => {
    get()._takeSnapshot();
    set({
      edges: get().edges.map((edge) =>
        edge.id === edgeId ? { ...edge, data: { ...edge.data, label } } : edge,
      ),
    });
  },

  nudgeSelectedNodes: (dx, dy) => {
    const { nodes, selectedNodeIds } = get();

    if (selectedNodeIds.length === 0) {
      return;
    }

    get()._takeSnapshot();
    set({
      nodes: nodes.map((node) =>
        selectedNodeIds.includes(node.id)
          ? {
              ...node,
              position: {
                x: node.position.x + dx,
                y: node.position.y + dy,
              },
            }
          : node,
      ),
    });
  },

  selectAllNodes: () => {
    set({
      selectedNodeIds: get().nodes.map((node) => node.id),
      selectedEdgeIds: [],
      nodes: get().nodes.map((node) => ({ ...node, selected: true })),
      edges: get().edges.map((edge) => ({ ...edge, selected: false })),
    });
  },

  deleteMultiple: () => {
    const { nodes, edges, selectedNodeIds, selectedEdgeIds } = get();

    if (selectedNodeIds.length === 0 && selectedEdgeIds.length === 0) {
      return;
    }

    get()._takeSnapshot();

    set({
      nodes: nodes.filter((node) => !selectedNodeIds.includes(node.id)),
      edges: edges.filter(
        (edge) =>
          !selectedEdgeIds.includes(edge.id) &&
          !selectedNodeIds.includes(edge.source) &&
          !selectedNodeIds.includes(edge.target),
      ),
      selectedNodeIds: [],
      selectedEdgeIds: [],
    });
  },

  duplicateMultiple: () => {
    const { nodes, edges, selectedNodeIds } = get();

    if (selectedNodeIds.length === 0) {
      return;
    }

    const selectedNodes = nodes.filter((node) =>
      selectedNodeIds.includes(node.id),
    ) as Node<NodeData>[];
    const duplicates = selectedNodes.map((node) => createNodeDuplicate(node, DUPLICATE_OFFSET));
    const idMap = new Map<string, string>();

    selectedNodes.forEach((node, index) => {
      idMap.set(node.id, duplicates[index].id);
    });

    const duplicateEdges = edges
      .filter(
        (edge) =>
          selectedNodeIds.includes(edge.source) && selectedNodeIds.includes(edge.target),
      )
      .map((edge) => ({
        ...cloneEdge(edge),
        id: uuidv4(),
        source: idMap.get(edge.source) ?? edge.source,
        target: idMap.get(edge.target) ?? edge.target,
      }));

    get()._takeSnapshot();

    set({
      nodes: [...nodes.map((node) => ({ ...node, selected: false })), ...duplicates],
      edges: [...edges.map((edge) => ({ ...edge, selected: false })), ...duplicateEdges],
      selectedNodeIds: duplicates.map((node) => node.id),
      selectedEdgeIds: [],
    });
  },

  alignSelectedNodes: (direction) => {
    const { nodes, selectedNodeIds } = get();

    if (selectedNodeIds.length < 2) {
      return;
    }

    const selected = nodes.filter((node) =>
      selectedNodeIds.includes(node.id),
    ) as Node<NodeData>[];
    const aligned = alignNodes(selected, direction);
    const alignedMap = new Map(aligned.map((node) => [node.id, node]));

    get()._takeSnapshot();

    set({
      nodes: nodes.map((node) => alignedMap.get(node.id) ?? node),
    });
  },

  addEdge: (edge) => {
    get()._takeSnapshot();
    set({
      edges: reactFlowAddEdge(edge, get().edges),
    });
  },

  setSelectedNodeIds: (ids) => {
    set({
      selectedNodeIds: ids,
      selectedEdgeIds: ids.length > 0 ? [] : get().selectedEdgeIds,
      nodes: get().nodes.map((node) => ({ ...node, selected: ids.includes(node.id) })),
      edges: ids.length > 0 ? get().edges.map((edge) => ({ ...edge, selected: false })) : get().edges,
    });
  },

  setSelectedEdgeIds: (ids) => {
    set({
      selectedEdgeIds: ids,
      selectedNodeIds: ids.length > 0 ? [] : get().selectedNodeIds,
      edges: get().edges.map((edge) => ({ ...edge, selected: ids.includes(edge.id) })),
      nodes: ids.length > 0 ? get().nodes.map((node) => ({ ...node, selected: false })) : get().nodes,
    });
  },

  setDiagramId: (diagramId) => set({ diagramId }),
  setDiagram: (nodes, edges) =>
    set({
      nodes,
      edges,
      selectedNodeIds: [],
      selectedEdgeIds: [],
      contextMenu: { open: false },
    }),
  setSaving: (isSaving) => set({ isSaving }),

  clearCanvas: () => {
    set({
      nodes: [],
      edges: [],
      past: [],
      future: [],
      selectedNodeIds: [],
      selectedEdgeIds: [],
      clipboard: null,
      contextMenu: { open: false },
    });
    clearAutosavedDiagram();
  },

  undo: () => {
    const { past, future, nodes, edges } = get();

    if (past.length === 0) {
      return;
    }

    const previous = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      future: [
        {
          nodes: nodes.map(cloneNode),
          edges: edges.map(cloneEdge),
        },
        ...future,
      ].slice(0, MAX_HISTORY_ENTRIES),
      nodes: previous.nodes.map(cloneNode),
      edges: previous.edges.map(cloneEdge),
      selectedNodeIds: [],
      selectedEdgeIds: [],
    });
  },

  redo: () => {
    const { past, future, nodes, edges } = get();

    if (future.length === 0) {
      return;
    }

    const next = future[0];
    set({
      past: [
        ...past,
        {
          nodes: nodes.map(cloneNode),
          edges: edges.map(cloneEdge),
        },
      ].slice(-MAX_HISTORY_ENTRIES),
      future: future.slice(1),
      nodes: next.nodes.map(cloneNode),
      edges: next.edges.map(cloneEdge),
      selectedNodeIds: [],
      selectedEdgeIds: [],
    });
  },
});
