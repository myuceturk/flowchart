import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useReactFlow } from 'reactflow';
import { useShallow } from 'zustand/react/shallow';
import {
  createPluginActionContext,
  createPluginNode,
  getPluginDefaultNodeData,
  usePluginNodeRegistry,
  usePluginSidebarItems,
} from '../plugins/pluginSystem';
import type { ActiveTool } from '../types';
import type { AppNodeType } from '../nodes/types';
import { uiIcons } from '../nodes/nodeIcons';
import { getCanvasCenterScreenPoint } from '../app/services/flowViewport';
import { useDiagramCommands } from '../hooks/useDiagramCommands';
import useDiagramStore from '../store/useDiagramStore';
import useUIStore from '../store/useUIStore';
import { getDragShapeSvg } from './dragShapes';
import SidebarCategory from './SidebarCategory';
import SidebarItem from './SidebarItem';
import './Sidebar.css';

type SidebarPayload = {
  type: AppNodeType;
  label: string;
  color?: string | null;
};

type ToolItem = {
  id: string;
  label: string;
  description: string;
  tone?: 'blue' | 'purple' | 'orange' | 'green' | 'gray';
  icon: React.ReactNode;
  payload?: SidebarPayload;
  indicator?: string;
  run?: (context: ReturnType<typeof createPluginActionContext>) => void;
};

const coreTools: ToolItem[] = [
  {
    id: 'select',
    label: 'Select Tool',
    description: 'Edit, connect, and select elements',
    tone: 'blue',
    icon: uiIcons.select,
  },
  {
    id: 'hand',
    label: 'Hand Tool',
    description: 'Pan the canvas without selecting',
    tone: 'gray',
    icon: uiIcons.hand,
  },
];

const Sidebar: React.FC = () => {
  const { screenToFlowPosition, fitView } = useReactFlow();
  const { addNode } = useDiagramCommands();
  const {
    activeTool,
    setActiveTool,
    sidebarCollapsed,
    toggleSidebar,
    activeCategory,
    setActiveCategory,
  } = useUIStore(
    useShallow((state) => ({
      activeTool: state.activeTool,
      setActiveTool: state.setActiveTool,
      sidebarCollapsed: state.sidebarCollapsed,
      toggleSidebar: state.toggleSidebar,
      activeCategory: state.activeCategory,
      setActiveCategory: state.setActiveCategory,
    })),
  );
  const registry = usePluginNodeRegistry();
  const pluginSidebarItems = usePluginSidebarItems();
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);

  const categories = useMemo(
    () =>
      registry.map((section) => ({
        id: section.category,
        title: section.category,
        icon: section.nodes[0]?.icon ?? uiIcons.layers,
        items: section.nodes.map((node) => ({
          id: node.type,
          label: node.label,
          description: node.description,
          tone: node.tone,
          icon: node.icon,
          indicator: node.badge,
          payload: {
            type: node.type,
            label: node.label,
            color: node.defaultData.color ?? null,
          },
        })),
      })),
    [registry],
  );

  useEffect(() => () => {
    dragPreviewRef.current?.remove();
    dragPreviewRef.current = null;
  }, []);

  const createNodeFromPayload = useCallback(
    (payload: SidebarPayload) => {
      const defaults = getPluginDefaultNodeData(payload.type);
      const position = screenToFlowPosition(getCanvasCenterScreenPoint());

      addNode(
        createPluginNode(payload.type, position, {
          label: payload.label,
          color: payload.color ?? defaults.color ?? null,
        }),
      );
    },
    [addNode, screenToFlowPosition],
  );

  const runPluginSidebarAction = useCallback(
    (action?: ((context: ReturnType<typeof createPluginActionContext>) => void) | undefined) => {
      if (!action) {
        return;
      }

      action(
        createPluginActionContext({
          addNode: ({ type, label, color, position }) => {
            const resolvedPosition = position ?? screenToFlowPosition(getCanvasCenterScreenPoint());

            addNode({
              ...createPluginNode(type, resolvedPosition, {
                label,
                color,
              }),
            });
          },
          fitView: () => fitView({ padding: 0.2, duration: 220 }),
          setActiveTool,
          getDiagramState: useDiagramStore.getState,
        }),
      );
    },
    [addNode, fitView, screenToFlowPosition, setActiveTool],
  );

  const removeDragPreview = useCallback(() => {
    dragPreviewRef.current?.remove();
    dragPreviewRef.current = null;
  }, []);

  const handleDragStart = useCallback(
    (event: React.DragEvent<HTMLButtonElement>, item: ToolItem) => {
      if (!item.payload) return;

      const preview = document.createElement('div');
      preview.className = 'sidebar-drag-preview';
      const shapeSvg = item.payload ? getDragShapeSvg(item.payload.type) : '';
      preview.innerHTML = `
        <span class="sidebar-drag-preview__shape">${shapeSvg}</span>
        <span class="sidebar-drag-preview__text">${item.label}</span>
      `;
      document.body.appendChild(preview);
      dragPreviewRef.current = preview;

      requestAnimationFrame(() => {
        preview.classList.add('is-visible');
      });

      event.dataTransfer.setData('application/reactflow', JSON.stringify(item.payload));
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setDragImage(preview, 24, 24);
      setActiveTool(item.id as ActiveTool);
    },
    [setActiveTool],
  );

  const handleItemClick = useCallback(
    (item: ToolItem) => {
      if (item.id === 'select' || item.id === 'hand' || item.payload) {
        setActiveTool(item.id as ActiveTool);
      }

      if (item.payload) {
        createNodeFromPayload(item.payload);
        return;
      }

      if (item.run) {
        runPluginSidebarAction(item.run);
      }
    },
    [createNodeFromPayload, runPluginSidebarAction, setActiveTool],
  );

  const handleToggleCategory = useCallback(
    (categoryId: string) => {
      if (sidebarCollapsed) return;
      setActiveCategory(activeCategory === categoryId ? null : categoryId);
    },
    [activeCategory, setActiveCategory, sidebarCollapsed],
  );

  return (
    <aside className={`sidebar-shell ${sidebarCollapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar-shell__inner">
        <div className="sidebar-shell__header">
          {!sidebarCollapsed ? (
            <div className="sidebar-shell__branding">
              <div className="sidebar-shell__eyebrow">Workspace</div>
              <div className="sidebar-shell__title">Diagram Builder</div>
              <p className="sidebar-shell__subtitle">Compose flows with polished building blocks.</p>
            </div>
          ) : (
            <span className="sidebar-shell__monogram">{uiIcons.spark}</span>
          )}
          <button
            type="button"
            className="sidebar-shell__toggle"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? uiIcons.expand : uiIcons.collapse}
          </button>
        </div>

        <div className="sidebar-shell__body sidebar-scroll">
          <section className="sidebar-section">
            {!sidebarCollapsed ? <div className="sidebar-section__title">Core Tools</div> : null}
            <div className="sidebar-section__items">
              {coreTools.map((item) => (
                <SidebarItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  description={item.description}
                  collapsed={sidebarCollapsed}
                  active={activeTool === item.id}
                  tone={item.tone}
                  onClick={() => handleItemClick(item)}
                />
              ))}
            </div>
          </section>

          {pluginSidebarItems.length > 0 ? (
            <section className="sidebar-section">
              {!sidebarCollapsed ? <div className="sidebar-section__title">Plugins</div> : null}
              <div className="sidebar-section__items">
                {pluginSidebarItems.map((item) => (
                  <SidebarItem
                    key={`${item.pluginName}-${item.id}`}
                    icon={item.icon}
                    label={item.label}
                    description={item.description}
                    collapsed={sidebarCollapsed}
                    active={false}
                    tone={item.tone}
                    draggable={Boolean(item.payload)}
                    indicator={item.indicator}
                    onClick={() => handleItemClick(item)}
                    onDragStart={
                      item.payload ? (event) => handleDragStart(event, item as ToolItem) : undefined
                    }
                    onDragEnd={item.payload ? removeDragPreview : undefined}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {categories.map((category) => (
            <SidebarCategory
              key={category.id}
              id={category.id}
              title={category.title}
              icon={category.icon}
              collapsed={sidebarCollapsed}
              expanded={activeCategory === category.id}
              onToggle={handleToggleCategory}
            >
              <div className="sidebar-section__items">
                {category.items.map((item) => (
                  <SidebarItem
                    key={`${category.id}-${item.label}`}
                    icon={item.icon}
                    label={item.label}
                    description={item.description}
                    collapsed={sidebarCollapsed}
                    active={activeTool === item.id}
                    tone={item.tone}
                    draggable={Boolean(item.payload)}
                    indicator={item.indicator}
                    onClick={() => handleItemClick(item)}
                    onDragStart={(event) => handleDragStart(event, item)}
                    onDragEnd={removeDragPreview}
                  />
                ))}
              </div>
            </SidebarCategory>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default memo(Sidebar);
