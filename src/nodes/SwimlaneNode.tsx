import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { getPluginNodeDefinition } from '../plugins/pluginSystem';
import ResizeHandles from '../components/ResizeHandles';
import { useDiagramCommands } from '../hooks/useDiagramCommands';
import { useNodeData, useNodeEditingState } from '../store/selectors';
import NodeActionToolbar from './NodeActionToolbar';
import { getCategoryColors } from './nodeDesignSystem';
import type { CustomNodeProps } from './types';
import './nodes.css';

const HANDLE_CONFIG = [
  { id: 'top', position: Position.Top, className: 'node-handle node-handle--top' },
  { id: 'right', position: Position.Right, className: 'node-handle node-handle--right' },
  { id: 'bottom', position: Position.Bottom, className: 'node-handle node-handle--bottom' },
  { id: 'left', position: Position.Left, className: 'node-handle node-handle--left' },
] as const;

const SwimlaneNode: React.FC<CustomNodeProps> = ({ id, data, selected }) => {
  const { updateNodeData } = useDiagramCommands();
  const { isSingleNodeSelected, isEditingLabel, setEditingLabel } = useNodeEditingState();
  const nodeData = useNodeData(id) ?? data;
  const definition = useMemo(() => getPluginNodeDefinition('swimlane'), []);
  const [isEditing, setIsEditing] = useState(false);
  const [innerLabel, setInnerLabel] = useState(nodeData.label || 'Swimlane');
  const colors = useMemo(() => getCategoryColors(definition?.category ?? 'Advanced'), [definition]);

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
    setInnerLabel(nodeData.label || 'Swimlane');
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

  const rootClassName = useMemo(
    () => `node-shell node-swimlane${isEditing ? ' is-active' : ''}`,
    [isEditing],
  );

  const nodeStyle = useMemo<React.CSSProperties>(
    () => ({
      width: dimensions.width,
      height: dimensions.height,
      '--node-background': nodeData.color ?? 'var(--theme-node-surface, #f8fafc)',
      '--node-border': colors.border,
      '--node-icon': colors.icon,
      '--node-label-color': '#1e293b',
      '--node-glow': colors.glow,
      '--node-shadow': colors.shadow,
      '--node-shadow-hover': colors.shadowHover,
    } as React.CSSProperties),
    [dimensions.width, dimensions.height, nodeData.color, colors],
  );

  return (
    <div
      className={rootClassName}
      data-node-category={definition?.category ?? 'Advanced'}
      data-node-tone={colors.tone}
      onDoubleClick={onDoubleClick}
      style={nodeStyle}
    >
      {selected && isSingleNodeSelected ? (
        <NodeActionToolbar id={id} type="swimlane" data={nodeData} />
      ) : null}

      {HANDLE_CONFIG.map((handle) => (
        <Handle
          key={handle.id}
          type="source"
          position={handle.position}
          id={handle.id}
          className={handle.className}
        />
      ))}

      <ResizeHandles nodeId={id} nodeType="swimlane" data={nodeData} selected={selected} />

      <div className="node-swimlane__header">
        <span className="node-swimlane__header-label">
          {isEditing ? (
            <input
              value={innerLabel}
              onChange={(event) => setInnerLabel(event.target.value)}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              autoFocus
              className="node-input node-swimlane__input"
              placeholder="Swimlane"
            />
          ) : (
            <span>{nodeData.label || 'Swimlane'}</span>
          )}
        </span>
      </div>
      <div className="node-swimlane__body" />
    </div>
  );
};

SwimlaneNode.displayName = 'swimlaneNode';

export default React.memo(SwimlaneNode);
