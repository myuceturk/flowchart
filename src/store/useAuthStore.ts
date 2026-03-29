import { create } from 'zustand';
import { API_URL } from '../config';

const AUTH_TOKEN_KEY = 'fdb_auth_token';
const API_BASE = API_URL;

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  /** True once the initial token validation has resolved (success or fail). */
  authInitialized: boolean;
}

interface AuthActions {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  /** Returns { Authorization: 'Bearer ...' } if authenticated, else {}. */
  getAuthHeaders: () => Record<string, string>;
}

export type AuthStore = AuthState & AuthActions;

/** Read token from localStorage first, then sessionStorage (non-persistent sessions). */
function loadTokenFromStorage(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) ?? sessionStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Quickly check JWT expiry without a network call. Returns true if expired or invalid. */
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

const useAuthStore = create<AuthStore>()((set, get) => {
  const storedToken = loadTokenFromStorage();

  return {
    user: null,
    token: storedToken,
    isAuthenticated: false,
    isAuthModalOpen: false,
    // If no stored token auth is already resolved (not authenticated).
    authInitialized: !storedToken,

    login: async (email, password, rememberMe = true) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const body = (await res.json()) as { token?: string; user?: AuthUser; error?: string };

      if (!res.ok) {
        throw new Error(body.error ?? 'Giriş başarısız.');
      }

      // rememberMe=true → persist in localStorage; false → session-only
      if (rememberMe) {
        localStorage.setItem(AUTH_TOKEN_KEY, body.token!);
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
      } else {
        sessionStorage.setItem(AUTH_TOKEN_KEY, body.token!);
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }

      set({ token: body.token!, user: body.user!, isAuthenticated: true, isAuthModalOpen: false });
    },

    register: async (name, email, password) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const body = (await res.json()) as { token?: string; user?: AuthUser; error?: string };

      if (!res.ok) {
        throw new Error(body.error ?? 'Kayıt başarısız.');
      }

      localStorage.setItem(AUTH_TOKEN_KEY, body.token!);
      set({ token: body.token!, user: body.user!, isAuthenticated: true, isAuthModalOpen: false });
    },

    logout: () => {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
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
// If a token exists, first check expiry client-side, then validate with the server.
(async () => {
  const token = loadTokenFromStorage();
  if (!token) return;

  // Fast client-side expiry check — avoids an unnecessary network round-trip
  if (isTokenExpired(token)) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    useAuthStore.setState({ token: null, authInitialized: true });
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const body = (await res.json()) as { user: AuthUser };
      useAuthStore.setState({ user: body.user, isAuthenticated: true, authInitialized: true });
    } else {
      // Token rejected by server — clear it
      localStorage.removeItem(AUTH_TOKEN_KEY);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      useAuthStore.setState({ token: null, authInitialized: true });
    }
  } catch {
    // Network error — keep token but mark as initialized so the UI can proceed
    useAuthStore.setState({ authInitialized: true });
  }
})();

export default useAuthStore;
