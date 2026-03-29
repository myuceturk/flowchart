import { useCallback, useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { useShallow } from 'zustand/react/shallow';
import Canvas from './components/Canvas';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TemplateGallery from './components/TemplateGallery';
import AuthModal from './components/AuthModal';
import { useAutoSave } from './hooks/useAutoSave';
import { useDiagramBootstrap } from './app/hooks/useDiagramBootstrap';
import { animationCssVariables } from './utils/animations';
import useDiagramStore from './store/useDiagramStore';
import useUIStore from './store/useUIStore';
import useAuthStore from './store/useAuthStore';
import useCollaborationStore from './store/useCollaborationStore';
import './index.css';

const ONBOARDING_KEY = 'fdb_onboarding_shown';

function App() {
  const { loading } = useDiagramBootstrap();
  useAutoSave(!loading);

  // ─── Collaboration session ──────────────────────────────────────────────────
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
    // Not authenticated or no diagram — ensure any previous session is torn down
    disconnectCollab();
  }, [isAuthenticated, user, token, diagramId, connectCollab, disconnectCollab]);

  // Subscribe to a boolean, not the full nodes array — App no longer re-renders
  // on every node edit, only when the diagram transitions between empty/non-empty.
  const hasNodes = useDiagramStore((state) => state.nodes.length > 0);

  // Merge into one subscription so only one store listener is registered.
  const { isTemplateGalleryOpen, setTemplateGalleryOpen } = useUIStore(
    useShallow((state) => ({
      isTemplateGalleryOpen: state.isTemplateGalleryOpen,
      setTemplateGalleryOpen: state.setTemplateGalleryOpen,
    })),
  );

  // Stable reference so TemplateGallery's React.memo is not bypassed on re-renders.
  const handleCloseTemplateGallery = useCallback(
    () => setTemplateGalleryOpen(false),
    [setTemplateGalleryOpen],
  );

  useEffect(() => {
    Object.entries(animationCssVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  // Show template gallery on first visit when canvas is empty
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

export default App;
