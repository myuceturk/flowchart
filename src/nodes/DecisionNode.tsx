import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';
import { useShallow } from 'zustand/react/shallow';
import { getPluginNodeDefinition } from '../plugins/pluginSystem';
import ResizeHandles from '../components/ResizeHandles';
import { useDiagramCommands } from '../hooks/useDiagramCommands';
import NodeActionToolbar from './NodeActionToolbar';
import NodeBase from './NodeBase';
import {
  DECISION_SOURCE_HANDLES,
  DECISION_TARGET_HANDLES,
} from './decisionHandles';
import type { CustomNodeProps } from './types';
import useDiagramStore from '../store/useDiagramStore';
import useUIStore from '../store/useUIStore';
import './nodes.css';

type DecisionHandleHintProps = {
  className: string;
  tone: 'in' | 'out';
  label: string;
};

const DecisionHandleHint: React.FC<DecisionHandleHintProps> = ({ className, tone, label }) => (
  <span className={`decision-hint ${className} decision-hint--${tone}`}>
    {label}
  </span>
);

const DecisionNode: React.FC<CustomNodeProps> = ({ id, data, selected }) => {
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
  const definition = getPluginNodeDefinition('decision');
  const updateNodeInternals = useUpdateNodeInternals();
  const [isEditing, setIsEditing] = useState(false);
  const [innerLabel, setInnerLabel] = useState(nodeData.label || 'Decision');

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, nodeData.height, nodeData.width, updateNodeInternals]);

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
    setInnerLabel(nodeData.label || 'Decision');
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
      className="node-decision"
      backgroundOverride={nodeData.color}
      width={dimensions.width}
      height={dimensions.height}
      isActive={isEditing}
      onDoubleClick={onDoubleClick}
      overlay={
        <>
          {selected && isSingleNodeSelected ? <NodeActionToolbar id={id} type="decision" data={nodeData} /> : null}

          <Handle
            type="target"
            position={Position.Top}
            id={DECISION_TARGET_HANDLES.top}
            isConnectableStart={false}
            isConnectableEnd
            className="node-handle node-handle--top node-handle--in"
            title="IN"
            aria-label="Decision input handle"
          />
          <DecisionHandleHint className="decision-hint--top" tone="in" label="IN" />
          <Handle
            type="source"
            position={Position.Right}
            id={DECISION_SOURCE_HANDLES.yes}
            isConnectableStart
            isConnectableEnd
            className="node-handle node-handle--right node-handle--out"
            title="YES OUT"
            aria-label="Decision YES output handle"
          />
          <DecisionHandleHint className="decision-hint--right" tone="out" label="YES" />
          <Handle
            type="source"
            position={Position.Bottom}
            id={DECISION_SOURCE_HANDLES.no}
            isConnectableStart
            isConnectableEnd
            className="node-handle node-handle--bottom node-handle--out"
            title="NO OUT"
            aria-label="Decision NO output handle"
          />
          <DecisionHandleHint className="decision-hint--bottom" tone="out" label="NO" />
          <Handle
            type="target"
            position={Position.Left}
            id={DECISION_TARGET_HANDLES.left}
            isConnectableStart={false}
            isConnectableEnd
            className="node-handle node-handle--left node-handle--in"
            title="IN"
            aria-label="Decision input handle"
          />
          <DecisionHandleHint className="decision-hint--left" tone="in" label="IN" />

          <ResizeHandles nodeId={id} nodeType="decision" data={nodeData} selected={selected} />
        </>
      }
    >
      <div className="node-decision-content">
        {isEditing ? (
          <input
            value={innerLabel}
            onChange={(event) => setInnerLabel(event.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            autoFocus
            className="node-input"
            placeholder="Decision"
          />
        ) : (
          <div className="node-label">{nodeData.label || 'Decision'}</div>
        )}
      </div>
    </NodeBase>
  );
};

DecisionNode.displayName = 'decisionNode';

export default React.memo(DecisionNode);
