import { useCallback } from 'react';
import type { AppNodeType } from '../../../nodes/types';
import type { AppState } from '../../../types';
import { createPluginNode } from '../../../plugins/pluginSystem';

type SidebarDropPayload = {
  type: AppNodeType;
  label?: string;
  color?: string | null;
};

type UseCanvasNodeDnDParams = {
  addNode: AppState['addNode'];
  screenToFlowPosition: (position: { x: number; y: number }) => { x: number; y: number };
};

export function useCanvasNodeDnD({ addNode, screenToFlowPosition }: UseCanvasNodeDnDParams) {
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const rawPayload = event.dataTransfer.getData('application/reactflow');

      if (!rawPayload) {
        return;
      }

      let payload: SidebarDropPayload;

      try {
        payload = JSON.parse(rawPayload) as SidebarDropPayload;
      } catch {
        payload = { type: rawPayload as AppNodeType };
      }

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addNode(
        createPluginNode(payload.type, position, {
          label: payload.label,
          color: payload.color ?? null,
        }),
      );
    },
    [addNode, screenToFlowPosition],
  );

  return {
    onDragOver,
    onDrop,
  };
}
