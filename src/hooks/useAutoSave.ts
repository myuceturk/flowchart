import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { saveAutosavedDiagram } from '../app/services/diagramPersistence';
import useDiagramStore from '../store/useDiagramStore';

const SAVE_DEBOUNCE_MS = 500;
const SAVE_INDICATOR_MS = 900;

export function useAutoSave(enabled = true) {
  const { nodes, edges, setSaveStatus } = useDiagramStore(
    useShallow((state) => ({
      nodes: state.nodes,
      edges: state.edges,
      setSaveStatus: state.setSaveStatus,
    })),
  );
  const timeoutRef = useRef<number | null>(null);
  const indicatorRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    if (indicatorRef.current) window.clearTimeout(indicatorRef.current);

    setSaveStatus('saving');

    timeoutRef.current = window.setTimeout(() => {
      try {
        saveAutosavedDiagram({ nodes, edges });
        indicatorRef.current = window.setTimeout(() => setSaveStatus('saved'), SAVE_INDICATOR_MS);
      } catch {
        setSaveStatus('error');
      }
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (indicatorRef.current) window.clearTimeout(indicatorRef.current);
    };
  }, [enabled, nodes, edges, setSaveStatus]);
}
