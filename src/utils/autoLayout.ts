import type { Edge, Node, XYPosition } from 'reactflow';

const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 72;

type AutoLayoutOptions = {
  horizontalSpacing?: number;
  verticalSpacing?: number;
};

const getNodeSize = (node: Node) => ({
  width: node.width ?? DEFAULT_NODE_WIDTH,
  height: node.height ?? DEFAULT_NODE_HEIGHT,
});

const getConnectedNodeIds = (edges: Edge[]) => {
  const ids = new Set<string>();

  edges.forEach((edge) => {
    if (edge.source) ids.add(edge.source);
    if (edge.target) ids.add(edge.target);
  });

  return ids;
};

export const getAutoLayoutedNodes = (
  nodes: Node[],
  edges: Edge[],
  options: AutoLayoutOptions = {},
): Node[] => {
  if (nodes.length === 0 || edges.length === 0) {
    return nodes;
  }

  const horizontalSpacing = options.horizontalSpacing ?? 200;
  const verticalSpacing = options.verticalSpacing ?? 120;
  const connectedIds = getConnectedNodeIds(edges);

  if (connectedIds.size === 0) {
    return nodes;
  }

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const connectedNodes = nodes.filter((node) => connectedIds.has(node.id));

  if (connectedNodes.length === 0) {
    return nodes;
  }

  const outgoing = new Map<string, string[]>();
  const indegree = new Map<string, number>();

  connectedNodes.forEach((node) => {
    outgoing.set(node.id, []);
    indegree.set(node.id, 0);
  });

  edges.forEach((edge) => {
    if (!connectedIds.has(edge.source) || !connectedIds.has(edge.target)) {
      return;
    }

    outgoing.get(edge.source)?.push(edge.target);
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  });

  const queue = connectedNodes
    .filter((node) => (indegree.get(node.id) ?? 0) === 0)
    .sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y)
    .map((node) => node.id);

  if (queue.length === 0 && connectedNodes[0]) {
    queue.push(connectedNodes[0].id);
  }

  const layerByNode = new Map<string, number>();
  const visited = new Set<string>();

  queue.forEach((id) => layerByNode.set(id, 0));

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) continue;

    visited.add(currentId);
    const currentLayer = layerByNode.get(currentId) ?? 0;
    const targets = outgoing.get(currentId) ?? [];

    targets.forEach((targetId) => {
      const nextLayer = currentLayer + 1;
      const previousLayer = layerByNode.get(targetId) ?? 0;

      if (nextLayer > previousLayer) {
        layerByNode.set(targetId, nextLayer);
      }

      indegree.set(targetId, (indegree.get(targetId) ?? 1) - 1);
      if ((indegree.get(targetId) ?? 0) <= 0) {
        queue.push(targetId);
      }
    });
  }

  connectedNodes.forEach((node) => {
    if (!visited.has(node.id)) {
      layerByNode.set(node.id, layerByNode.get(node.id) ?? 0);
    }
  });

  const layers = new Map<number, Node[]>();

  connectedNodes.forEach((node) => {
    const layer = layerByNode.get(node.id) ?? 0;
    const group = layers.get(layer) ?? [];
    group.push(node);
    layers.set(layer, group);
  });

  const sortedLayerEntries = Array.from(layers.entries()).sort((a, b) => a[0] - b[0]);
  const layoutPositions = new Map<string, XYPosition>();

  sortedLayerEntries.forEach(([layerIndex, layerNodes]) => {
    const orderedNodes = [...layerNodes].sort(
      (a, b) => a.position.x - b.position.x || a.position.y - b.position.y,
    );

    const totalWidth = orderedNodes.reduce((width, node, index) => {
      const nodeWidth = getNodeSize(node).width;
      return width + nodeWidth + (index === orderedNodes.length - 1 ? 0 : horizontalSpacing);
    }, 0);

    let cursorX = -totalWidth / 2;
    const baseY = layerIndex * verticalSpacing;

    orderedNodes.forEach((node) => {
      const { width, height } = getNodeSize(node);
      const position = {
        x: cursorX,
        y: baseY - height / 2,
      };

      layoutPositions.set(node.id, position);
      cursorX += width + horizontalSpacing;
    });
  });

  return nodes.map((node) => {
    const nextPosition = layoutPositions.get(node.id);

    if (!nextPosition || !nodeMap.has(node.id)) {
      return node;
    }

    return {
      ...node,
      position: nextPosition,
    };
  });
};
