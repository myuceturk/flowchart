import React, { useCallback, useState, useEffect, useRef } from 'react';
import { EdgeLabelRenderer, useStore as useRFStore } from 'reactflow';
import { useDiagramCommands } from '../hooks/useDiagramCommands';
import { useEdgeEditingState } from '../store/selectors';
import type { EdgeData, EdgePathType, EdgeLineType, EdgeArrowType } from './types';
import '../components/ContextToolbar.css';

interface EdgeActionToolbarProps {
  id: string;
  data?: EdgeData;
  labelX: number;
  labelY: number;
}

// ── Static config arrays (module-level, allocated once) ────────────────────

type PathOption = { value: EdgePathType; title: string; icon: React.ReactNode };
type LineOption = { value: EdgeLineType; title: string; icon: React.ReactNode };
type ArrowOption = { value: EdgeArrowType; title: string; icon: React.ReactNode };

const PATH_OPTIONS: PathOption[] = [
  {
    value: 'bezier',
    title: 'Bezier curve',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M2 14 C4 2, 14 2, 16 14" />
      </svg>
    ),
  },
  {
    value: 'straight',
    title: 'Straight line',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="2" y1="16" x2="16" y2="2" />
      </svg>
    ),
  },
  {
    value: 'step',
    title: 'Step (sharp)',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polyline points="2,14 2,4 9,4 9,14 16,14" />
      </svg>
    ),
  },
  {
    value: 'smoothstep',
    title: 'Step (rounded)',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M2 14 L2 8 Q2 4 6 4 L12 4 Q16 4 16 8 L16 14" />
      </svg>
    ),
  },
];

const LINE_OPTIONS: LineOption[] = [
  {
    value: 'solid',
    title: 'Solid',
    icon: (
      <svg viewBox="0 0 18 8" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="1" y1="4" x2="17" y2="4" />
      </svg>
    ),
  },
  {
    value: 'dashed',
    title: 'Dashed',
    icon: (
      <svg viewBox="0 0 18 8" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2">
        <line x1="1" y1="4" x2="17" y2="4" />
      </svg>
    ),
  },
  {
    value: 'dotted',
    title: 'Dotted',
    icon: (
      <svg viewBox="0 0 18 8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="1 3" strokeLinecap="round">
        <line x1="1" y1="4" x2="17" y2="4" />
      </svg>
    ),
  },
];

const ARROW_OPTIONS: ArrowOption[] = [
  {
    value: 'arrow',
    title: 'Arrow',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="2" y1="9" x2="14" y2="9" />
        <polyline points="10,5 14,9 10,13" />
      </svg>
    ),
  },
  {
    value: 'none',
    title: 'No arrow',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="2" y1="9" x2="16" y2="9" />
      </svg>
    ),
  },
  {
    value: 'circle',
    title: 'Circle',
    icon: (
      <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <line x1="2" y1="9" x2="11" y2="9" />
        <circle cx="14" cy="9" r="3" />
      </svg>
    ),
  },
];

// ── Component ──────────────────────────────────────────────────────────────

const EdgeActionToolbar: React.FC<EdgeActionToolbarProps> = ({ id, data, labelX, labelY }) => {
  const { isSingleEdgeSelected, isEditingLabel, setEditingLabel, setSelectedEdgeIds } =
    useEdgeEditingState();
  const { deleteSelection, updateEdgeData, updateEdgeStyle } = useDiagramCommands();
  const inputRef = useRef<HTMLInputElement>(null);

  const isSelected = useRFStore(useCallback((s) => s.edges.find((e) => e.id === id)?.selected, [id]));

  const [label, setLabel] = useState(data?.label || '');

  useEffect(() => {
    if (isEditingLabel && isSelected && isSingleEdgeSelected) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
        setEditingLabel(false);
      }, 0);
    }
  }, [isEditingLabel, isSelected, isSingleEdgeSelected, setEditingLabel]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setLabel(data?.label || '');
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [data?.label]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEdgeIds([id]);
    deleteSelection();
  }, [deleteSelection, id, setSelectedEdgeIds]);

  const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
  }, []);

  const handleLabelBlur = useCallback(() => {
    if (label !== data?.label) {
      updateEdgeData(id, label);
    }
  }, [id, label, data?.label, updateEdgeData]);

  const handlePathType = useCallback((pathType: EdgePathType) => {
    updateEdgeStyle(id, { pathType });
  }, [id, updateEdgeStyle]);

  const handleLineType = useCallback((lineType: EdgeLineType) => {
    updateEdgeStyle(id, { lineType });
  }, [id, updateEdgeStyle]);

  const handleArrowType = useCallback((arrowType: EdgeArrowType) => {
    updateEdgeStyle(id, { arrowType });
  }, [id, updateEdgeStyle]);

  if (!isSelected || !isSingleEdgeSelected) return null;

  const activePath = data?.pathType ?? 'bezier';
  const activeLine = data?.lineType ?? 'solid';
  const activeArrow = data?.arrowType ?? 'arrow';

  return (
    <EdgeLabelRenderer>
      <div
        style={{
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 48}px)`,
          pointerEvents: 'all',
          zIndex: 1001,
        }}
        className="nodrag nopan edge-context-toolbar"
      >
        {/* Path shape */}
        <div className="toolbar-group">
          {PATH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`toolbar-btn edge-style-btn${activePath === opt.value ? ' toolbar-btn--active' : ''}`}
              onClick={() => handlePathType(opt.value)}
              title={opt.title}
            >
              {opt.icon}
            </button>
          ))}
        </div>

        <div className="toolbar-divider" />

        {/* Line type */}
        <div className="toolbar-group">
          {LINE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`toolbar-btn edge-style-btn${activeLine === opt.value ? ' toolbar-btn--active' : ''}`}
              onClick={() => handleLineType(opt.value)}
              title={opt.title}
            >
              {opt.icon}
            </button>
          ))}
        </div>

        <div className="toolbar-divider" />

        {/* Arrow type */}
        <div className="toolbar-group">
          {ARROW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`toolbar-btn edge-style-btn${activeArrow === opt.value ? ' toolbar-btn--active' : ''}`}
              onClick={() => handleArrowType(opt.value)}
              title={opt.title}
            >
              {opt.icon}
            </button>
          ))}
        </div>

        <div className="toolbar-divider" />

        {/* Label + delete */}
        <div className="toolbar-group">
          <input
            ref={inputRef}
            className="toolbar-input"
            value={label}
            onChange={handleLabelChange}
            onBlur={handleLabelBlur}
            placeholder="Edge label..."
            onClick={(e) => e.stopPropagation()}
            style={{ width: '80px' }}
          />
          <div className="toolbar-divider" />
          <button className="toolbar-btn danger" onClick={handleDelete} title="Delete Edge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </EdgeLabelRenderer>
  );
};

export default React.memo(EdgeActionToolbar);
