import type { EdgeTypes } from 'reactflow';
import LabeledEdge from './LabeledEdge';

/**
 * edgeTypes mapping — custom edge types for React Flow.
 */
export const edgeTypes: EdgeTypes = {
  labeled: LabeledEdge,
};

export { default as LabeledEdge } from './LabeledEdge';
export type { EdgeData, CustomEdgeProps } from './types';
