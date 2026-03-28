import React, { useCallback, useState, useEffect } from 'react';
import { NodeToolbar, Position } from 'reactflow';
import type { AppNodeType, NodeData } from './types';
import { useDiagramCommands } from '../hooks/useDiagramCommands';
import useUIStore from '../store/useUIStore';
import NodeTypeDropdown from './NodeTypeDropdown';
import '../components/ContextToolbar.css';

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

const NodeActionToolbar: React.FC<NodeActionToolbarProps> = ({ id, type, data }) => {
  const setSelectedNodeIds = useUIStore((state) => state.setSelectedNodeIds);
  const {
    deleteSelection,
    duplicateSelection,
    updateNodeColor,
    updateNodeType,
    updateNodeData,
  } = useDiagramCommands();

  const [label, setLabel] = useState(data.label || '');

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

  return (
    <NodeToolbar
      isVisible
      position={Position.Top}
      offset={15}
      className="node-context-toolbar"
    >
      <div className="toolbar-group">
        {COLORS.map((c) => (
          <button
            key={c.name}
            className={`color-picker-btn ${data.color === c.value ? 'active' : ''}`}
            style={{
              backgroundColor: c.hex,
              opacity: c.value === null ? 0.3 : 1,
              border: c.value === null ? '1px dashed #666' : '2px solid white'
            }}
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

      <div className="toolbar-group">
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
