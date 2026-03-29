import React, { useEffect, useState } from 'react';
import { ReactFlow, ReactFlowProvider, Background, BackgroundVariant } from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from '../nodes';
import { edgeTypes } from '../edges';
import { loadDiagramFromApi } from '../app/services/diagramPersistence';
import type { Node, Edge } from 'reactflow';

interface DiagramState {
  nodes: Node[];
  edges: Edge[];
}

/** Extract the diagram ID from a pathname like /embed/abc-123 */
function extractEmbedId(pathname: string): string | null {
  const match = /^\/embed\/(.+)$/.exec(pathname);
  return match ? match[1] : null;
}

const EmbedCanvas: React.FC<DiagramState> = ({ nodes, edges }) => (
  <ReactFlow
    nodes={nodes}
    edges={edges}
    nodeTypes={nodeTypes}
    edgeTypes={edgeTypes}
    nodesDraggable={false}
    nodesConnectable={false}
    elementsSelectable={false}
    panOnScroll
    zoomOnScroll
    fitView
    fitViewOptions={{ padding: 0.12 }}
    proOptions={{ hideAttribution: false }}
  >
    <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e2e8f0" />
  </ReactFlow>
);

const EmbedView: React.FC = () => {
  const [diagram, setDiagram] = useState<DiagramState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = extractEmbedId(window.location.pathname);
    if (!id) {
      setError('No diagram ID in URL.');
      return;
    }

    let cancelled = false;

    loadDiagramFromApi(id)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError('Diagram not found.');
          return;
        }
        setDiagram({ nodes: data.nodes, edges: data.edges });
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load diagram.');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div style={styles.center}>
        <p style={styles.errorText}>{error}</p>
      </div>
    );
  }

  if (!diagram) {
    return (
      <div style={styles.center}>
        <p style={styles.loadingText}>Loading diagram…</p>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <ReactFlowProvider>
        <EmbedCanvas nodes={diagram.nodes} edges={diagram.edges} />
      </ReactFlowProvider>
    </div>
  );
};

const styles = {
  root: {
    width: '100vw',
    height: '100vh',
    background: '#ffffff',
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100vw',
    height: '100vh',
    background: '#ffffff',
  },
  loadingText: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 14,
    color: '#64748b',
  },
  errorText: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 14,
    color: '#ef4444',
  },
} as const;

export default EmbedView;
