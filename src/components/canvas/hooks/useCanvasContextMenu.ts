import { useCallback } from 'react';
import type { Node } from 'reactflow';
import type { AppState } from '../../../types';

type UseCanvasContextMenuParams = {
  openContextMenu: AppState['openContextMenu'];
  closeContextMenu: AppState['closeContextMenu'];
  setSelectedNodeIds: AppState['setSelectedNodeIds'];
  setSelectedEdgeIds: AppState['setSelectedEdgeIds'];
  screenToFlowPosition: (position: { x: number; y: number }) => { x: number; y: number };
};

export function useCanvasContextMenu({
  openContextMenu,
  closeContextMenu,
  setSelectedNodeIds,
  setSelectedEdgeIds,
  screenToFlowPosition,
}: UseCanvasContextMenuParams) {
  const onPaneClick = useCallback(() => {
    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
    closeContextMenu();
  }, [closeContextMenu, setSelectedEdgeIds, setSelectedNodeIds]);

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      openContextMenu({
        open: true,
        target: 'canvas',
        x: event.clientX,
        y: event.clientY,
        flowX: position.x,
        flowY: position.y,
      });
    },
    [openContextMenu, screenToFlowPosition],
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setSelectedNodeIds([node.id]);
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      openContextMenu({
        open: true,
        target: 'node',
        nodeId: node.id,
        x: event.clientX,
        y: event.clientY,
        flowX: position.x,
        flowY: position.y,
      });
    },
    [openContextMenu, screenToFlowPosition, setSelectedNodeIds],
  );

  return {
    onPaneClick,
    onPaneContextMenu,
    onNodeContextMenu,
  };
}
