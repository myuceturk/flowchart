import { create } from 'zustand';
import type { NodeLibraryCategory } from '../nodes/nodeDesignSystem';
import type { AppState, ClipboardPayload, ContextMenuState } from '../types';
import type { SpacingIndicator } from '../utils/alignment';
import useDiagramStore from './useDiagramStore';

type UIState = Pick<
  AppState,
  | 'selectedNodeIds'
  | 'selectedEdgeIds'
  | 'clipboard'
  | 'clipboardStyle'
  | 'activeTool'
  | 'sidebarCollapsed'
  | 'activeCategory'
  | 'helperLines'
  | 'isEditingLabel'
  | 'isSearchOpen'
  | 'isTemplateGalleryOpen'
  | 'contextMenu'
>;

type UIActions = Pick<
  AppState,
  | 'setSelectedNodeIds'
  | 'setSelectedEdgeIds'
  | 'clearSelection'
  | 'selectAllNodes'
  | 'setClipboard'
  | 'setClipboardStyle'
  | 'setActiveTool'
  | 'setSidebarCollapsed'
  | 'toggleSidebar'
  | 'setActiveCategory'
  | 'setHelperLines'
  | 'setEditingLabel'
  | 'setSearchOpen'
  | 'setTemplateGalleryOpen'
  | 'openContextMenu'
  | 'closeContextMenu'
  | 'resetUIState'
>;

export type UIStore = UIState & UIActions;

const DEFAULT_CONTEXT_MENU: ContextMenuState = { open: false };
const DEFAULT_ACTIVE_CATEGORY: NodeLibraryCategory = 'Flowchart';

function createInitialUIState(): UIState {
  return {
    selectedNodeIds: [],
    selectedEdgeIds: [],
    clipboard: null,
    clipboardStyle: null,
    activeTool: 'select',
    sidebarCollapsed: false,
    activeCategory: DEFAULT_ACTIVE_CATEGORY,
    helperLines: {
      vertical: null,
      horizontal: null,
      spacingIndicators: [],
    },
    isEditingLabel: false,
    isSearchOpen: false,
    isTemplateGalleryOpen: false,
    contextMenu: DEFAULT_CONTEXT_MENU,
  };
}

function areStringArraysEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function areClipboardStylesEqual(
  a: UIState['clipboardStyle'],
  b: UIState['clipboardStyle'],
) {
  return a?.color === b?.color;
}

function areSpacingIndicatorsEqual(a: SpacingIndicator[], b: SpacingIndicator[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

const useUIStore = create<UIStore>()((set) => ({
  ...createInitialUIState(),

  setSelectedNodeIds: (selectedNodeIds) =>
    set((state) =>
      areStringArraysEqual(state.selectedNodeIds, selectedNodeIds) ? state : { selectedNodeIds },
    ),

  setSelectedEdgeIds: (selectedEdgeIds) =>
    set((state) =>
      areStringArraysEqual(state.selectedEdgeIds, selectedEdgeIds) ? state : { selectedEdgeIds },
    ),

  clearSelection: () =>
    set((state) =>
      state.selectedNodeIds.length === 0 && state.selectedEdgeIds.length === 0
        ? state
        : { selectedNodeIds: [], selectedEdgeIds: [] },
    ),

  selectAllNodes: () =>
    set({
      selectedNodeIds: useDiagramStore.getState().nodes.map((node) => node.id),
      selectedEdgeIds: [],
    }),

  setClipboard: (clipboard: ClipboardPayload | null) =>
    set((state) => (state.clipboard === clipboard ? state : { clipboard })),

  setClipboardStyle: (clipboardStyle) =>
    set((state) =>
      areClipboardStylesEqual(state.clipboardStyle, clipboardStyle) ? state : { clipboardStyle },
    ),

  setActiveTool: (activeTool) =>
    set((state) => (state.activeTool === activeTool ? state : { activeTool })),

  setSidebarCollapsed: (sidebarCollapsed) =>
    set((state) =>
      state.sidebarCollapsed === sidebarCollapsed ? state : { sidebarCollapsed },
    ),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setActiveCategory: (activeCategory) =>
    set((state) => (state.activeCategory === activeCategory ? state : { activeCategory })),

  setHelperLines: (vertical, horizontal, spacingIndicators = []) =>
    set((state) => {
      const nextHelperLines = { vertical, horizontal, spacingIndicators };

      if (
        state.helperLines.vertical === vertical &&
        state.helperLines.horizontal === horizontal &&
        areSpacingIndicatorsEqual(state.helperLines.spacingIndicators, spacingIndicators)
      ) {
        return state;
      }

      return { helperLines: nextHelperLines };
    }),

  setEditingLabel: (isEditingLabel) =>
    set((state) => (state.isEditingLabel === isEditingLabel ? state : { isEditingLabel })),

  setSearchOpen: (isSearchOpen) =>
    set((state) => (state.isSearchOpen === isSearchOpen ? state : { isSearchOpen })),

  setTemplateGalleryOpen: (isTemplateGalleryOpen) =>
    set((state) =>
      state.isTemplateGalleryOpen === isTemplateGalleryOpen ? state : { isTemplateGalleryOpen },
    ),

  openContextMenu: (contextMenu) => set({ contextMenu }),

  closeContextMenu: () =>
    set((state) => (state.contextMenu.open ? { contextMenu: DEFAULT_CONTEXT_MENU } : state)),

  resetUIState: () => set(createInitialUIState()),
}));

export default useUIStore;
