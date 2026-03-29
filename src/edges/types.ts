import type { EdgeProps } from 'reactflow';

export type EdgePathType = 'bezier' | 'straight' | 'step' | 'smoothstep';
export type EdgeLineType = 'solid' | 'dashed' | 'dotted';
export type EdgeArrowType = 'arrow' | 'none' | 'circle';

export interface EdgeData {
  label?: string;
  animated?: boolean;
  sourceColor?: string | null;
  pathType?: EdgePathType;
  lineType?: EdgeLineType;
  arrowType?: EdgeArrowType;
}

export type EdgeStylePartial = Pick<EdgeData, 'pathType' | 'lineType' | 'arrowType'>;

export type CustomEdgeProps = EdgeProps<EdgeData>;
