import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
} from 'reactflow';
import type { CustomEdgeProps } from './types';
import './edges.css';
import EdgeActionToolbar from './EdgeActionToolbar';
import { createTransition } from '../utils/animations';
import useUIStore from '../store/useUIStore';

/**
 * LabeledEdge — Custom edge component with a centered label.
 *
 * Uses:
 *  • BaseEdge for the actual path rendering
 *  • EdgeLabelRenderer for the absolute positioned label
 *  • getBezierPath to calculate path and label position (midpoint)
 *
 * setSelectedEdgeIds is accessed via getState() rather than a hook subscription
 * because the action reference is stable and only needed inside an event handler.
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
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onLabelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    useUIStore.getState().setSelectedEdgeIds([id]);
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeDasharray: data?.animated ? '8 6' : style?.strokeDasharray,
          animation: data?.animated ? 'edge-flow 1.4s linear infinite' : style?.animation,
          transition: createTransition(['stroke', 'stroke-width', 'filter']),
        }}
      />
      <EdgeActionToolbar
        id={id}
        data={data}
        labelX={labelX}
        labelY={labelY}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div
              className="edge-label"
              onClick={onLabelClick}
            >
              {data.label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default React.memo(LabeledEdge);
