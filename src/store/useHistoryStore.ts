import { create } from 'zustand';
import type { DiagramSnapshot, HistoryStore } from '../types';
import { MAX_HISTORY_ENTRIES } from './store.utils';

const useHistoryStore = create<HistoryStore>()((set, get) => ({
  past: [],
  future: [],

  pushSnapshot: (snapshot: DiagramSnapshot) => {
    set((state) => ({
      past: [...state.past, snapshot].slice(-MAX_HISTORY_ENTRIES),
      future: [],
    }));
  },

  undo: (currentSnapshot: DiagramSnapshot) => {
    const { past, future } = get();

    if (past.length === 0) {
      return null;
    }

    const previousSnapshot = past[past.length - 1];

    set({
      past: past.slice(0, -1),
      future: [currentSnapshot, ...future].slice(0, MAX_HISTORY_ENTRIES),
    });

    return previousSnapshot;
  },

  redo: (currentSnapshot: DiagramSnapshot) => {
    const { past, future } = get();

    if (future.length === 0) {
      return null;
    }

    const nextSnapshot = future[0];

    set({
      past: [...past, currentSnapshot].slice(-MAX_HISTORY_ENTRIES),
      future: future.slice(1),
    });

    return nextSnapshot;
  },

  clearHistory: () => {
    set({ past: [], future: [] });
  },
}));

export default useHistoryStore;
