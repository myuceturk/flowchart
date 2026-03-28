import type { Edge, Node } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import type { NodeData } from '../nodes/types';
import { getDefaultNodeData } from '../nodes/nodeRegistry';

export const DUPLICATE_OFFSET = 40;
export const DEFAULT_NODE_SIZE = {
  width: 160,
  height: 72,
};
export const MAX_HISTORY_ENTRIES = 50;

const initialProcessDefaults = getDefaultNodeData('process');

export const initialNodes: Node<NodeData>[] = [
  {
    id: 'node-1',
    type: 'process',
    position: { x: 250, y: 200 },
    width: initialProcessDefaults.width,
    height: initialProcessDefaults.height,
    data: {
      ...initialProcessDefaults,
      label: 'Start Process',
    },
  },
];

export function cloneNode<T extends Node>(node: T): T {
  return {
    ...node,
    data: node.data ? { ...node.data } : node.data,
    position: { ...node.position },
    style: node.style ? { ...node.style } : node.style,
  };
}

export function cloneEdge<T extends Edge>(edge: T): T {
  return {
    ...edge,
    data: edge.data ? { ...edge.data } : edge.data,
    style: edge.style ? { ...edge.style } : edge.style,
  };
}

export function createNodeDuplicate(node: Node<NodeData>, offset: number) {
  const id = uuidv4();

  return {
    ...cloneNode(node),
    id,
    position: {
      x: node.position.x + offset,
      y: node.position.y + offset,
    },
    selected: true,
  } satisfies Node<NodeData>;
}
