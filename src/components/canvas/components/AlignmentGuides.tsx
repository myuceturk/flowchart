import React from 'react';
import { useViewport } from 'reactflow';
import { useShallow } from 'zustand/react/shallow';
import useUIStore from '../../../store/useUIStore';

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 10,
};

/**
 * Subscribes directly to the helperLines slice of UIStore so that the 60fps
 * updates that fire during node drag are isolated to this component.
 * CanvasView no longer needs helperLines in its selector and won't re-render
 * at 60fps just to pass new props here.
 */
const AlignmentGuides: React.FC = () => {
  const { vertical, horizontal, spacingIndicators } = useUIStore(
    useShallow((state) => ({
      vertical: state.helperLines.vertical,
      horizontal: state.helperLines.horizontal,
      spacingIndicators: state.helperLines.spacingIndicators,
    })),
  );
  const { x, y, zoom } = useViewport();

  return (
    <div style={overlayStyle}>
      {vertical !== null ? (
        <div
          className="alignment-guide-vertical"
          style={{
            left: vertical * zoom + x,
            top: 0,
            bottom: 0,
            width: '1px',
            backgroundColor: 'var(--theme-primary)',
            opacity: 0.72,
            position: 'absolute',
            boxShadow: '0 0 8px color-mix(in srgb, var(--theme-primary) 45%, transparent)',
          }}
        />
      ) : null}
      {horizontal !== null ? (
        <div
          className="alignment-guide-horizontal"
          style={{
            top: horizontal * zoom + y,
            left: 0,
            right: 0,
            height: '1px',
            backgroundColor: 'var(--theme-primary)',
            opacity: 0.72,
            position: 'absolute',
            boxShadow: '0 0 8px color-mix(in srgb, var(--theme-primary) 45%, transparent)',
          }}
        />
      ) : null}

      {spacingIndicators.map((indicator, index) => (
        <div
          key={`spacing-${index}`}
          className="spacing-indicator"
          style={{
            position: 'absolute',
            left: indicator.x !== undefined ? indicator.x * zoom + x : undefined,
            top: indicator.y !== undefined ? indicator.y * zoom + y : undefined,
            width: indicator.width !== undefined ? indicator.width * zoom : undefined,
            height: indicator.height !== undefined ? indicator.height * zoom : undefined,
            border: '1px dashed var(--theme-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            opacity: 0.8,
            backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              background: 'var(--theme-primary)',
              color: 'white',
              padding: '1px 4px',
              borderRadius: '2px',
              whiteSpace: 'nowrap',
              transform: 'scale(0.8)',
            }}
          >
            {indicator.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default React.memo(AlignmentGuides);
