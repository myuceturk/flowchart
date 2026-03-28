import type { EdgeProps } from 'reactflow';

export interface EdgeData {
  label?: string;
  animated?: boolean;
  sourceColor?: string | null;
}

export type CustomEdgeProps = EdgeProps<EdgeData>;
