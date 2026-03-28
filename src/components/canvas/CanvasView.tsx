import React, { useCallback, useMemo, useRef } from 'react';
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  useReactFlow,
  type Edge,
  type Node,
  type OnSelectionChangeParams,
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

// Module-level constants so ReactFlow receives the same reference on every
// render instead of new objects, preventing spurious internal ReactFlow work.
const SNAP_GRID: [number, number] = [15, 15];
const DEFAULT_EDGE_OPTIONS = { type: 'labeled' } as const;

// Above this node count, enable ReactFlow's viewport culling so only DOM nodes
// in the visible viewport are rendered.  Below the threshold every node renders
// so there is zero pop-in during normal use.  The trade-off above the threshold:
// a node's local React state (e.g. in-progress label edit) is lost if it scrolls
// fully off-screen — acceptable for large diagrams where the user is rarely
// editing and panning simultaneously.
const VIEWPORT_CULLING_THRESHOLD = 200;

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

  // Memoized so MiniMap doesn't receive a new function reference on every
  // CanvasView render, which would cause it to re-paint every node.
  const miniMapNodeColor = useCallback(
    (node: Node) =>
      node.data?.color ??
      customTheme.node ??
      getPluginNodeDefinition(node.type ?? '')?.miniMapColor ??
      '#94a3b8',
    [customTheme.node],
  );

  const pluginNodeTypes = usePluginNodeTypes();
  const pluginToolbarItems = usePluginToolbarItems();
  const { screenToFlowPosition, getNodes, fitView } = useReactFlow();
  const takeSnapshot = useCallback(() => {
    useHistoryStore.getState().pushSnapshot(useDiagramStore.getState().createSnapshot());
  }, []);
  const selectAllNodes = useCallback(() => {
    const nodeIds = useDiagramStore.getState().nodes.map((node) => node.id);

    useDiagramStore.setState((state) => ({
      // Structural sharing: only allocate a new object for nodes not yet selected.
      // With 2000 nodes already selected (e.g. re-pressing Ctrl+A), zero allocations.
      nodes: state.nodes.map((node) => (node.selected ? node : { ...node, selected: true })),
      edges: state.edges.map((edge) => (edge.selected ? { ...edge, selected: false } : edge)),
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

  // Throttle selection updates to one per animation frame.
  // During a box-select over 500 nodes ReactFlow fires this callback at pointer-move
  // rate (120+ events/sec). Each call maps N node objects to IDs then compares N
  // strings. Coalescing to rAF drops that to ≤60 updates/sec with zero stale risk
  // (we always use the most-recent params captured before the frame fires).
  const selectionRafRef = useRef<number | null>(null);

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: OnSelectionChangeParams) => {
      if (selectionRafRef.current !== null) {
        cancelAnimationFrame(selectionRafRef.current);
      }
      selectionRafRef.current = requestAnimationFrame(() => {
        selectionRafRef.current = null;
        setSelectedNodeIds(selectedNodes.map((n: Node) => n.id));
        setSelectedEdgeIds(selectedEdges.map((e: Edge) => e.id));
      });
    },
    [setSelectedNodeIds, setSelectedEdgeIds],
  );

  // Stable reference so EmptyState's React.memo isn't bypassed on every
  // CanvasView render (e.g. on activeTool change while canvas is empty).
  const handleOpenTemplates = useCallback(() => {
    setTemplateGalleryOpen(true);
  }, [setTemplateGalleryOpen]);

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
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
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
        onSelectionChange={onSelectionChange}
        fitView
        snapToGrid
        snapGrid={SNAP_GRID}
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
        onlyRenderVisibleElements={nodes.length > VIEWPORT_CULLING_THRESHOLD}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color={customTheme.grid} />
        <Controls />
        <MiniMap
          position="bottom-right"
          nodeColor={miniMapNodeColor}
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
          <EmptyState onOpenTemplates={handleOpenTemplates} />
        )}
        <AlignmentGuides />
      </ReactFlow>
      <ContextMenu />
      <NodeSearch />
    </>
  );
};

export default React.memo(CanvasView);
