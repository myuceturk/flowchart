import React, { useCallback, useMemo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getStraightPath,
  getSmoothStepPath,
} from 'reactflow';
import type { CustomEdgeProps } from './types';
import './edges.css';
import EdgeActionToolbar from './EdgeActionToolbar';
import { createTransition } from '../utils/animations';
import useUIStore from '../store/useUIStore';

// Computed once at module load — same args every call, so hoisting is safe.
const EDGE_TRANSITION = createTransition(['stroke', 'stroke-width', 'filter']);

/** Maps data.lineType → strokeDasharray value */
function resolveStrokeDasharray(
  lineType: 'solid' | 'dashed' | 'dotted' | undefined,
  animatedOverride: string | undefined,
): string | undefined {
  if (animatedOverride) return animatedOverride;
  if (lineType === 'dashed') return '8 6';
  if (lineType === 'dotted') return '2 4';
  return undefined;
}

/**
 * LabeledEdge — Custom edge with path-shape, line-type, and arrow-head options.
 *
 * • pathType  (bezier | straight | step | smoothstep) — default: bezier
 * • lineType  (solid | dashed | dotted)               — default: solid
 * • arrowType (arrow | none | circle)                 — default: arrow
 *
 * Backward-compatible: existing edges with no style fields render exactly as before.
 */
const LabeledEdge: React.FC<CustomEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const pathType = data?.pathType ?? 'bezier';
  const lineType = data?.lineType ?? 'solid';
  const arrowType = data?.arrowType ?? 'arrow';

  // ── Path calculation ────────────────────────────────────────────
  const [edgePath, labelX, labelY] = useMemo(() => {
    const args = { sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition };
    switch (pathType) {
      case 'straight':
        return getStraightPath({ sourceX, sourceY, targetX, targetY });
      case 'step':
        return getSmoothStepPath({ ...args, borderRadius: 0 });
      case 'smoothstep':
        return getSmoothStepPath(args);
      case 'bezier':
      default:
        return getBezierPath(args);
    }
  }, [sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, pathType]);

  // ── Edge visual style ───────────────────────────────────────────
  const edgeStyle = useMemo(() => {
    const animatedDash = data?.animated ? '8 6' : undefined;
    const dasharray = resolveStrokeDasharray(lineType, animatedDash);
    return {
      ...style,
      strokeDasharray: dasharray,
      strokeLinecap: lineType === 'dotted' ? ('round' as const) : undefined,
      animation: data?.animated ? 'edge-flow 1.4s linear infinite' : style?.animation,
      transition: EDGE_TRANSITION,
    };
  }, [style, data?.animated, lineType]);

  // ── Marker resolution ───────────────────────────────────────────
  // 'arrow'  → pass through the ReactFlow default markerEnd
  // 'none'   → no marker
  // 'circle' → no SVG marker; we render a <circle> overlay instead
  const resolvedMarkerEnd = arrowType === 'arrow' ? markerEnd : undefined;

  // ── Label container ─────────────────────────────────────────────
  const labelContainerStyle = useMemo<React.CSSProperties>(
    () => ({
      position: 'absolute',
      transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
      pointerEvents: 'all',
    }),
    [labelX, labelY],
  );

  const onLabelClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      useUIStore.getState().setSelectedEdgeIds([id]);
    },
    [id],
  );

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={resolvedMarkerEnd}
        style={edgeStyle}
      />

      {/* Circle marker rendered as an SVG element at the target point */}
      {arrowType === 'circle' && (
        <circle
          cx={targetX}
          cy={targetY}
          r={5}
          className="edge-marker-circle"
        />
      )}

      <EdgeActionToolbar
        id={id}
        data={data}
        labelX={labelX}
        labelY={labelY}
      />

      {data?.label && (
        <EdgeLabelRenderer>
          <div style={labelContainerStyle} className="nodrag nopan">
            <div className="edge-label" onClick={onLabelClick}>
              {data.label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default React.memo(LabeledEdge);
