import React from 'react';
import { Panel } from 'reactflow';
import { useShallow } from 'zustand/react/shallow';
import { useDiagramCommands } from '../hooks/useDiagramCommands';
import useUIStore from '../store/useUIStore';
import type { AlignmentDirection } from '../types';
import './SelectionToolbar.css';

const SelectionToolbar: React.FC = () => {
  const { selectedNodeIds, selectedEdgeIds } = useUIStore(
    useShallow((state) => ({
      selectedNodeIds: state.selectedNodeIds,
      selectedEdgeIds: state.selectedEdgeIds,
    })),
  );
  const { deleteSelection, alignNodes } = useDiagramCommands();
  const alignSelectedNodes = React.useCallback(
    (direction: AlignmentDirection) => {
      alignNodes(selectedNodeIds, direction);
    },
    [alignNodes, selectedNodeIds],
  );

  const totalCount = selectedNodeIds.length + selectedEdgeIds.length;

  if (totalCount < 2) {
    return null;
  }

  return (
    <Panel position="top-center" className="selection-toolbar-hint">
      <div className="hint-container">
        <div className="hint-info">
          <span className="count">{totalCount}</span>
          <span className="label">{totalCount === 1 ? 'item' : 'items'} selected</span>
        </div>

        {selectedNodeIds.length >= 2 ? (
          <>
            <div className="hint-divider" />
            <div className="hint-actions">
              <button className="hint-btn" onClick={() => alignSelectedNodes('left')}>Left</button>
              <button className="hint-btn" onClick={() => alignSelectedNodes('center')}>Center</button>
              <button className="hint-btn" onClick={() => alignSelectedNodes('right')}>Right</button>
              <button className="hint-btn" onClick={() => alignSelectedNodes('top')}>Top</button>
              <button className="hint-btn" onClick={() => alignSelectedNodes('middle')}>Middle</button>
              <button className="hint-btn" onClick={() => alignSelectedNodes('bottom')}>Bottom</button>
              <button className="hint-btn" onClick={() => alignSelectedNodes('distributeHorizontal')}>Distribute X</button>
              <button className="hint-btn" onClick={() => alignSelectedNodes('distributeVertical')}>Distribute Y</button>
            </div>
          </>
        ) : null}

        <div className="hint-divider" />

        <div className="hint-actions">
          <button className="hint-btn danger" onClick={deleteSelection}>
            Delete
          </button>
        </div>
      </div>
    </Panel>
  );
};

export default React.memo(SelectionToolbar);
