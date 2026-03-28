import React, { useCallback } from 'react';
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  useReactFlow,
  type SelectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useShallow } from 'zustand/react/shallow';
import { edgeTypes } from '../../edges';
import { getAutoLayoutedNodes } from '../../utils/autoLayout';
import { useThemeStore } from '../../theme';
import { useDiagramCommands } from '../../hooks/useDiagramCommands';
import useDiagramStore from '../../store/useDiagramStore';
import useHistoryStore from '../../store/useHistoryStore';
import useUIStore from '../../store/useUIStore';
import {
  getPluginNodeDefinition,
  usePluginNodeTypes,
  usePluginToolbarItems,
} from '../../plugins/pluginSystem';
import ContextMenu from '../ContextMenu';
import EmptyState from '../EmptyState';
import NodeSearch from '../NodeSearch';
import SelectionToolbar from '../SelectionToolbar';
import AlignmentGuides from './components/AlignmentGuides';
import { useCanvasContextMenu } from './hooks/useCanvasContextMenu';
import { useCanvasKeyboardShortcuts } from './hooks/useCanvasKeyboardShortcuts';
import { useCanvasNodeDnD } from './hooks/useCanvasNodeDnD';
import { useNodeAlignmentGuides } from './hooks/useNodeAlignmentGuides';
import { usePluginCanvasActionContext } from './hooks/usePluginCanvasActionContext';

const CanvasView: React.FC = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setDiagram } =
    useDiagramStore(
      useShallow((state) => ({
        nodes: state.nodes,
        edges: state.edges,
        onNodesChange: state.onNodesChange,
        onEdgesChange: state.onEdgesChange,
        onConnect: state.onConnect,
        setDiagram: state.setDiagram,
      })),
    );
  const {
    helperLines,
    setHelperLines,
    selectedNodeIds,
    activeTool,
    openContextMenu,
    closeContextMenu,
    setSearchOpen,
    setSelectedNodeIds,
    setSelectedEdgeIds,
    setTemplateGalleryOpen,
  } = useUIStore(
    useShallow((state) => ({
      helperLines: state.helperLines,
      setHelperLines: state.setHelperLines,
      selectedNodeIds: state.selectedNodeIds,
      activeTool: state.activeTool,
      openContextMenu: state.openContextMenu,
      closeContextMenu: state.closeContextMenu,
      setSearchOpen: state.setSearchOpen,
      setSelectedNodeIds: state.setSelectedNodeIds,
      setSelectedEdgeIds: state.setSelectedEdgeIds,
      setTemplateGalleryOpen: state.setTemplateGalleryOpen,
    })),
  );
  const {
    deleteSelection,
    duplicateSelection,
    copySelection,
    pasteClipboard,
    undoCommand,
    redoCommand,
    addNode,
  } = useDiagramCommands();
  const customTheme = useThemeStore((state) => state.customTheme);
  const pluginNodeTypes = usePluginNodeTypes();
  const pluginToolbarItems = usePluginToolbarItems();
  const { screenToFlowPosition, getNodes, fitView } = useReactFlow();
  const takeSnapshot = useCallback(() => {
    useHistoryStore.getState().pushSnapshot(useDiagramStore.getState().createSnapshot());
  }, []);
  const selectAllNodes = useCallback(() => {
    const nodeIds = useDiagramStore.getState().nodes.map((node) => node.id);

    useDiagramStore.setState((state) => ({
      nodes: state.nodes.map((node) => ({ ...node, selected: true })),
      edges: state.edges.map((edge) => ({ ...edge, selected: false })),
    }));
    useUIStore.setState({
      selectedNodeIds: nodeIds,
      selectedEdgeIds: [],
    });
  }, []);
  const nudgeSelectedNodes = useCallback(
    (dx: number, dy: number) => {
      const currentSelectedNodeIds = useUIStore.getState().selectedNodeIds;

      if (currentSelectedNodeIds.length === 0) {
        return;
      }

      takeSnapshot();
      useDiagramStore.getState().nudgeNodes(currentSelectedNodeIds, dx, dy);
    },
    [takeSnapshot],
  );

  const { isSpacePanning } = useCanvasKeyboardShortcuts({
    deleteSelection,
    duplicateSelection,
    copySelection,
    pasteClipboard: () => pasteClipboard(),
    selectAllNodes,
    nudgeSelectedNodes,
    undo: undoCommand,
    redo: redoCommand,
    setSearchOpen,
    setSelectedNodeIds,
    setSelectedEdgeIds,
    getNodes: () => useDiagramStore.getState().nodes,
    getSelectedNodeIds: () => useUIStore.getState().selectedNodeIds,
  });

  const { onPaneClick, onPaneContextMenu, onNodeContextMenu } = useCanvasContextMenu({
    openContextMenu,
    closeContextMenu,
    setSelectedNodeIds,
    setSelectedEdgeIds,
    screenToFlowPosition,
  });

  const { onDragOver, onDrop } = useCanvasNodeDnD({
    addNode,
    screenToFlowPosition,
  });

  const { onNodeDragStart, onNodeDragStop, onNodeDrag } = useNodeAlignmentGuides({
    getNodes,
    selectedNodeIds,
    takeSnapshot,
    setHelperLines,
  });

  const pluginActionContext = usePluginCanvasActionContext({
    addNode,
    fitView,
    screenToFlowPosition,
  });

  const isPanMode = activeTool === 'hand' || isSpacePanning;

  const handleCenterView = useCallback(() => {
    void fitView({ padding: 0.2, duration: 220 });
  }, [fitView]);

  const handleAutoLayout = useCallback(() => {
    const layoutedNodes = getAutoLayoutedNodes(nodes, edges, {
      horizontalSpacing: 200,
      verticalSpacing: 120,
    });

    if (layoutedNodes === nodes) {
      return;
    }

    takeSnapshot();
    setDiagram(layoutedNodes, edges);
    window.requestAnimationFrame(() => {
      void fitView({ padding: 0.24, duration: 240 });
    });
  }, [edges, fitView, nodes, setDiagram, takeSnapshot]);

  return (
    <>
      <ReactFlow
        className={isPanMode ? 'canvas canvas--hand-tool' : 'canvas'}
        nodes={nodes}
        edges={edges}
        nodeTypes={pluginNodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'labeled' }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onNodeDrag={onNodeDrag}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        deleteKeyCode={null}
        selectionMode={'partial' as SelectionMode}
        selectionOnDrag={!isPanMode}
        selectionKeyCode="Control"
        multiSelectionKeyCode="Shift"
        panOnDrag={isPanMode}
        panOnScroll={isPanMode}
        nodesDraggable={!isPanMode}
        nodesConnectable={!isPanMode}
        elementsSelectable={!isPanMode}
        connectionMode={ConnectionMode.Loose}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color={customTheme.grid} />
        <Controls />
        <MiniMap
          position="bottom-right"
          nodeColor={(node) =>
            node.data?.color ??
            customTheme.node ??
            getPluginNodeDefinition(node.type ?? '')?.miniMapColor ??
            '#94a3b8'
          }
          maskColor="rgba(0, 0, 0, 0.1)"
          className="custom-minimap"
          zoomable
          pannable
        />
        <Panel position="top-right" className="canvas-toolbar">
          <button type="button" className="canvas-toolbar__button" onClick={handleAutoLayout}>
            Auto Layout
          </button>
          <button type="button" className="canvas-toolbar__button" onClick={handleCenterView}>
            Center View
          </button>
          {pluginToolbarItems.map((item) => (
            <button
              key={`${item.pluginName}-${item.id}`}
              type="button"
              className="canvas-toolbar__button"
              onClick={() => item.run(pluginActionContext)}
              title={`${item.pluginName}: ${item.label}`}
            >
              {item.icon ? <span className="canvas-toolbar__icon">{item.icon}</span> : null}
              {item.label}
            </button>
          ))}
        </Panel>
        <SelectionToolbar />
        {nodes.length === 0 && (
          <EmptyState onOpenTemplates={() => setTemplateGalleryOpen(true)} />
        )}
        <AlignmentGuides
          vertical={helperLines.vertical}
          horizontal={helperLines.horizontal}
        />
      </ReactFlow>
      <ContextMenu />
      <NodeSearch />
    </>
  );
};

export default React.memo(CanvasView);
