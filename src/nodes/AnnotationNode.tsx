import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getPluginNodeDefinition } from '../plugins/pluginSystem';
import ResizeHandles from '../components/ResizeHandles';
import { useDiagramCommands } from '../hooks/useDiagramCommands';
import { useNodeData, useNodeEditingState } from '../store/selectors';
import NodeActionToolbar from './NodeActionToolbar';
import NodeBase from './NodeBase';
import type { CustomNodeProps } from './types';
import './nodes.css';

const AnnotationNode: React.FC<CustomNodeProps> = ({ id, data, selected }) => {
  const { updateNodeData } = useDiagramCommands();
  const { isSingleNodeSelected, isEditingLabel, setEditingLabel } = useNodeEditingState();
  const nodeData = useNodeData(id) ?? data;
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
