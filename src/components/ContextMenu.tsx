import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { getPluginDefaultNodeData, usePluginNodeRegistry } from '../plugins/pluginSystem';
import type { AppNodeType } from '../nodes/types';
import { useDiagramCommands } from '../hooks/useDiagramCommands';
import { useContextMenuNodeType, useContextMenuNodeLocked } from '../store/selectors';
import useUIStore from '../store/useUIStore';
import './ContextMenu.css';

const COLORS = [
  { name: 'Blue', value: '#dbeafe' },
  { name: 'Green', value: '#dcfce7' },
  { name: 'Yellow', value: '#fef9c3' },
  { name: 'Red', value: '#fee2e2' },
  { name: 'Gray', value: '#f3f4f6' },
  { name: 'Reset', value: null },
];

const ContextMenu: React.FC = () => {
  const { contextMenu, closeContextMenu, setSelectedNodeIds } = useUIStore(
    useShallow((state) => ({
      contextMenu: state.contextMenu,
      closeContextMenu: state.closeContextMenu,
      setSelectedNodeIds: state.setSelectedNodeIds,
    })),
  );
  // Only subscribes to the type of the right-clicked node — not the whole
  // nodes array — so ContextMenu does not re-render on unrelated updates.
  const nodeId = contextMenu.open && contextMenu.target === 'node' ? contextMenu.nodeId : null;
  const currentNodeType = useContextMenuNodeType(nodeId);
  const isNodeLocked = useContextMenuNodeLocked(nodeId);
  const {
    duplicateSelection,
    deleteSelection,
    pasteClipboard,
    addNode,
    updateNodeType,
    updateNodeColor,
    toggleNodeLock,
  } = useDiagramCommands();
  const registry = usePluginNodeRegistry();
  const ref = useRef<HTMLDivElement | null>(null);

  const registrySections = useMemo(
    () =>
      registry.map((category) => ({
        title: category.category,
        nodes: category.nodes.map((node) => ({ label: node.label, value: node.type })),
      })),
    [registry],
  );

  useEffect(() => {
    if (!contextMenu.open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        closeContextMenu();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeContextMenu();
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [closeContextMenu, contextMenu.open]);

  const handleDuplicate = useCallback(() => {
    if (!nodeId) return;
    setSelectedNodeIds([nodeId]);
    duplicateSelection();
    closeContextMenu();
  }, [nodeId, setSelectedNodeIds, duplicateSelection, closeContextMenu]);

  const handleDelete = useCallback(() => {
    if (!nodeId) return;
    setSelectedNodeIds([nodeId]);
    deleteSelection();
    closeContextMenu();
  }, [nodeId, setSelectedNodeIds, deleteSelection, closeContextMenu]);

  const handleToggleLock = useCallback(() => {
    if (!nodeId) return;
    toggleNodeLock(nodeId);
    closeContextMenu();
  }, [nodeId, toggleNodeLock, closeContextMenu]);

  const handleTypeChange = useCallback(
    (type: AppNodeType) => {
      if (!nodeId) return;
      updateNodeType(nodeId, type);
      closeContextMenu();
    },
    [nodeId, updateNodeType, closeContextMenu],
  );

  const handleColorChange = useCallback(
    (color: string | null) => {
      if (!nodeId) return;
      updateNodeColor(nodeId, color);
      closeContextMenu();
    },
    [nodeId, updateNodeColor, closeContextMenu],
  );

  const handlePaste = useCallback(() => {
    pasteClipboard({ x: contextMenu.flowX, y: contextMenu.flowY });
    closeContextMenu();
  }, [contextMenu.flowX, contextMenu.flowY, pasteClipboard, closeContextMenu]);

  const handleAddNode = useCallback(
    (type: AppNodeType) => {
      const defaults = getPluginDefaultNodeData(type);
      addNode({
        id: crypto.randomUUID(),
        type,
        position: { x: contextMenu.flowX, y: contextMenu.flowY },
        width: defaults.width,
        height: defaults.height,
        data: defaults,
      });
      closeContextMenu();
    },
    [contextMenu.flowX, contextMenu.flowY, addNode, closeContextMenu],
  );

  if (!contextMenu.open) {
    return null;
  }

  return (
    <div
      ref={ref}
      className="context-menu"
      style={{ left: contextMenu.x, top: contextMenu.y }}
      role="menu"
      aria-label={contextMenu.target === 'node' ? 'Node actions' : 'Canvas actions'}
    >
      {contextMenu.target === 'node' && nodeId ? (
        <>
          <button type="button" role="menuitem" className="context-menu__item" onClick={handleToggleLock}>
            {isNodeLocked ? '🔓 Unlock' : '🔒 Lock'}
          </button>
          <button type="button" role="menuitem" className="context-menu__item" onClick={handleDuplicate}>
            Duplicate
          </button>
          {!isNodeLocked && (
            <button type="button" role="menuitem" className="context-menu__item context-menu__item--danger" onClick={handleDelete}>
              Delete
            </button>
          )}
          <div className="context-menu__section-label" role="separator">Change type</div>
          {registrySections.map((section) => (
            <React.Fragment key={section.title}>
              <div className="context-menu__section-label" role="separator">{section.title}</div>
              <div className="context-menu__row">
                {section.nodes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    role="menuitem"
                    className={`context-menu__chip ${currentNodeType === type.value ? 'is-active' : ''}`}
                    aria-pressed={currentNodeType === type.value}
                    onClick={() => handleTypeChange(type.value)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </React.Fragment>
          ))}
          <div className="context-menu__section-label" role="separator">Change color</div>
          <div className="context-menu__row">
            {COLORS.map((color) => (
              <button
                key={color.name}
                type="button"
                role="menuitem"
                className="context-menu__color"
                style={{ background: color.value ?? 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)' }}
                onClick={() => handleColorChange(color.value)}
                aria-label={`Set node color: ${color.name}`}
                title={color.name}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <button type="button" role="menuitem" className="context-menu__item" onClick={handlePaste}>
            Paste
          </button>
          {registrySections.map((section) => (
            <React.Fragment key={section.title}>
              <div className="context-menu__section-label" role="separator">Add {section.title}</div>
              <div className="context-menu__row">
                {section.nodes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    role="menuitem"
                    className="context-menu__chip"
                    onClick={() => handleAddNode(type.value)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </React.Fragment>
          ))}
        </>
      )}
    </div>
  );
};

export default React.memo(ContextMenu);
