import { useCallback, useRef } from 'react';
import type { Node } from 'reactflow';
import type { AppState } from '../../../types';
import { getAlignmentLines } from '../../../utils/alignment';

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

      const dragState = dragRef.current;
      const dx = node.position.x - dragState.lastX;
      const dy = node.position.y - dragState.lastY;

      dragState.rawX += dx;
      dragState.rawY += dy;

      const originalPosition = { ...node.position };
      node.position.x = dragState.rawX;
      node.position.y = dragState.rawY;

      const currentNodes = getNodes();
      const { vLine, hLine, draggedX, draggedY } = getAlignmentLines(node, currentNodes);

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
