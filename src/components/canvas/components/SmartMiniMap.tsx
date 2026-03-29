import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MiniMap } from 'reactflow';
import type { Node } from 'reactflow';
import { getNodeDefinition } from '../../../nodes/nodeRegistry';
import { useNodeById } from '../../../store/selectors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TooltipState {
  nodeId: string;
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// MiniMapTooltip — rendered while a minimap node is hovered
// ---------------------------------------------------------------------------

const MiniMapTooltip: React.FC<{ nodeId: string; anchorX: number; anchorY: number }> = ({
  nodeId,
  anchorX,
  anchorY,
}) => {
  const node = useNodeById(nodeId);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ top: anchorY, left: anchorX });

  // After the tooltip mounts, check if it overflows the viewport and nudge it
  // back inside.  We do this in a layout-effect so the user never sees the
  // un-adjusted position.
  useEffect(() => {
    const el = tooltipRef.current;
    if (!el) return;

    const { width, height } = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = anchorY - height - 8; // place above the cursor by default
    let left = anchorX - width / 2;

    // Flip below cursor when there is not enough room above
    if (top < 8) top = anchorY + 16;

    // Clamp horizontally
    if (left < 8) left = 8;
    if (left + width > vw - 8) left = vw - width - 8;

    // Clamp vertically (bottom edge)
    if (top + height > vh - 8) top = vh - height - 8;

    setAdjustedPos({ top, left });
  }, [anchorX, anchorY]);

  if (!node) return null;

  const definition = getNodeDefinition(node.type ?? '');
  const label = node.data?.label ?? node.type ?? 'Node';
  const color = node.data?.color ?? definition?.miniMapColor ?? '#94a3b8';

  return (
    <div
      ref={tooltipRef}
      className="smart-minimap-tooltip"
      style={{ top: adjustedPos.top, left: adjustedPos.left }}
      // Prevent tooltip mouse events from interfering with minimap interactions
      onMouseEnter={(e) => e.stopPropagation()}
    >
      <span
        className="smart-minimap-tooltip__color-chip"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {definition?.icon && (
        <span className="smart-minimap-tooltip__icon" aria-hidden="true">
          {definition.icon}
        </span>
      )}
      <span className="smart-minimap-tooltip__label">{label}</span>
      {definition && (
        <span className="smart-minimap-tooltip__type">{definition.label}</span>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// SmartMiniMap — wraps ReactFlow's <MiniMap> and adds hover tooltips
// ---------------------------------------------------------------------------

interface SmartMiniMapProps {
  nodeColor: (node: Node) => string;
}

const SmartMiniMap: React.FC<SmartMiniMapProps> = ({ nodeColor }) => {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Clear both timers on unmount
  useEffect(
    () => () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    },
    [],
  );

  // ReactFlow's MiniMap renders individual node rectangles as <rect> SVG
  // elements with a data-id attribute.  We delegate event handling to the
  // container via bubbling so we do not need to touch each <rect> directly.
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as SVGElement;
    const nodeEl = target.closest<SVGElement>('[data-id]');
    const nodeId = nodeEl?.getAttribute('data-id') ?? null;

    if (!nodeId) {
      // Moved off a node — cancel any pending show and start hide delay
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      if (!hideTimerRef.current) {
        hideTimerRef.current = setTimeout(() => {
          hideTimerRef.current = null;
          setTooltip(null);
        }, 200);
      }
      return;
    }

    // Cancel any pending hide
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    // If we are already showing this node's tooltip, just update position
    if (tooltip?.nodeId === nodeId) {
      setTooltip({ nodeId, x: e.clientX, y: e.clientY });
      return;
    }

    // New node — cancel existing show-timer and start a fresh 200 ms delay
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    const capturedX = e.clientX;
    const capturedY = e.clientY;
    showTimerRef.current = setTimeout(() => {
      showTimerRef.current = null;
      setTooltip({ nodeId, x: capturedX, y: capturedY });
    }, 200);
  }, [tooltip]);

  const handleMouseLeave = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (!hideTimerRef.current) {
      hideTimerRef.current = setTimeout(() => {
        hideTimerRef.current = null;
        setTooltip(null);
      }, 200);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="smart-minimap-wrapper"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <MiniMap
        position="bottom-right"
        nodeColor={nodeColor}
        maskColor="rgba(0, 0, 0, 0.1)"
        className="custom-minimap"
        zoomable
        pannable
      />
      {tooltip && (
        <MiniMapTooltip
          nodeId={tooltip.nodeId}
          anchorX={tooltip.x}
          anchorY={tooltip.y}
        />
      )}
    </div>
  );
};

export default React.memo(SmartMiniMap);
