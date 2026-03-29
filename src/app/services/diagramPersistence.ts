import type { Edge, Node } from 'reactflow';
import type { NodeData } from '../../nodes/types';
import { API_URL } from '../../config';

export const DIAGRAM_AUTOSAVE_STORAGE_KEY = 'flow-diagram-autosave';

const DIAGRAM_API_BASE_URL = API_URL;

export type DiagramPayload = {
  id?: string;
  title?: string;
  nodes: Node<NodeData>[];
  edges: Edge[];
};

// ─── Auth helpers (read imperatively to avoid circular imports) ───────────────

function getAuthHeaders(): Record<string, string> {
  try {
    // Dynamic import avoids circular dependency; store is a singleton so getState works.
    const { default: useAuthStore } = require('../../store/useAuthStore') as {
      default: { getState: () => { getAuthHeaders: () => Record<string, string> } };
    };
    return useAuthStore.getState().getAuthHeaders();
  } catch {
    return {};
  }
}

function handleUnauthorized() {
  try {
    const { default: useAuthStore } = require('../../store/useAuthStore') as {
      default: {
        getState: () => { logout: () => void; openAuthModal: () => void };
      };
    };
    const { logout, openAuthModal } = useAuthStore.getState();
    logout();
    openAuthModal();
  } catch {
    // Store not available
  }
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function loadDiagramFromApi(id: string): Promise<DiagramPayload | null> {
  const response = await fetch(`${DIAGRAM_API_BASE_URL}/diagram/${id}`, {
    headers: { ...getAuthHeaders() },
  });

  if (response.status === 401 || response.status === 403) {
    handleUnauthorized();
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as Partial<DiagramPayload>;

  return {
    id: data.id ?? id,
    title: data.title,
    nodes: (data.nodes ?? []) as Node<NodeData>[],
    edges: data.edges ?? [],
  };
}

export async function saveDiagramToApi(
  payload: Pick<DiagramPayload, 'id' | 'nodes' | 'edges'>,
): Promise<{ id: string; created: boolean }> {
  const isUpdate = Boolean(payload.id);
  const response = await fetch(
    isUpdate
      ? `${DIAGRAM_API_BASE_URL}/diagram/${payload.id}`
      : `${DIAGRAM_API_BASE_URL}/diagram`,
    {
      method: isUpdate ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        nodes: payload.nodes,
        edges: payload.edges,
      }),
    },
  );

  if (response.status === 401 || response.status === 403) {
    handleUnauthorized();
    throw new Error('Authentication required');
  }

  if (!response.ok) {
    throw new Error(isUpdate ? 'Failed to update diagram' : 'Failed to create diagram');
  }

  if (isUpdate) {
    return { id: payload.id as string, created: false };
  }

  const data = (await response.json()) as { id: string };
  return { id: data.id, created: true };
}

export function loadAutosavedDiagram(): Pick<DiagramPayload, 'nodes' | 'edges'> | null {
  const savedData = window.localStorage.getItem(DIAGRAM_AUTOSAVE_STORAGE_KEY);

  if (!savedData) {
    return null;
  }

  try {
    const parsed = JSON.parse(savedData) as Partial<DiagramPayload>;
    return {
      nodes: (parsed.nodes ?? []) as Node<NodeData>[],
      edges: parsed.edges ?? [],
    };
  } catch {
    return null;
  }
}

export function saveAutosavedDiagram(payload: Pick<DiagramPayload, 'nodes' | 'edges'>) {
  window.localStorage.setItem(DIAGRAM_AUTOSAVE_STORAGE_KEY, JSON.stringify(payload));
}

export function clearAutosavedDiagram() {
  window.localStorage.removeItem(DIAGRAM_AUTOSAVE_STORAGE_KEY);
}
