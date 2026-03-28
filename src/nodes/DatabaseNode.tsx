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

const ELLIPSE_RY = 12;

const DatabaseNode: React.FC<CustomNodeProps> = ({ id, data, selected }) => {
  const { updateNodeData } = useDiagramCommands();
  const { isSingleNodeSelected, isEditingLabel, setEditingLabel } = useNodeEditingState();
  const nodeData = useNodeData(id) ?? data;
  const definition = useMemo(() => getPluginNodeDefinition('database'), []);
  const [isEditing, setIsEditing] = useState(false);
  const [innerLabel, setInnerLabel] = useState(nodeData.label || 'Database');
  const colors = useMemo(() => getCategoryColors(definition?.category ?? 'Flowchart'), [definition]);

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
    setInnerLabel(nodeData.label || 'Database');
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

  const w = nodeData.width ?? 170;
  const h = nodeData.height ?? 86;

  const svgPath = useMemo(() => {
    const ry = ELLIPSE_RY;
    return [
      `M 0 ${ry}`,
      `A ${w / 2} ${ry} 0 0 1 ${w} ${ry}`,
      `L ${w} ${h - ry}`,
      `A ${w / 2} ${ry} 0 0 1 0 ${h - ry}`,
      `Z`,
    ].join(' ');
  }, [w, h]);

  const topEllipse = useMemo(() => {
    const ry = ELLIPSE_RY;
    return [
      `M 0 ${ry}`,
      `A ${w / 2} ${ry} 0 0 1 ${w} ${ry}`,
      `A ${w / 2} ${ry} 0 0 1 0 ${ry}`,
    ].join(' ');
  }, [w]);

  const rootClassName = useMemo(
    () => `node-shell node-database-svg${isEditing ? ' is-active' : ''}`,
    [isEditing],
  );

  const nodeStyle = useMemo<React.CSSProperties>(
    () => ({
      width: w,
      height: h,
      '--node-background': nodeData.color ?? 'var(--theme-node-surface, #eff6ff)',
      '--node-border': colors.border,
      '--node-icon': colors.icon,
      '--node-label-color': 'var(--theme-node-label)',
      '--node-glow': colors.glow,
      '--node-shadow': colors.shadow,
      '--node-shadow-hover': colors.shadowHover,
    } as React.CSSProperties),
    [w, h, nodeData.color, colors],
  );

  return (
    <div
      className={rootClassName}
      data-node-category={definition?.category ?? 'Flowchart'}
      data-node-tone={colors.tone}
      onDoubleClick={onDoubleClick}
      style={nodeStyle}
    >
      <svg
        className="node-database-svg__shape"
        viewBox={`0 0 ${w} ${h}`}
        width={w}
        height={h}
        preserveAspectRatio="none"
      >
        <path
          d={svgPath}
          fill="var(--node-background)"
          stroke="var(--node-border)"
          strokeWidth="1"
        />
        <path
          d={topEllipse}
          fill="var(--node-background)"
          stroke="var(--node-border)"
          strokeWidth="1"
        />
      </svg>

      {selected && isSingleNodeSelected ? (
        <NodeActionToolbar id={id} type="database" data={nodeData} />
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

      <ResizeHandles nodeId={id} nodeType="database" data={nodeData} selected={selected} />

      <div className="node-database-svg__body">
        <span className="node-shell__icon" aria-hidden="true">
          {definition?.icon ?? null}
        </span>
        <div className="node-shell__content">
          {isEditing ? (
            <input
              value={innerLabel}
              onChange={(event) => setInnerLabel(event.target.value)}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
              autoFocus
              className="node-input"
              placeholder="Database"
            />
          ) : (
            <div className="node-label">{nodeData.label || 'Database'}</div>
          )}
        </div>
      </div>
    </div>
  );
};

DatabaseNode.displayName = 'databaseNode';

export default React.memo(DatabaseNode);
