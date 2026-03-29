import { create } from 'zustand';
import { API_URL } from '../config';

const AUTH_TOKEN_KEY = 'fdb_auth_token';
const API_BASE = API_URL;

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  /** Returns { Authorization: 'Bearer ...' } if authenticated, else {}. */
  getAuthHeaders: () => Record<string, string>;
}

export type AuthStore = AuthState & AuthActions;

function loadTokenFromStorage(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

const useAuthStore = create<AuthStore>()((set, get) => {
  const storedToken = loadTokenFromStorage();

  return {
    user: null,
    token: storedToken,
    isAuthenticated: false,
    isAuthModalOpen: false,

    login: async (email, password) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const body = (await res.json()) as { token?: string; user?: AuthUser; error?: string };

      if (!res.ok) {
        throw new Error(body.error ?? 'Login failed');
      }

      localStorage.setItem(AUTH_TOKEN_KEY, body.token!);
      set({ token: body.token!, user: body.user!, isAuthenticated: true, isAuthModalOpen: false });
    },

    register: async (email, password) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const body = (await res.json()) as { token?: string; user?: AuthUser; error?: string };

      if (!res.ok) {
        throw new Error(body.error ?? 'Registration failed');
      }

      localStorage.setItem(AUTH_TOKEN_KEY, body.token!);
      set({ token: body.token!, user: body.user!, isAuthenticated: true, isAuthModalOpen: false });
    },

    logout: () => {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      set({ user: null, token: null, isAuthenticated: false });
    },

    openAuthModal: () => set({ isAuthModalOpen: true }),
    closeAuthModal: () => set({ isAuthModalOpen: false }),

    getAuthHeaders: () => {
      const { token } = get();
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  };
});

// ─── Restore session on load ──────────────────────────────────────────────────
// If a token exists in storage, validate it against the server once.
(async () => {
  const token = loadTokenFromStorage();
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const body = (await res.json()) as { user: AuthUser };
      useAuthStore.setState({ user: body.user, isAuthenticated: true });
    } else {
      // Token is stale — clear it
      localStorage.removeItem(AUTH_TOKEN_KEY);
      useAuthStore.setState({ token: null });
    }
  } catch {
    // Network error — keep token but mark as not authenticated until next try
  }
})();

export default useAuthStore;
