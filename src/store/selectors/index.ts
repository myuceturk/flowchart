import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useDiagramStore from '../useDiagramStore';
import useUIStore from '../useUIStore';
import type { UIStore } from '../useUIStore';

/**
 * Static selector for the UI state needed by node inline-editing.
 * Suitable for use with useUIStore(useShallow(selectNodeEditingUIState)).
 */
export const selectNodeEditingUIState = (state: UIStore) => ({
  selectedNodeIds: state.selectedNodeIds,
  selectedEdgeIds: state.selectedEdgeIds,
  isEditingLabel: state.isEditingLabel,
  setEditingLabel: state.setEditingLabel,
});

/**
 * Returns the `.data` of the node with the given id, with a memoized
 * selector so the closure is not recreated on every render.
 *
 * Avoids the O(n) `.find()` running on every store update without a
 * stable selector function reference.
 */
export function useNodeData(nodeId: string) {
  return useDiagramStore(
    useCallback((state) => state.nodes.find((n) => n.id === nodeId)?.data, [nodeId]),
  );
}

/**
 * Returns the consolidated UIStore slice required by node components
 * for selection and inline label editing.
 */
export function useNodeEditingState() {
  return useUIStore(useShallow(selectNodeEditingUIState));
}
