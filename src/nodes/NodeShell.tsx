import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { getPluginNodeDefinition } from '../plugins/pluginSystem';
import ResizeHandles from '../components/ResizeHandles';
import { useDiagramCommands } from '../hooks/useDiagramCommands';
import { useNodeData, useNodeEditingState } from '../store/selectors';
import NodeActionToolbar from './NodeActionToolbar';
import NodeBase from './NodeBase';
import type { AppNodeType, CustomNodeProps } from './types';
import './nodes.css';

type NodeShellProps = CustomNodeProps & {
  nodeType: AppNodeType;
  className: string;
  labelPlaceholder: string;
  contentClassName?: string;
};

const HANDLE_CONFIG = [
  { id: 'top', position: Position.Top, className: 'node-handle node-handle--top' },
  { id: 'right', position: Position.Right, className: 'node-handle node-handle--right' },
  { id: 'bottom', position: Position.Bottom, className: 'node-handle node-handle--bottom' },
  { id: 'left', position: Position.Left, className: 'node-handle node-handle--left' },
] as const;

const NodeShell: React.FC<NodeShellProps> = ({
  id,
  data,
  selected,
  nodeType,
  className,
  labelPlaceholder,
  contentClassName,
}) => {
  const { updateNodeData } = useDiagramCommands();
  const { isSingleNodeSelected, isEditingLabel, setEditingLabel } = useNodeEditingState();
  const nodeData = useNodeData(id) ?? data;
  const definition = getPluginNodeDefinition(nodeType);
  const [isEditing, setIsEditing] = useState(false);
  const [innerLabel, setInnerLabel] = useState(nodeData.label || labelPlaceholder);

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
    setInnerLabel(nodeData.label || labelPlaceholder);
    setIsEditing(true);
  }, [labelPlaceholder, nodeData.label, setInnerLabel, setIsEditing]);

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
    () => ({
      width: nodeData.width,
      height: nodeData.height,
    }),
    [nodeData.height, nodeData.width],
  );

  return (
    <NodeBase
      category={definition?.category ?? 'Flowchart'}
      icon={definition?.icon ?? null}
      className={className}
      backgroundOverride={nodeData.color}
      width={dimensions.width}
      height={dimensions.height}
      isActive={isEditing}
      onDoubleClick={onDoubleClick}
      overlay={
        <>
          {selected && isSingleNodeSelected ? <NodeActionToolbar id={id} type={nodeType} data={nodeData} /> : null}

          {HANDLE_CONFIG.map((handle) => (
            <Handle
              key={handle.id}
              type="source"
              position={handle.position}
              id={handle.id}
              className={handle.className}
            />
          ))}

          <ResizeHandles nodeId={id} nodeType={nodeType} data={nodeData} selected={selected} />
        </>
      }
    >
      <div className={contentClassName ?? 'node-shell__content'}>
        {isEditing ? (
          <input
            value={innerLabel}
            onChange={(event) => setInnerLabel(event.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            autoFocus
            className="node-input"
            placeholder={labelPlaceholder}
          />
        ) : (
          <div className="node-label">{nodeData.label || labelPlaceholder}</div>
        )}
      </div>
    </NodeBase>
  );
};

export default React.memo(NodeShell);
