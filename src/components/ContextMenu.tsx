import React, { useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { getPluginDefaultNodeData, usePluginNodeRegistry } from '../plugins/pluginSystem';
import type { AppNodeType } from '../nodes/types';
import { useDiagramCommands } from '../hooks/useDiagramCommands';
import useDiagramStore from '../store/useDiagramStore';
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
  const nodes = useDiagramStore((state) => state.nodes);
  const { contextMenu, closeContextMenu, setSelectedNodeIds } = useUIStore(
    useShallow((state) => ({
      contextMenu: state.contextMenu,
      closeContextMenu: state.closeContextMenu,
      setSelectedNodeIds: state.setSelectedNodeIds,
    })),
  );
  const {
    duplicateSelection,
    deleteSelection,
    pasteClipboard,
    addNode,
    updateNodeType,
    updateNodeColor,
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

  if (!contextMenu.open) {
    return null;
  }

  const currentNode =
    contextMenu.target === 'node' && contextMenu.nodeId
      ? nodes.find((node) => node.id === contextMenu.nodeId)
      : null;

  const handleDuplicate = () => {
    if (!currentNode) {
      return;
    }

    setSelectedNodeIds([currentNode.id]);
    duplicateSelection();
    closeContextMenu();
  };

  const handleDelete = () => {
    if (!currentNode) {
      return;
    }

    setSelectedNodeIds([currentNode.id]);
    deleteSelection();
    closeContextMenu();
  };

  const handleTypeChange = (type: AppNodeType) => {
    if (!currentNode) {
      return;
    }

    updateNodeType(currentNode.id, type);
    closeContextMenu();
  };

  const handleColorChange = (color: string | null) => {
    if (!currentNode) {
      return;
    }

    updateNodeColor(currentNode.id, color);
    closeContextMenu();
  };

  const handlePaste = () => {
    pasteClipboard({ x: contextMenu.flowX, y: contextMenu.flowY });
    closeContextMenu();
  };

  const handleAddNode = (type: AppNodeType) => {
    const defaults = getPluginDefaultNodeData(type);
    addNode({
      id: crypto.randomUUID(),
      type,
      position: {
        x: contextMenu.flowX,
        y: contextMenu.flowY,
      },
      width: defaults.width,
      height: defaults.height,
      data: defaults,
    });
    closeContextMenu();
  };

  return (
    <div
      ref={ref}
      className="context-menu"
      style={{ left: contextMenu.x, top: contextMenu.y }}
    >
      {contextMenu.target === 'node' && currentNode ? (
        <>
          <button type="button" className="context-menu__item" onClick={handleDuplicate}>
            Duplicate
          </button>
          <button type="button" className="context-menu__item context-menu__item--danger" onClick={handleDelete}>
            Delete
          </button>
          <div className="context-menu__section-label">Change type</div>
          {registrySections.map((section) => (
            <React.Fragment key={section.title}>
              <div className="context-menu__section-label">{section.title}</div>
              <div className="context-menu__row">
                {section.nodes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    className={`context-menu__chip ${currentNode.type === type.value ? 'is-active' : ''}`}
                    onClick={() => handleTypeChange(type.value)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </React.Fragment>
          ))}
          <div className="context-menu__section-label">Change color</div>
          <div className="context-menu__row">
            {COLORS.map((color) => (
              <button
                key={color.name}
                type="button"
                className="context-menu__color"
                style={{ background: color.value ?? 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)' }}
                onClick={() => handleColorChange(color.value)}
                title={color.name}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <button type="button" className="context-menu__item" onClick={handlePaste}>
            Paste
          </button>
          {registrySections.map((section) => (
            <React.Fragment key={section.title}>
              <div className="context-menu__section-label">Add {section.title}</div>
              <div className="context-menu__row">
                {section.nodes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
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
