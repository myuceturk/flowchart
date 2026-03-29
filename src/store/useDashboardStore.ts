import { create } from 'zustand';
import { API_URL } from '../config';
import useAuthStore from './useAuthStore';

export interface DiagramSummary {
  id: string;
  title: string;
  nodeCount: number;
  createdAt: number;
  updatedAt: number;
}

interface DashboardState {
  diagrams: DiagramSummary[];
  isLoading: boolean;
  error: string | null;
}

interface DashboardActions {
  fetchDiagrams: () => Promise<void>;
  createDiagram: (nodes?: unknown[], edges?: unknown[], title?: string) => Promise<string>;
  deleteDiagram: (id: string) => Promise<void>;
  renameDiagram: (id: string, title: string) => Promise<void>;
}

export type DashboardStore = DashboardState & DashboardActions;

const useDashboardStore = create<DashboardStore>()((set) => ({
  diagrams: [],
  isLoading: false,
  error: null,

  fetchDiagrams: async () => {
    set({ isLoading: true, error: null });
    try {
      const headers = useAuthStore.getState().getAuthHeaders();
      const res = await fetch(`${API_URL}/diagrams`, { headers });
      if (!res.ok) throw new Error('Sunucu hatası');
      const data = (await res.json()) as Array<{
        id: string;
        title: string;
        nodeCount: number;
        created_at: number;
        updated_at: number;
      }>;
      const diagrams: DiagramSummary[] = data.map((d) => ({
        id: d.id,
        title: d.title || 'İsimsiz Diyagram',
        nodeCount: d.nodeCount ?? 0,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
      set({ diagrams, isLoading: false });
    } catch {
      set({ error: 'Diyagramlar yüklenemedi', isLoading: false });
    }
  },

  createDiagram: async (nodes = [], edges = [], title = '') => {
    const headers = {
      'Content-Type': 'application/json',
      ...useAuthStore.getState().getAuthHeaders(),
    };
    const res = await fetch(`${API_URL}/diagram`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ nodes, edges, title }),
    });
    if (!res.ok) throw new Error('Diyagram oluşturulamadı');
    const data = (await res.json()) as { id: string };
    return data.id;
  },

  deleteDiagram: async (id) => {
    const headers = useAuthStore.getState().getAuthHeaders();
    const res = await fetch(`${API_URL}/diagrams/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) throw new Error('Silinemedi');
    set((s) => ({ diagrams: s.diagrams.filter((d) => d.id !== id) }));
  },

  renameDiagram: async (id, title) => {
    const headers = {
      'Content-Type': 'application/json',
      ...useAuthStore.getState().getAuthHeaders(),
    };
    const res = await fetch(`${API_URL}/diagrams/${id}/title`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error('Yeniden adlandırılamadı');
    set((s) => ({
      diagrams: s.diagrams.map((d) => (d.id === id ? { ...d, title } : d)),
    }));
  },
}));

export default useDashboardStore;
