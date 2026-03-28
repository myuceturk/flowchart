import { useCallback, useRef } from 'react';
import type { Node } from 'reactflow';
import type { AppState } from '../../../types';
import { getAlignmentLines } from '../../../utils/alignment';

// Disable alignment guides entirely above this node count.
// At 150 nodes, getAlignmentLines() does 150 bound-checks at 60 fps = 9,000/sec.
// At 500+ nodes that becomes 30,000+/sec for a feature most users won't notice.
const ALIGNMENT_GUIDE_NODE_LIMIT = 150;

// Only compare nodes within this diagram-space radius when guide checking IS active.
// Reduces the candidate set for medium diagrams (50–150 nodes) while keeping guides
// accurate — nodes farther than 500 px can't visually snap anyway.
const ALIGNMENT_PROXIMITY_RADIUS = 500;

type DragState = {
  id: string;
  rawX: number;
  rawY: number;
  lastX: number;
  lastY: number;
};

type UseNodeAlignmentGuidesParams = {
  getNodes: () => Node[];
  selectedNodeIds: string[];
  takeSnapshot: AppState['_takeSnapshot'];
  setHelperLines: AppState['setHelperLines'];
};

export function useNodeAlignmentGuides({
  getNodes,
  selectedNodeIds,
  takeSnapshot,
  setHelperLines,
}: UseNodeAlignmentGuidesParams) {
  const dragRef = useRef<DragState | null>(null);

  const onNodeDragStart = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      takeSnapshot();
      dragRef.current = {
        id: node.id,
        rawX: node.position.x,
        rawY: node.position.y,
        lastX: node.position.x,
        lastY: node.position.y,
      };
    },
    [takeSnapshot],
  );

  const onNodeDragStop = useCallback(() => {
    setHelperLines(null, null);
    dragRef.current = null;
  }, [setHelperLines]);

  const onNodeDrag = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!dragRef.current || dragRef.current.id !== node.id) {
        return;
      }

      if (selectedNodeIds.length > 1) {
        setHelperLines(null, null);
        return;
      }

      const currentNodes = getNodes();

      // Skip guide computation entirely on large diagrams — the per-frame cost of
      // scanning hundreds of nodes outweighs the UX benefit of snapping lines.
      if (currentNodes.length > ALIGNMENT_GUIDE_NODE_LIMIT) {
        return;
      }

      const dragState = dragRef.current;
      const dx = node.position.x - dragState.lastX;
      const dy = node.position.y - dragState.lastY;

      dragState.rawX += dx;
      dragState.rawY += dy;

      const originalPosition = { ...node.position };
      node.position.x = dragState.rawX;
      node.position.y = dragState.rawY;

      // For medium diagrams (50–150 nodes) narrow the candidate set to nearby nodes
      // before calling getAlignmentLines so the inner loop stays small.
      const candidateNodes =
        currentNodes.length > 50
          ? currentNodes.filter(
              (n) =>
                n.id !== node.id &&
                Math.abs(n.position.x - node.position.x) < ALIGNMENT_PROXIMITY_RADIUS &&
                Math.abs(n.position.y - node.position.y) < ALIGNMENT_PROXIMITY_RADIUS,
            )
          : currentNodes;

      const { vLine, hLine, draggedX, draggedY } = getAlignmentLines(node, candidateNodes);

      let finalX = dragState.rawX;
      let finalY = dragState.rawY;

      if (draggedX !== null) {
        const releaseThreshold = Math.abs(originalPosition.x - draggedX) < 1 ? 10 : 8;

        if (Math.abs(dragState.rawX - draggedX) < releaseThreshold) {
          finalX = draggedX;
        }
      }

      if (draggedY !== null) {
        const releaseThreshold = Math.abs(originalPosition.y - draggedY) < 1 ? 10 : 8;

        if (Math.abs(dragState.rawY - draggedY) < releaseThreshold) {
          finalY = draggedY;
        }
      }

      node.position.x = finalX;
      node.position.y = finalY;
      dragState.lastX = finalX;
      dragState.lastY = finalY;

      setHelperLines(vLine, hLine);
    },
    [getNodes, selectedNodeIds.length, setHelperLines],
  );

  return {
    onNodeDragStart,
    onNodeDragStop,
    onNodeDrag,
  };
}
