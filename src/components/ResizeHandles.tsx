import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useReactFlow, useUpdateNodeInternals } from 'reactflow';
import { useDiagramCommands } from '../hooks/useDiagramCommands';
import type { AppNodeType, NodeData } from '../nodes/types';
import useDiagramStore from '../store/useDiagramStore';
import { getNodeMinSize } from '../utils/nodeUtils';

type ResizeDirection =
  | 'n'
  | 'e'
  | 's'
  | 'w'
  | 'ne'
  | 'nw'
  | 'se'
  | 'sw';

type ResizeHandlesProps = {
  nodeId: string;
  nodeType: AppNodeType;
  data: NodeData;
  selected: boolean;
};

const HANDLE_DIRECTIONS: ResizeDirection[] = ['nw', 'ne', 'se', 'sw'];

const clamp = (value: number, min: number) => Math.max(min, value);

const ResizeHandles: React.FC<ResizeHandlesProps> = ({ nodeId, nodeType, data, selected }) => {
  const updateNodeDimensions = useDiagramStore((state) => state.updateNodeDimensions);
  const { beginNodeResize } = useDiagramCommands();
  const { getNode, getZoom } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const frameRef = useRef<{
    direction: ResizeDirection;
    pointerId: number;
    startX: number;
    startY: number;
    startNodeX: number;
    startNodeY: number;
    startWidth: number;
    startHeight: number;
    aspectRatio: number | null;
  } | null>(null);

  const { minWidth, minHeight } = useMemo(() => getNodeMinSize(nodeType, data), [data, nodeType]);

  // Pending dimensions calculated on the latest pointer event, flushed to the
  // store on the next animation frame.  Keeps the store write rate at ≤60/sec
  // regardless of pointer event frequency (144Hz displays, stylus, etc.).
  const pendingDimRef = useRef<{ width: number; height: number; x: number; y: number } | null>(null);
  const resizeRafRef = useRef<number | null>(null);

  const commitResize = useCallback(() => {
    frameRef.current = null;
    updateNodeInternals(nodeId);
  }, [nodeId, updateNodeInternals]);

  useEffect(() => {
    if (!selected) {
      frameRef.current = null;
    }
  }, [selected]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const current = frameRef.current;
      if (!current) {
        return;
      }

      const node = getNode(nodeId);
      if (!node) {
        return;
      }

      const scale = getZoom() || 1;
      const dx = (event.clientX - current.startX) / scale;
      const dy = (event.clientY - current.startY) / scale;

      let width = current.startWidth;
      let height = current.startHeight;
      let x = current.startNodeX;
      let y = current.startNodeY;

      if (current.direction.includes('e')) {
        width = clamp(current.startWidth + dx, minWidth);
      }

      if (current.direction.includes('s')) {
        height = clamp(current.startHeight + dy, minHeight);
      }

      if (current.direction.includes('w')) {
        width = clamp(current.startWidth - dx, minWidth);
        x = current.startNodeX + (current.startWidth - width);
      }

      if (current.direction.includes('n')) {
        height = clamp(current.startHeight - dy, minHeight);
        y = current.startNodeY + (current.startHeight - height);
      }

      if (event.shiftKey && current.aspectRatio) {
        const ratio = current.aspectRatio;
        if (current.direction === 'n' || current.direction === 's') {
          width = clamp(height * ratio, minWidth);
        } else if (current.direction === 'e' || current.direction === 'w') {
          height = clamp(width / ratio, minHeight);
        } else {
          const dominantWidth = Math.abs(width - current.startWidth) >= Math.abs(height - current.startHeight);
          if (dominantWidth) {
            height = clamp(width / ratio, minHeight);
          } else {
            width = clamp(height * ratio, minWidth);
          }
        }

        if (current.direction.includes('w')) {
          x = current.startNodeX + (current.startWidth - width);
        }

        if (current.direction.includes('n')) {
          y = current.startNodeY + (current.startHeight - height);
        }
      }

      // Accumulate the latest computed dimensions and schedule a single store
      // write per animation frame — the pointer can fire faster than 60 Hz.
      pendingDimRef.current = { width, height, x, y };

      if (!resizeRafRef.current) {
        resizeRafRef.current = requestAnimationFrame(() => {
          resizeRafRef.current = null;
          if (pendingDimRef.current) {
            updateNodeDimensions(nodeId, pendingDimRef.current);
            pendingDimRef.current = null;
          }
        });
      }
    };

    const handlePointerUp = () => {
      if (!frameRef.current) {
        return;
      }

      // Flush any pending frame before committing so the final size is applied.
      if (resizeRafRef.current !== null) {
        cancelAnimationFrame(resizeRafRef.current);
        resizeRafRef.current = null;
      }
      if (pendingDimRef.current) {
        updateNodeDimensions(nodeId, pendingDimRef.current);
        pendingDimRef.current = null;
      }

      commitResize();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      if (resizeRafRef.current !== null) {
        cancelAnimationFrame(resizeRafRef.current);
        resizeRafRef.current = null;
      }
    };
  }, [commitResize, getNode, getZoom, minHeight, minWidth, nodeId, updateNodeDimensions]);

  const handlePointerDown = useCallback(
    (direction: ResizeDirection, event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const node = getNode(nodeId);
      if (!node) {
        return;
      }

      beginNodeResize();

      frameRef.current = {
        direction,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startNodeX: node.position.x,
        startNodeY: node.position.y,
        startWidth: node.width ?? data.width ?? 160,
        startHeight: node.height ?? data.height ?? 72,
        aspectRatio: data.aspectRatio ?? ((node.width ?? data.width) && (node.height ?? data.height)
          ? (node.width ?? data.width ?? 1) / (node.height ?? data.height ?? 1)
          : null),
      };

      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [beginNodeResize, data.height, data.width, data.aspectRatio, getNode, nodeId],
  );

  if (!selected || data.locked) {
    return null;
  }

  return (
    <div className="resize-handles" aria-hidden="true">
      {HANDLE_DIRECTIONS.map((direction) => (
        <button
          key={direction}
          type="button"
          className={`resize-handle resize-handle--${direction}`}
          onPointerDown={(event) => handlePointerDown(direction, event)}
          tabIndex={-1}
        />
      ))}
    </div>
  );
};

export default React.memo(ResizeHandles);
