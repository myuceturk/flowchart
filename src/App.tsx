import { useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { ReactFlowProvider } from 'reactflow';
import { useShallow } from 'zustand/react/shallow';
import Canvas from './components/Canvas';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TemplateGallery from './components/TemplateGallery';
import AuthModal from './components/AuthModal';
import ErrorFallback from './components/ErrorFallback';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import { useAutoSave } from './hooks/useAutoSave';
import { useDiagramBootstrap } from './app/hooks/useDiagramBootstrap';
import { animationCssVariables } from './utils/animations';
import useDiagramStore from './store/useDiagramStore';
import useUIStore from './store/useUIStore';
import useAuthStore from './store/useAuthStore';
import useCollaborationStore from './store/useCollaborationStore';
import './index.css';

const ONBOARDING_KEY = 'fdb_onboarding_shown';

// ─── Canvas / diagram workspace ───────────────────────────────────────────────
function DiagramApp() {
  const { loading } = useDiagramBootstrap();
  useAutoSave(!loading);

  const { isAuthenticated, user, token } = useAuthStore(
    useShallow((s) => ({ isAuthenticated: s.isAuthenticated, user: s.user, token: s.token })),
  );
  const diagramId = useDiagramStore((s) => s.diagramId);
  const { connect: connectCollab, disconnect: disconnectCollab } = useCollaborationStore(
    useShallow((s) => ({ connect: s.connect, disconnect: s.disconnect })),
  );

  useEffect(() => {
    if (isAuthenticated && user && token && diagramId) {
      connectCollab(diagramId, user.id, user.email, token);
      return () => {
        disconnectCollab();
      };
    }
    disconnectCollab();
  }, [isAuthenticated, user, token, diagramId, connectCollab, disconnectCollab]);

  const hasNodes = useDiagramStore((state) => state.nodes.length > 0);

  const { isTemplateGalleryOpen, setTemplateGalleryOpen } = useUIStore(
    useShallow((state) => ({
      isTemplateGalleryOpen: state.isTemplateGalleryOpen,
      setTemplateGalleryOpen: state.setTemplateGalleryOpen,
    })),
  );

  const handleCloseTemplateGallery = useCallback(
    () => setTemplateGalleryOpen(false),
    [setTemplateGalleryOpen],
  );

  useEffect(() => {
    Object.entries(animationCssVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  useEffect(() => {
    if (loading) return;
    const alreadyShown = localStorage.getItem(ONBOARDING_KEY);
    if (!alreadyShown && !hasNodes) {
      setTemplateGalleryOpen(true);
      localStorage.setItem(ONBOARDING_KEY, 'true');
    }
  }, [loading, hasNodes, setTemplateGalleryOpen]);

  if (loading) {
    return <div className="app-loading">Loading diagram...</div>;
  }

  return (
    <div className="app-container app-shell">
      <Header />
      <div className="app-shell__workspace">
        <ReactFlowProvider>
          <Sidebar />
          <div className="app-shell__canvas">
            <Canvas />
          </div>
        </ReactFlowProvider>
      </div>
      <TemplateGallery open={isTemplateGalleryOpen} onClose={handleCloseTemplateGallery} />
      <AuthModal />
    </div>
  );
}

// ─── Root route: redirect authenticated users, show landing page otherwise ────
function RootRoute() {
  const authInitialized = useAuthStore((s) => s.authInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!authInitialized) {
    return <div className="app-loading">Loading…</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return <LandingPage />;
}

// ─── Auth route: redirect authenticated users away from login/register ─────────
function AuthRoute() {
  const authInitialized = useAuthStore((s) => s.authInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!authInitialized) {
    return <div className="app-loading">Loading…</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return <AuthPage />;
}

// ─── Forgot password placeholder ──────────────────────────────────────────────
function ForgotPasswordPage() {
  return (
    <div className="ap-coming-soon">
      <div className="ap-coming-soon__card">
        <h2>Şifre Sıfırlama</h2>
        <p>Bu özellik yakında kullanıma açılacak.</p>
        <Link to="/login">Giriş sayfasına dön</Link>
      </div>
    </div>
  );
}

// ─── App router ───────────────────────────────────────────────────────────────
function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<AuthRoute />} />
      <Route path="/register" element={<AuthRoute />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/diagram/:id"
        element={
          <ProtectedRoute>
            <DiagramApp />
          </ProtectedRoute>
        }
      />
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ─── Error boundary wrapper ───────────────────────────────────────────────────
function AppWithErrorBoundary() {
  const user = useAuthStore((s) => s.user);

  return (
    <Sentry.ErrorBoundary
      fallback={({ error, componentStack, eventId }) => (
        <ErrorFallback
          error={error as Error}
          componentStack={componentStack ?? undefined}
          eventId={eventId ?? undefined}
        />
      )}
      beforeCapture={(scope) => {
        if (user) {
          scope.setUser({ id: user.id });
        }
      }}
    >
      <App />
    </Sentry.ErrorBoundary>
  );
}

export default AppWithErrorBoundary;
