import type { StateCreator } from 'zustand';
import type { NodeLibraryCategory } from '../../nodes/nodeDesignSystem';
import type { AppState } from '../../types';

const DEFAULT_ACTIVE_CATEGORY: NodeLibraryCategory = 'Flowchart';

export const createUiSlice: StateCreator<AppState, [], [], Partial<AppState>> = (set) => ({
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
  contextMenu: { open: false },

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
    set({
      helperLines: { vertical, horizontal, spacingIndicators },
    }),
  setEditingLabel: (isEditingLabel) => set({ isEditingLabel }),
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  setTemplateGalleryOpen: (isTemplateGalleryOpen) => set({ isTemplateGalleryOpen }),
  openContextMenu: (contextMenu) => set({ contextMenu }),
  closeContextMenu: () => set({ contextMenu: { open: false } }),
});
