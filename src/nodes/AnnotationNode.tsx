import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { getPluginNodeDefinition } from '../plugins/pluginSystem';
import ResizeHandles from '../components/ResizeHandles';
import { useDiagramCommands } from '../hooks/useDiagramCommands';
import NodeActionToolbar from './NodeActionToolbar';
import NodeBase from './NodeBase';
import type { CustomNodeProps } from './types';
import useDiagramStore from '../store/useDiagramStore';
import useUIStore from '../store/useUIStore';
import './nodes.css';

const AnnotationNode: React.FC<CustomNodeProps> = ({ id, data, selected }) => {
  const { updateNodeData } = useDiagramCommands();
  const {
    selectedNodeIds,
    selectedEdgeIds,
    isEditingLabel,
    setEditingLabel,
  } = useUIStore(useShallow((state) => ({
    selectedNodeIds: state.selectedNodeIds,
    selectedEdgeIds: state.selectedEdgeIds,
    isEditingLabel: state.isEditingLabel,
    setEditingLabel: state.setEditingLabel,
  })));
  const nodeData = useDiagramStore((state) => state.nodes.find((node) => node.id === id)?.data) ?? data;
  const isSingleNodeSelected = selectedNodeIds.length === 1 && selectedEdgeIds.length === 0;
  const definition = getPluginNodeDefinition('annotation');
  const [isEditing, setIsEditing] = useState(false);
  const [innerLabel, setInnerLabel] = useState(nodeData.label || 'Note');

  useEffect(() => {
    if (isEditingLabel && selected) {
      const frameId = window.requestAnimationFrame(() => {
        setIsEditing(true);
      });
      setEditingLabel(false);
      return () => window.cancelAnimationFrame(frameId);
    }
  }, [isEditingLabel, selected, setEditingLabel]);

  const onDoubleClick = useCallback(() => {
    setInnerLabel(nodeData.label || 'Note');
    setIsEditing(true);
  }, [nodeData.label, setInnerLabel, setIsEditing]);

  const onBlur = useCallback(() => {
    setIsEditing(false);
    if (innerLabel !== nodeData.label) {
      updateNodeData(id, { label: innerLabel });
    }
  }, [id, innerLabel, nodeData.label, setIsEditing, updateNodeData]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        onBlur();
      }
    },
    [onBlur],
  );

  const dimensions = useMemo(
    () => ({ width: nodeData.width, height: nodeData.height }),
    [nodeData.height, nodeData.width],
  );

  return (
    <NodeBase
      category={definition?.category ?? 'Content'}
      icon={definition?.icon ?? null}
      className="node-annotation"
      backgroundOverride={nodeData.color ?? '#fef3c7'}
      width={dimensions.width}
      height={dimensions.height}
      isActive={isEditing}
      onDoubleClick={onDoubleClick}
      overlay={
        <>
          {selected && isSingleNodeSelected ? (
            <NodeActionToolbar id={id} type="annotation" data={nodeData} />
          ) : null}
          <ResizeHandles nodeId={id} nodeType="annotation" data={nodeData} selected={selected} />
          <div className="node-annotation__fold" />
        </>
      }
    >
      <div className="node-shell__content">
        {isEditing ? (
          <input
            value={innerLabel}
            onChange={(event) => setInnerLabel(event.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            autoFocus
            className="node-input"
            placeholder="Note"
          />
        ) : (
          <div className="node-label">{nodeData.label || 'Note'}</div>
        )}
      </div>
    </NodeBase>
  );
};

AnnotationNode.displayName = 'annotationNode';

export default React.memo(AnnotationNode);
