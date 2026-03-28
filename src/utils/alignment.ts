import type { Node } from 'reactflow';
import type { AlignmentDirection } from '../types';
import type { NodeData } from '../nodes/types';

export type SpacingIndicator = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  label: string;
};

export type AlignmentResult = {
  vLine: number | null;
  hLine: number | null;
  draggedX: number | null;
  draggedY: number | null;
  spacingIndicators: SpacingIndicator[];
};

const THRESHOLD = 8;
const DEFAULT_WIDTH = 150;
const DEFAULT_HEIGHT = 60;

type MeasuredNode = Node<NodeData>;

export function getNodeWidth(node: Node): number {
  return node.width ?? (node.data as NodeData | undefined)?.width ?? DEFAULT_WIDTH;
}

export function getNodeHeight(node: Node): number {
  return node.height ?? (node.data as NodeData | undefined)?.height ?? DEFAULT_HEIGHT;
}

function getNodeBounds(node: Node) {
  const width = getNodeWidth(node);
  const height = getNodeHeight(node);
  const { x, y } = node.position;

  return {
    x,
    y,
    width,
    height,
    right: x + width,
    bottom: y + height,
    centerX: x + width / 2,
    centerY: y + height / 2,
  };
}

export function getAlignmentLines(draggedNode: Node, nodes: Node[]): AlignmentResult {
  const result: AlignmentResult = {
    vLine: null,
    hLine: null,
    draggedX: null,
    draggedY: null,
    spacingIndicators: [],
  };

  const dragged = getNodeBounds(draggedNode);

  for (const node of nodes) {
    if (node.id === draggedNode.id) {
      continue;
    }

    const current = getNodeBounds(node);

    const vAlignments = [
      { draggedValue: dragged.x, guide: current.x, nextX: current.x },
      { draggedValue: dragged.x, guide: current.right, nextX: current.right },
      { draggedValue: dragged.centerX, guide: current.centerX, nextX: current.centerX - dragged.width / 2 },
      { draggedValue: dragged.right, guide: current.x, nextX: current.x - dragged.width },
      { draggedValue: dragged.right, guide: current.right, nextX: current.right - dragged.width },
    ];

    if (result.vLine === null) {
      for (const alignment of vAlignments) {
        if (Math.abs(alignment.draggedValue - alignment.guide) <= THRESHOLD) {
          result.vLine = alignment.guide;
          result.draggedX = alignment.nextX;
          break;
        }
      }
    }

    const hAlignments = [
      { draggedValue: dragged.y, guide: current.y, nextY: current.y },
      { draggedValue: dragged.y, guide: current.bottom, nextY: current.bottom },
      { draggedValue: dragged.centerY, guide: current.centerY, nextY: current.centerY - dragged.height / 2 },
      { draggedValue: dragged.bottom, guide: current.y, nextY: current.y - dragged.height },
      { draggedValue: dragged.bottom, guide: current.bottom, nextY: current.bottom - dragged.height },
    ];

    if (result.hLine === null) {
      for (const alignment of hAlignments) {
        if (Math.abs(alignment.draggedValue - alignment.guide) <= THRESHOLD) {
          result.hLine = alignment.guide;
          result.draggedY = alignment.nextY;
          break;
        }
      }
    }

    if (result.vLine !== null && result.hLine !== null) {
      break;
    }
  }

  return result;
}

export function alignNodes(nodes: MeasuredNode[], direction: AlignmentDirection): MeasuredNode[] {
  if (nodes.length < 2) {
    return nodes;
  }

  const measured = nodes.map((node) => ({ node, bounds: getNodeBounds(node) }));

  if (direction === 'left') {
    const minX = Math.min(...measured.map((item) => item.bounds.x));
    return nodes.map((node) => ({ ...node, position: { ...node.position, x: minX } }));
  }

  if (direction === 'right') {
    const maxRight = Math.max(...measured.map((item) => item.bounds.right));
    return nodes.map((node) => ({
      ...node,
      position: { ...node.position, x: maxRight - getNodeWidth(node) },
    }));
  }

  if (direction === 'center') {
    const avgCenter = measured.reduce((sum, item) => sum + item.bounds.centerX, 0) / measured.length;
    return nodes.map((node) => ({
      ...node,
      position: { ...node.position, x: avgCenter - getNodeWidth(node) / 2 },
    }));
  }

  if (direction === 'top') {
    const minY = Math.min(...measured.map((item) => item.bounds.y));
    return nodes.map((node) => ({ ...node, position: { ...node.position, y: minY } }));
  }

  if (direction === 'bottom') {
    const maxBottom = Math.max(...measured.map((item) => item.bounds.bottom));
    return nodes.map((node) => ({
      ...node,
      position: { ...node.position, y: maxBottom - getNodeHeight(node) },
    }));
  }

  if (direction === 'middle') {
    const avgMiddle = measured.reduce((sum, item) => sum + item.bounds.centerY, 0) / measured.length;
    return nodes.map((node) => ({
      ...node,
      position: { ...node.position, y: avgMiddle - getNodeHeight(node) / 2 },
    }));
  }

  if (direction === 'distributeHorizontal') {
    const sorted = [...nodes].sort((a, b) => a.position.x - b.position.x);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const available = last.position.x - first.position.x;
    const gap = available / (sorted.length - 1);

    return sorted.map((node, index) => ({
      ...node,
      position: { ...node.position, x: first.position.x + gap * index },
    }));
  }

  const sorted = [...nodes].sort((a, b) => a.position.y - b.position.y);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const available = last.position.y - first.position.y;
  const gap = available / (sorted.length - 1);

  return sorted.map((node, index) => ({
    ...node,
    position: { ...node.position, y: first.position.y + gap * index },
  }));
}
