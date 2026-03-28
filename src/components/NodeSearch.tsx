import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { getPluginNodeDefinition } from '../plugins/pluginSystem';
import useDiagramStore from '../store/useDiagramStore';
import useUIStore from '../store/useUIStore';
import './NodeSearch.css';

const NodeSearch: React.FC = () => {
  const isSearchOpen = useUIStore((state) => state.isSearchOpen);
  const setSearchOpen = useUIStore((state) => state.setSearchOpen);
  const nodes = useDiagramStore((state) => state.nodes);
  const setSelectedNodeIds = useUIStore((state) => state.setSelectedNodeIds);

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { fitView, getZoom } = useReactFlow();

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQ = query.toLowerCase();
    return nodes.filter((node) => {
      const label = (node.data?.label as string) || '';
      const type = node.type || '';
      const def = getPluginNodeDefinition(type);
      const defLabel = def?.label || '';
      const defDescription = def?.description || '';
      return (
        label.toLowerCase().includes(lowerQ) ||
        type.toLowerCase().includes(lowerQ) ||
        defLabel.toLowerCase().includes(lowerQ) ||
        defDescription.toLowerCase().includes(lowerQ)
      );
    });
  }, [nodes, query]);

  useEffect(() => {
    if (isSearchOpen) {
      const frameId = requestAnimationFrame(() => {
        setQuery('');
        setActiveIndex(0);
        inputRef.current?.focus();
      });

      return () => window.cancelAnimationFrame(frameId);
    }
  }, [isSearchOpen]);

  const navigateToNode = useCallback(
    (nodeId: string) => {
      setSelectedNodeIds([nodeId]);

      // Pan to node keeping current zoom level
      const currentZoom = getZoom();
      void fitView({
        nodes: [{ id: nodeId }],
        duration: 300,
        padding: 0.5,
        maxZoom: currentZoom,
        minZoom: currentZoom,
      });

      // Highlight effect: add a temporary CSS class
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-id="${nodeId}"]`);
        if (el) {
          el.classList.add('node-search-highlight');
          setTimeout(() => el.classList.remove('node-search-highlight'), 2000);
        }
      });

      setSearchOpen(false);
    },
    [fitView, getZoom, setSelectedNodeIds, setSearchOpen],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setSearchOpen(false);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter' && results[activeIndex]) {
        e.preventDefault();
        navigateToNode(results[activeIndex].id);
      }
    },
    [activeIndex, navigateToNode, results, setSearchOpen],
  );

  if (!isSearchOpen) return null;

  return (
    <div className="node-search-overlay" onClick={() => setSearchOpen(false)}>
      <div className="node-search" onClick={(e) => e.stopPropagation()} onKeyDown={onKeyDown}>
        <div className="node-search__input-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="node-search__icon">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            className="node-search__input"
            type="text"
            placeholder="Search nodes..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
          />
          <kbd className="node-search__kbd">ESC</kbd>
        </div>

        {query.trim() && (
          <div className="node-search__results">
            {results.length === 0 ? (
              <div className="node-search__empty">No matching nodes</div>
            ) : (
              results.map((node, index) => {
                const def = getPluginNodeDefinition(node.type ?? '');
                return (
                  <button
                    key={node.id}
                    type="button"
                    className={`node-search__result ${index === activeIndex ? 'node-search__result--active' : ''}`}
                    onClick={() => navigateToNode(node.id)}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <span className="node-search__result-icon">
                      {def?.icon ?? null}
                    </span>
                    <span className="node-search__result-label">
                      {(node.data?.label as string) || def?.label || <em>Untitled</em>}
                    </span>
                    <span className="node-search__result-type">
                      {def?.label ?? node.type}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(NodeSearch);
