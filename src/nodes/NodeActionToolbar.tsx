import React, { useCallback, useRef, useState, useEffect } from 'react';
import { NodeToolbar, Position } from 'reactflow';
import type { AppNodeType, NodeData } from './types';
import { useDiagramCommands } from '../hooks/useDiagramCommands';
import useUIStore from '../store/useUIStore';
import NodeTypeDropdown from './NodeTypeDropdown';
import '../components/ContextToolbar.css';

const ACCEPTED_MIME = 'image/png,image/jpeg,image/svg+xml,image/webp';

interface NodeActionToolbarProps {
  id: string;
  type: AppNodeType;
  data: NodeData;
}

const COLORS = [
  { name: 'Reset', value: null, hex: 'transparent' },
  { name: 'Blue', value: '#dbeafe', hex: '#6366f1' },
  { name: 'Green', value: '#dcfce7', hex: '#22c55e' },
  { name: 'Yellow', value: '#fef9c3', hex: '#eab308' },
  { name: 'Red', value: '#fee2e2', hex: '#ef4444' },
  { name: 'Gray', value: '#f3f4f6', hex: '#94a3b8' },
];

// Style objects depend only on the static COLORS array, so compute them once
// at module load instead of allocating 6 new objects on every toolbar render.
const COLOR_BUTTON_STYLES: React.CSSProperties[] = COLORS.map((c) => ({
  backgroundColor: c.hex,
  opacity: c.value === null ? 0.3 : 1,
  border: c.value === null ? '1px dashed #666' : '2px solid white',
}));

const NodeActionToolbar: React.FC<NodeActionToolbarProps> = ({ id, type, data }) => {
  const setSelectedNodeIds = useUIStore((state) => state.setSelectedNodeIds);
  const {
    deleteSelection,
    duplicateSelection,
    updateNodeColor,
    updateNodeType,
    updateNodeData,
    toggleNodeLock,
  } = useDiagramCommands();

  const [label, setLabel] = useState(data.label || '');
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setLabel(data.label || '');
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [data.label]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeIds([id]);
    deleteSelection();
  }, [deleteSelection, id, setSelectedNodeIds]);

  const handleDuplicate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeIds([id]);
    duplicateSelection();
  }, [duplicateSelection, id, setSelectedNodeIds]);

  const handleColorChange = useCallback((color: string | null) => {
    updateNodeColor(id, color);
  }, [id, updateNodeColor]);

  const handleTypeChange = useCallback((newType: AppNodeType) => {
    updateNodeType(id, newType);
  }, [id, updateNodeType]);

  const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
  }, []);

  const handleLabelBlur = useCallback(() => {
    if (label !== data.label) {
      updateNodeData(id, { label });
    }
  }, [id, label, data.label, updateNodeData]);

  // ── Image-specific handlers ──────────────────────────────────
  const handleToggleAspectRatio = useCallback(() => {
    const locked = !data.aspectRatioLocked;
    updateNodeData(id, { aspectRatioLocked: locked });
  }, [id, data.aspectRatioLocked, updateNodeData]);

  const handleChangeImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    imageFileInputRef.current?.click();
  }, []);

  const handleImageFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        updateNodeData(id, { imageUrl: ev.target?.result as string, imageAlt: file.name });
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [id, updateNodeData],
  );

  // ── Lock handler ─────────────────────────────────────────────
  const handleToggleLock = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNodeLock(id);
  }, [id, toggleNodeLock]);

  // ── Locked-only toolbar: just show the unlock button ──────────
  if (data.locked) {
    return (
      <NodeToolbar
        isVisible
        position={Position.Top}
        offset={15}
        className="node-context-toolbar"
      >
        <button
          className="toolbar-btn toolbar-btn--active"
          onClick={handleToggleLock}
          title="Unlock node"
        >
          {/* Lock-closed icon */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </button>
      </NodeToolbar>
    );
  }

  return (
    <NodeToolbar
      isVisible
      position={Position.Top}
      offset={15}
      className="node-context-toolbar"
    >
      <div className="toolbar-group">
        {COLORS.map((c, i) => (
          <button
            key={c.name}
            className={`color-picker-btn ${data.color === c.value ? 'active' : ''}`}
            style={COLOR_BUTTON_STYLES[i]}
            onClick={() => handleColorChange(c.value)}
            title={c.name}
          />
        ))}
      </div>

      <div className="toolbar-divider" />

      <NodeTypeDropdown value={type} onChange={handleTypeChange} />

      <div className="toolbar-divider" />

      <input
        className="toolbar-input"
        value={label}
        onChange={handleLabelChange}
        onBlur={handleLabelBlur}
        placeholder="Edit label..."
        onClick={(e) => e.stopPropagation()}
      />

      <div className="toolbar-divider" />

      {type === 'image' && (
        <>
          <input
            ref={imageFileInputRef}
            type="file"
            accept={ACCEPTED_MIME}
            onChange={handleImageFileChange}
            style={{ display: 'none' }}
            tabIndex={-1}
          />
          <div className="toolbar-group">
            <button
              className={`toolbar-btn${data.aspectRatioLocked ? ' toolbar-btn--active' : ''}`}
              onClick={handleToggleAspectRatio}
              title={data.aspectRatioLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
            >
              {data.aspectRatioLocked ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                </svg>
              )}
            </button>
            <button
              className="toolbar-btn"
              onClick={handleChangeImage}
              title="Change image"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>
          </div>
          <div className="toolbar-divider" />
        </>
      )}

      <div className="toolbar-group">
        {/* Lock toggle */}
        <button
          className="toolbar-btn"
          onClick={handleToggleLock}
          title="Lock node"
        >
          {/* Lock-open icon */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
          </svg>
        </button>

        <button className="toolbar-btn" onClick={handleDuplicate} title="Duplicate">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
        </button>
        <button className="toolbar-btn danger" onClick={handleDelete} title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
        </button>
      </div>
    </NodeToolbar>
  );
};

export default React.memo(NodeActionToolbar);
