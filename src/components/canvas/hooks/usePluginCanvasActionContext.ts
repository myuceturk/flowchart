import { useMemo } from 'react';
import { getCanvasCenterScreenPoint } from '../../../app/services/flowViewport';
import { createPluginActionContext, createPluginNode } from '../../../plugins/pluginSystem';
import useDiagramStore from '../../../store/useDiagramStore';
import useUIStore from '../../../store/useUIStore';
import type { DiagramStore } from '../../../types';

type UsePluginCanvasActionContextParams = {
  addNode: DiagramStore['addNode'];
  fitView: (options?: { padding?: number; duration?: number }) => void | boolean | Promise<boolean>;
  screenToFlowPosition: (position: { x: number; y: number }) => { x: number; y: number };
};

export function usePluginCanvasActionContext({
  addNode,
  fitView,
  screenToFlowPosition,
}: UsePluginCanvasActionContextParams) {
  return useMemo(
    () =>
      createPluginActionContext({
        addNode: ({ type, label, color, position }) => {
          const resolvedPosition =
            position ?? screenToFlowPosition(getCanvasCenterScreenPoint());

          addNode(createPluginNode(type, resolvedPosition, { label, color }));
        },
        fitView: () => fitView({ padding: 0.2, duration: 220 }),
        setActiveTool: useUIStore.getState().setActiveTool,
        getDiagramState: useDiagramStore.getState,
      }),
    [addNode, fitView, screenToFlowPosition],
  );
}
