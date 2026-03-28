import React, { useCallback, useState, useEffect, useRef } from 'react';
import { EdgeLabelRenderer, useStore as useRFStore } from 'reactflow';
import { useShallow } from 'zustand/react/shallow';
import { useDiagramCommands } from '../hooks/useDiagramCommands';
import useUIStore from '../store/useUIStore';
import '../components/ContextToolbar.css';

interface EdgeActionToolbarProps {
  id: string;
  data?: { label?: string };
  labelX: number;
  labelY: number;
}

const EdgeActionToolbar: React.FC<EdgeActionToolbarProps> = ({ id, data, labelX, labelY }) => {
  const {
    setSelectedEdgeIds,
    isEditingLabel,
    setEditingLabel,
    selectedNodeIds,
    selectedEdgeIds,
  } = useUIStore(
    useShallow((state) => ({
      setSelectedEdgeIds: state.setSelectedEdgeIds,
      isEditingLabel: state.isEditingLabel,
      setEditingLabel: state.setEditingLabel,
      selectedNodeIds: state.selectedNodeIds,
      selectedEdgeIds: state.selectedEdgeIds,
    })),
  );
  const { deleteSelection, updateEdgeData } = useDiagramCommands();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // To detect if the edge is selected, we need to check RF state
  const isSelected = useRFStore(useCallback((s) => s.edges.find((e) => e.id === id)?.selected, [id]));

  const isSingleEdgeSelected = selectedEdgeIds.length === 1 && selectedNodeIds.length === 0;

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

  if (!isSelected || !isSingleEdgeSelected) return null;

  return (
    <EdgeLabelRenderer>
      <div
        style={{
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 40}px)`,
          pointerEvents: 'all',
          zIndex: 1001,
        }}
        className="nodrag nopan edge-context-toolbar"
      >
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
          </button>
        </div>
      </div>
    </EdgeLabelRenderer>
  );
};

export default React.memo(EdgeActionToolbar);
