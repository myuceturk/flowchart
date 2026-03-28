import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { Node } from 'reactflow';
import useDiagramStore from '../useDiagramStore';
import useUIStore from '../useUIStore';
import type { UIStore } from '../useUIStore';

// Module-level cache: build the nodes Map once per nodes-array reference change.
// All N node components share a single Map instead of each running find() — reduces
// selector cost from O(N²) to O(N) total per store update.
let _cachedNodesArray: readonly Node[] | null = null;
let _cachedNodesMap: Map<string, Node> | null = null;

function getNodesMap(nodes: Node[]): Map<string, Node> {
  if (nodes !== _cachedNodesArray) {
    _cachedNodesArray = nodes;
    _cachedNodesMap = new Map(nodes.map((n) => [n.id, n]));
  }
  return _cachedNodesMap!;
}

/**
 * Node-shell UI selector.
 *
 * Exposes only the derived `isSingleNodeSelected` boolean instead of the raw
 * selectedNodeIds / selectedEdgeIds arrays.  Because we compute the boolean
 * inside the selector, each node component re-renders ONLY when the boolean
 * flips (e.g. 0→1 or 2→1 selected nodes), not on every selection change.
 * With N nodes on the canvas this is the difference between N re-renders per
 * click and 0 unnecessary re-renders.
 */
/**
 * Optimized selector for node components.
 * Returns only the derived `isSingleNodeSelected` boolean instead of the raw
 * selectedNodeIds array. This ensures nodes only re-render when the count of
 * selected nodes changes to/from exactly 1, rather than on every selection change.
 */
export const selectNodeEditingUIState = (state: UIStore) => ({
  isSingleNodeSelected:
    state.selectedNodeIds.length === 1 && state.selectedEdgeIds.length === 0,
  isEditingLabel: state.isEditingLabel,
  setEditingLabel: state.setEditingLabel,
});

/**
 * Edge-toolbar UI selector — mirrors selectNodeEditingUIState from the edge
 * side.  EdgeActionToolbar re-renders only when `isSingleEdgeSelected` flips.
 */
export const selectEdgeEditingUIState = (state: UIStore) => ({
  isSingleEdgeSelected:
    state.selectedEdgeIds.length === 1 && state.selectedNodeIds.length === 0,
  isEditingLabel: state.isEditingLabel,
  setEditingLabel: state.setEditingLabel,
  setSelectedEdgeIds: state.setSelectedEdgeIds,
});

/**
 * Returns the `.data` of the node with the given id, with a memoized
 * selector so the closure is not recreated on every render.
 *
 * The `useCallback` keeps the selector reference stable across re-renders so
 * Zustand reuses the same subscription slot instead of creating a new one
 * each time the component renders.
 */
export function useNodeData(nodeId: string) {
  return useDiagramStore(
    useCallback((state) => getNodesMap(state.nodes).get(nodeId)?.data, [nodeId]),
  );
}

/**
 * Returns the consolidated UIStore slice required by node components
 * for selection and inline label editing.
 */
export function useNodeEditingState() {
  return useUIStore(useShallow(selectNodeEditingUIState));
}

/**
 * Returns the consolidated UIStore slice required by edge components
 * for selection and inline label editing.
 */
export function useEdgeEditingState() {
  return useUIStore(useShallow(selectEdgeEditingUIState));
}

/**
 * Returns only the `type` of a single node identified by id, or null.
 *
 * Used by ContextMenu to highlight the active type chip without subscribing
 * to the entire nodes array.  The component re-renders only when the type of
 * the right-clicked node changes — not on every unrelated diagram update.
 */
export function useContextMenuNodeType(nodeId: string | null | undefined) {
  return useDiagramStore(
    useCallback(
      (state) => (nodeId ? (getNodesMap(state.nodes).get(nodeId)?.type ?? null) : null),
      [nodeId],
    ),
  );
}
