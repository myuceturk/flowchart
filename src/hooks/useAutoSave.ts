import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { saveAutosavedDiagram } from '../app/services/diagramPersistence';
import useDiagramStore from '../store/useDiagramStore';

const SAVE_DEBOUNCE_MS = 500;

export function useAutoSave(enabled = true) {
  const { nodes, edges, setSaving } = useDiagramStore(
    useShallow((state) => ({
      nodes: state.nodes,
      edges: state.edges,
      setSaving: state.setSaving,
    })),
  );
  const timeoutRef = useRef<number | null>(null);
  const saveIndicatorRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    if (saveIndicatorRef.current) {
      window.clearTimeout(saveIndicatorRef.current);
    }

    setSaving(true);
    timeoutRef.current = window.setTimeout(() => {
      saveAutosavedDiagram({ nodes, edges });
      saveIndicatorRef.current = window.setTimeout(() => setSaving(false), 900);
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      if (saveIndicatorRef.current) {
        window.clearTimeout(saveIndicatorRef.current);
      }
    };
  }, [enabled, nodes, edges, setSaving]);
}
