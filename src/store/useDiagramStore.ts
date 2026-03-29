import { create } from 'zustand';
import {
  addEdge as reactFlowAddEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from 'reactflow';
import type { Connection, Edge, EdgeChange, Node, NodeChange } from 'reactflow';
import * as collaborationService from '../app/services/collaborationService';
import { v4 as uuidv4 } from 'uuid';
import type { AlignmentDirection, DiagramSnapshot, DiagramStore } from '../types';
import {
  DECISION_SOURCE_HANDLES,
  getDecisionLabelForHandle,
  isDecisionSourceHandle,
} from '../nodes/decisionHandles';
import type { NodeData } from '../nodes/types';
import { getDefaultNodeData } from '../nodes/nodeRegistry';
import { alignNodes as alignDiagramNodes } from '../utils/alignment';
import {
  DEFAULT_NODE_SIZE,
  DUPLICATE_OFFSET,
  cloneEdge,
  cloneNode,
  initialNodes,
} from './store.utils';

function createDuplicateNode(
  node: Node<NodeData>,
  offset: { x: number; y: number },
): Node<NodeData> {
  return {
    ...cloneNode(node),
    id: uuidv4(),
    position: {
      x: node.position.x + offset.x,
      y: node.position.y + offset.y,
    },
    selected: true,
  };
}

const DECISION_HANDLE_PRIORITY = [
  DECISION_SOURCE_HANDLES.yes,
  DECISION_SOURCE_HANDLES.no,
] as const;

function resolveDecisionSourceHandle(
  sourceHandle: Connection['sourceHandle'],
  outgoingEdges: Edge[],
) {
  if (isDecisionSourceHandle(sourceHandle)) {
    return sourceHandle;
  }

  const usedHandles = new Set(
    outgoingEdges
      .map((edge) => edge.sourceHandle)
      .filter(isDecisionSourceHandle),
  );

  return DECISION_HANDLE_PRIORITY.find((handleId) => !usedHandles.has(handleId)) ?? null;
}

const useDiagramStore = create<DiagramStore>()((set, get) => ({
  nodes: initialNodes,
  edges: [],
  diagramId: null,
  diagramTitle: null,
  isSaving: false,
  saveStatus: 'idle' as const,

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
    // Broadcast position changes to collaborators (fires during and after drag)
    if (!collaborationService.isApplyingRemote) {
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          collaborationService.send({
            type: 'node_moved',
            nodeId: change.id,
            position: change.position,
          });
        }
      }
    }
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
    // Broadcast edge deletions
    if (!collaborationService.isApplyingRemote) {
      for (const change of changes) {
        if (change.type === 'remove') {
          collaborationService.send({ type: 'edge_deleted', edgeId: change.id });
        }
      }
    }
  },

  onConnect: (params: Connection) => {
    if (!params.source || !params.target) {
      return false;
    }

    const { nodes, edges } = get();
    const sourceNode = nodes.find((node) => node.id === params.source);
    const sourceColor = sourceNode?.data?.color ?? null;

    // Reject connection if either endpoint is locked
    const targetNode = nodes.find((node) => node.id === params.target);
    if (sourceNode?.data?.locked || targetNode?.data?.locked) {
      return false;
    }

    if (sourceNode?.type === 'decision') {
      const decisionOutgoingEdges = edges.filter(
        (edge) => edge.source === params.source && isDecisionSourceHandle(edge.sourceHandle),
      );
      const sourceHandle = resolveDecisionSourceHandle(
        params.sourceHandle,
        decisionOutgoingEdges,
      );

      if (!sourceHandle) {
        return false;
      }

      const handleOutgoingEdges = edges.filter(
        (edge) => edge.source === params.source && edge.sourceHandle === sourceHandle,
      );

      if (
        decisionOutgoingEdges.length >= DECISION_HANDLE_PRIORITY.length ||
        handleOutgoingEdges.length > 0
      ) {
        return false;
      }

      const edgeWithData: Edge = {
        id: `e-${params.source}-${params.target}-${uuidv4()}`,
        source: params.source,
        target: params.target,
        sourceHandle,
        targetHandle: params.targetHandle,
        type: 'labeled',
        data: { label: getDecisionLabelForHandle(sourceHandle), sourceColor },
      };

      set({
        edges: reactFlowAddEdge(edgeWithData, edges),
      });
      collaborationService.send({ type: 'edge_created', edge: edgeWithData as unknown as Record<string, unknown> });
      return true;
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

    set({
      edges: reactFlowAddEdge(defaultEdge, edges),
    });
    collaborationService.send({ type: 'edge_created', edge: defaultEdge as unknown as Record<string, unknown> });
    return true;
  },

  addNode: (node) => {
    set({ nodes: [...get().nodes, node] });
  },

  addEdge: (edge) => {
    set({
      edges: reactFlowAddEdge(edge, get().edges),
    });
  },

  updateNode: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node,
      ),
    });
    if (!collaborationService.isApplyingRemote) {
      collaborationService.send({ type: 'node_updated', nodeId, data: data as Record<string, unknown> });
    }
  },

  updateNodeDimensions: (nodeId, dimensions) => {
    const nodes = get().nodes;
    const index = nodes.findIndex((n) => n.id === nodeId);
    if (index === -1) return;

    const node = nodes[index];
    const width = Math.round(dimensions.width);
    const height = Math.round(dimensions.height);
    const x = dimensions.x ?? node.position.x;
    const y = dimensions.y ?? node.position.y;

    // Skip update if nothing changed to avoid unnecessary store writes and re-renders
    if (
      node.width === width &&
      node.height === height &&
      node.position.x === x &&
      node.position.y === y &&
      node.data.width === width &&
      node.data.height === height
    ) {
      return;
    }

    // Structural sharing: Only create a new array and new object for the updated node.
    // All other nodes will keep their original object references.
    const nextNodes = [...nodes];
    nextNodes[index] = {
      ...node,
      width,
      height,
      position: { x, y },
      data: {
        ...node.data,
        width,
        height,
      },
    };

    set({ nodes: nextNodes });
  },

  updateNodeColor: (nodeId, color) => {
    get().updateNode(nodeId, { color });
  },

  updateNodeType: (nodeId, type) => {
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
    set({
      edges: get().edges.map((edge) =>
        edge.id === edgeId ? { ...edge, data: { ...edge.data, label } } : edge,
      ),
    });
  },

  updateEdgeStyle: (edgeId, style) => {
    set({
      edges: get().edges.map((edge) =>
        edge.id === edgeId ? { ...edge, data: { ...edge.data, ...style } } : edge,
      ),
    });
  },

  toggleNodeLock: (nodeId) => {
    const nodes = get().nodes;
    const index = nodes.findIndex((n) => n.id === nodeId);
    if (index === -1) return;

    const node = nodes[index];
    const locked = !node.data.locked;
    const nextNodes = [...nodes];
    nextNodes[index] = {
      ...node,
      draggable: !locked,
      connectable: !locked,
      deletable: !locked,
      data: { ...node.data, locked },
    };
    set({ nodes: nextNodes });
  },

  deleteNodesAndEdges: (nodeIds, edgeIds) => {
    if (nodeIds.length === 0 && edgeIds.length === 0) {
      return;
    }

    const nodeIdSet = new Set(nodeIds);
    const edgeIdSet = new Set(edgeIds);
    const currentEdges = get().edges;

    // Collect all edge IDs that will be deleted (explicit + those attached to deleted nodes)
    const deletedEdgeIds = new Set<string>(edgeIds);
    for (const edge of currentEdges) {
      if (nodeIdSet.has(edge.source) || nodeIdSet.has(edge.target)) {
        deletedEdgeIds.add(edge.id);
      }
    }

    set({
      nodes: get().nodes.filter((node) => !nodeIdSet.has(node.id)),
      edges: currentEdges.filter(
        (edge) =>
          !edgeIdSet.has(edge.id) &&
          !nodeIdSet.has(edge.source) &&
          !nodeIdSet.has(edge.target),
      ),
    });

    if (!collaborationService.isApplyingRemote) {
      for (const edgeId of deletedEdgeIds) {
        collaborationService.send({ type: 'edge_deleted', edgeId });
      }
    }
  },

  duplicateNodesAndEdges: (nodeIds, options) => {
    if (nodeIds.length === 0) {
      return { newNodeIds: [] };
    }

    const { nodes, edges } = get();
    const offset = options?.offset ?? { x: DUPLICATE_OFFSET, y: DUPLICATE_OFFSET };
    const nodeIdSet = new Set(nodeIds);
    const selectedNodes = nodes.filter((node) => nodeIdSet.has(node.id));
    const duplicates = selectedNodes.map((node) => createDuplicateNode(node, offset));
    const idMap = new Map<string, string>();

    selectedNodes.forEach((node, index) => {
      idMap.set(node.id, duplicates[index].id);
    });

    const duplicateEdges = edges
      .filter((edge) => nodeIdSet.has(edge.source) && nodeIdSet.has(edge.target))
      .map((edge) => ({
        ...cloneEdge(edge),
        id: uuidv4(),
        source: idMap.get(edge.source) ?? edge.source,
        target: idMap.get(edge.target) ?? edge.target,
        selected: false,
      }));

    set({
      nodes: [...nodes.map((node) => (node.selected ? { ...node, selected: false } : node)), ...duplicates],
      edges: [...edges.map((edge) => (edge.selected ? { ...edge, selected: false } : edge)), ...duplicateEdges],
    });

    return { newNodeIds: duplicates.map((node) => node.id) };
  },

  alignNodes: (nodeIds, direction) => {
    if (nodeIds.length < 2) {
      return;
    }

    const selected = get().nodes.filter((node) =>
      nodeIds.includes(node.id),
    ) as Node<NodeData>[];
    const aligned = alignDiagramNodes(selected, direction as AlignmentDirection);
    const alignedMap = new Map(aligned.map((node) => [node.id, node]));

    set({
      nodes: get().nodes.map((node) => alignedMap.get(node.id) ?? node),
    });
  },

  nudgeNodes: (nodeIds, dx, dy) => {
    if (nodeIds.length === 0) {
      return;
    }

    const nodeIdSet = new Set(nodeIds);

    set({
      nodes: get().nodes.map((node) =>
        nodeIdSet.has(node.id)
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

  setDiagramId: (diagramId) => set({ diagramId }),

  setDiagramTitle: (diagramTitle) => set({ diagramTitle }),

  setDiagram: (nodes, edges) =>
    set({
      nodes,
      edges,
    }),

  replaceFromSnapshot: (snapshot: DiagramSnapshot) =>
    set({
      nodes: snapshot.nodes.map(cloneNode),
      edges: snapshot.edges.map(cloneEdge),
    }),

  createSnapshot: () => ({
    nodes: get().nodes.map(cloneNode),
    edges: get().edges.map(cloneEdge),
  }),

  setSaving: (isSaving) => set({ isSaving }),

  setSaveStatus: (saveStatus) => set({ saveStatus }),

  clearDiagram: () =>
    set({
      nodes: [],
      edges: [],
    }),
}));

export default useDiagramStore;
