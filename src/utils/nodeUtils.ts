import { getDefaultNodeData, getNodeDefinition } from '../nodes/nodeRegistry';
import type { AppNodeType, NodeData } from '../nodes/types';

export function getNodeMinSize(type: AppNodeType | string, data?: NodeData) {
  const defaults = getNodeDefinition(type)?.defaultData ?? getDefaultNodeData('process');

  return {
    minWidth: data?.minWidth ?? defaults.minWidth ?? defaults.width ?? 160,
    minHeight: data?.minHeight ?? defaults.minHeight ?? defaults.height ?? 72,
  };
}
