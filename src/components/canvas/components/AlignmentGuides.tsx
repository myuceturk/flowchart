import React from 'react';
import { useViewport } from 'reactflow';

type AlignmentGuidesProps = {
  vertical: number | null;
  horizontal: number | null;
};

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 10,
};

const AlignmentGuides: React.FC<AlignmentGuidesProps> = ({ vertical, horizontal }) => {
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
    </div>
  );
};

export default React.memo(AlignmentGuides);
