import { useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import Canvas from './components/Canvas';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TemplateGallery from './components/TemplateGallery';
import { useAutoSave } from './hooks/useAutoSave';
import { useDiagramBootstrap } from './app/hooks/useDiagramBootstrap';
import { animationCssVariables } from './utils/animations';
import useDiagramStore from './store/useDiagramStore';
import useUIStore from './store/useUIStore';
import './index.css';

const ONBOARDING_KEY = 'fdb_onboarding_shown';

function App() {
  const { loading } = useDiagramBootstrap();
  useAutoSave(!loading);
  const nodes = useDiagramStore((state) => state.nodes);
  const isTemplateGalleryOpen = useUIStore((state) => state.isTemplateGalleryOpen);
  const setTemplateGalleryOpen = useUIStore((state) => state.setTemplateGalleryOpen);

  useEffect(() => {
    Object.entries(animationCssVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  // Show template gallery on first visit when canvas is empty
  useEffect(() => {
    if (loading) return;
    const alreadyShown = localStorage.getItem(ONBOARDING_KEY);
    if (!alreadyShown && nodes.length === 0) {
      setTemplateGalleryOpen(true);
      localStorage.setItem(ONBOARDING_KEY, 'true');
    }
  }, [loading, nodes.length, setTemplateGalleryOpen]);

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
      <TemplateGallery open={isTemplateGalleryOpen} onClose={() => setTemplateGalleryOpen(false)} />
    </div>
  );
}

export default App;
