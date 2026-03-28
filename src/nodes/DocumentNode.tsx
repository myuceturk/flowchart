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

const WAVE_HEIGHT = 14;

const DocumentNode: React.FC<CustomNodeProps> = ({ id, data, selected }) => {
  const { updateNodeData } = useDiagramCommands();
  const { isSingleNodeSelected, isEditingLabel, setEditingLabel } = useNodeEditingState();
  const nodeData = useNodeData(id) ?? data;
  const definition = useMemo(() => getPluginNodeDefinition('document'), []);
  const [isEditing, setIsEditing] = useState(false);
  const [innerLabel, setInnerLabel] = useState(nodeData.label || 'Document');
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
    setInnerLabel(nodeData.label || 'Document');
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

  const w = nodeData.width ?? 172;
  const h = nodeData.height ?? 84;

  const svgPath = useMemo(() => {
    const waveY = h - WAVE_HEIGHT;
    return [
      `M 0 0`,
      `L ${w} 0`,
      `L ${w} ${waveY}`,
      `C ${w * 0.75} ${waveY + WAVE_HEIGHT * 2}, ${w * 0.25} ${waveY - WAVE_HEIGHT}, 0 ${waveY}`,
      `Z`,
    ].join(' ');
  }, [w, h]);

  const rootClassName = useMemo(
    () => `node-shell node-document-svg${isEditing ? ' is-active' : ''}`,
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
        className="node-document-svg__shape"
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
      </svg>

      {selected && isSingleNodeSelected ? (
        <NodeActionToolbar id={id} type="document" data={nodeData} />
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

      <ResizeHandles nodeId={id} nodeType="document" data={nodeData} selected={selected} />

      <div className="node-document-svg__body">
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
              placeholder="Document"
            />
          ) : (
            <div className="node-label">{nodeData.label || 'Document'}</div>
          )}
        </div>
      </div>
    </div>
  );
};

DocumentNode.displayName = 'documentNode';

export default React.memo(DocumentNode);
