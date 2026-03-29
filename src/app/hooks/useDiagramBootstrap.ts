import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { loadInstalledPlugins } from '../../plugins/pluginSystem';
import { loadAutosavedDiagram, loadDiagramFromApi } from '../services/diagramPersistence';
import useDiagramStore from '../../store/useDiagramStore';

export function useDiagramBootstrap() {
  const { id } = useParams<{ id: string }>();

  const { setDiagram, setDiagramId, setDiagramTitle } = useDiagramStore(
    useShallow((state) => ({
      setDiagram: state.setDiagram,
      setDiagramId: state.setDiagramId,
      setDiagramTitle: state.setDiagramTitle,
    })),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlugins = () => {
      void loadInstalledPlugins();
    };

    if (typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(loadPlugins, { timeout: 600 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(loadPlugins, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapDiagram() {
      try {
        if (id) {
          const remoteDiagram = await loadDiagramFromApi(id);

          if (remoteDiagram && !cancelled) {
            setDiagram(remoteDiagram.nodes, remoteDiagram.edges);
            setDiagramId(remoteDiagram.id ?? id);
            setDiagramTitle(remoteDiagram.title ?? null);
            return;
          }
        }

        const autosavedDiagram = loadAutosavedDiagram();

        if (autosavedDiagram && !cancelled) {
          setDiagram(autosavedDiagram.nodes, autosavedDiagram.edges);
        }
      } catch (error) {
        console.error('Failed to bootstrap diagram state.', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrapDiagram();

    return () => {
      cancelled = true;
    };
  }, [id, setDiagram, setDiagramId, setDiagramTitle]);

  return { loading };
}
