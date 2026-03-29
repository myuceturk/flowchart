import type { Connection, Edge, EdgeChange, Node, NodeChange } from 'reactflow';
import type { SpacingIndicator } from '../utils/alignment';
import type { AppNodeType, NodeData } from '../nodes/types';
import type { EdgeStylePartial } from '../edges/types';

export type AlignmentDirection =
  | 'left'
  | 'right'
  | 'center'
  | 'top'
  | 'bottom'
  | 'middle'
  | 'distributeHorizontal'
  | 'distributeVertical';

export type ClipboardPayload = {
  nodes: Node<NodeData>[];
  edges: Edge[];
};

export interface DiagramSnapshot {
  nodes: Node<NodeData>[];
  edges: Edge[];
}

export interface DiagramStore {
  nodes: Node<NodeData>[];
  edges: Edge[];
  diagramId: string | null;
  isSaving: boolean;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => boolean;

  addNode: (node: Node<NodeData>) => void;
  addEdge: (edge: Edge | Connection) => void;

  updateNode: (nodeId: string, data: Partial<NodeData>) => void;
  updateNodeDimensions: (
    nodeId: string,
    dimensions: { width: number; height: number; x?: number; y?: number }
  ) => void;
  updateNodeColor: (nodeId: string, color: string | null) => void;
  updateNodeType: (nodeId: string, type: AppNodeType) => void;

  updateEdgeData: (edgeId: string, label: string) => void;
  updateEdgeStyle: (edgeId: string, style: EdgeStylePartial) => void;

  toggleNodeLock: (nodeId: string) => void;

  deleteNodesAndEdges: (nodeIds: string[], edgeIds: string[]) => void;

  duplicateNodesAndEdges: (
    nodeIds: string[],
    options?: { offset?: { x: number; y: number } }
  ) => { newNodeIds: string[] };

  alignNodes: (nodeIds: string[], direction: AlignmentDirection) => void;
  nudgeNodes: (nodeIds: string[], dx: number, dy: number) => void;

  setDiagramId: (id: string | null) => void;
  setDiagram: (nodes: Node<NodeData>[], edges: Edge[]) => void;

  replaceFromSnapshot: (snapshot: DiagramSnapshot) => void;
  createSnapshot: () => DiagramSnapshot;

  setSaving: (isSaving: boolean) => void;
  clearDiagram: () => void;
}

export interface HistoryStore {
  past: DiagramSnapshot[];
  future: DiagramSnapshot[];
  pushSnapshot: (snapshot: DiagramSnapshot) => void;
  undo: (currentSnapshot: DiagramSnapshot) => DiagramSnapshot | null;
  redo: (currentSnapshot: DiagramSnapshot) => DiagramSnapshot | null;
  clearHistory: () => void;
}

export type ContextMenuState =
  | {
      open: false;
    }
  | {
      open: true;
      x: number;
      y: number;
      flowX: number;
      flowY: number;
      target: 'canvas' | 'node';
      nodeId?: string;
    };

export type ActiveTool = 'select' | 'hand' | AppNodeType;

export interface AppState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  clearSelection: () => void;
  activeTool: ActiveTool;
  setActiveTool: (tool: AppState['activeTool']) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  activeCategory: string | null;
  setActiveCategory: (category: AppState['activeCategory']) => void;
  past: Array<{ nodes: Node[]; edges: Edge[] }>;
  future: Array<{ nodes: Node[]; edges: Edge[] }>;
  clipboardStyle: { color: string | null } | null;
  clipboard: ClipboardPayload | null;
  setClipboardStyle: (clipboardStyle: AppState['clipboardStyle']) => void;
  setClipboard: (clipboard: ClipboardPayload | null) => void;
  copyStyle: () => void;
  pasteStyle: () => void;
  copySelection: () => void;
  pasteClipboard: (position?: { x: number; y: number }) => void;
  isEditingLabel: boolean;
  setEditingLabel: (isEditing: boolean) => void;
  isSearchOpen: boolean;
  setSearchOpen: (isOpen: boolean) => void;
  isTemplateGalleryOpen: boolean;
  setTemplateGalleryOpen: (isOpen: boolean) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node) => void;
  updateNode: (nodeId: string, data: Record<string, unknown>) => void;
  updateNodeDimensions: (
    nodeId: string,
    dimensions: { width: number; height: number; x?: number; y?: number },
    options?: { snapshot?: boolean },
  ) => void;
  updateNodeColor: (nodeId: string, color: string | null) => void;
  updateNodeType: (nodeId: string, type: AppNodeType) => void;
  updateEdgeData: (edgeId: string, label: string) => void;
  nudgeSelectedNodes: (dx: number, dy: number) => void;
  selectAllNodes: () => void;
  deleteMultiple: () => void;
  duplicateMultiple: () => void;
  alignSelectedNodes: (direction: AlignmentDirection) => void;
  addEdge: (edge: Edge | Connection) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  setSelectedEdgeIds: (ids: string[]) => void;
  undo: () => void;
  redo: () => void;
  _takeSnapshot: () => void;
  diagramId: string | null;
  setDiagramId: (id: string | null) => void;
  setDiagram: (nodes: Node[], edges: Edge[]) => void;
  isSaving: boolean;
  setSaving: (isSaving: boolean) => void;
  clearCanvas: () => void;
  helperLines: {
    vertical: number | null;
    horizontal: number | null;
    spacingIndicators: SpacingIndicator[];
  };
  setHelperLines: (vertical: number | null, horizontal: number | null, spacingIndicators?: SpacingIndicator[]) => void;
  contextMenu: ContextMenuState;
  openContextMenu: (menu: Extract<ContextMenuState, { open: true }>) => void;
  closeContextMenu: () => void;
  resetUIState: () => void;
}
