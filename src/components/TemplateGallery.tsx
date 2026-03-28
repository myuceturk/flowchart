import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import {
  templates,
  templateCategories,
  type DiagramTemplate,
  type TemplateCategory,
} from '../data/templates';
import useDiagramStore from '../store/useDiagramStore';
import useHistoryStore from '../store/useHistoryStore';
import { getDefaultNodeData } from '../nodes/nodeRegistry';
import type { AppNodeType } from '../nodes/types';
import './TemplateGallery.css';

interface TemplateGalleryProps {
  open: boolean;
  onClose: () => void;
}

const categoryIcons: Record<string, string> = {
  all: '\u2630',
  business: '\u{1F4BC}',
  software: '\u{1F4BB}',
  hr: '\u{1F465}',
  blank: '\u2B1C',
};

// React.memo prevents re-rendering when the parent re-renders due to search/category
// changes that don't affect this specific template's data.
const MiniPreview = React.memo(function MiniPreview({ template }: { template: DiagramTemplate }) {
  // Stable Map — rebuilt only when template.nodes reference changes.
  const nodeMap = useMemo(
    () => new Map(template.nodes.map((n) => [n.id, n])),
    [template.nodes],
  );

  if (template.nodes.length === 0) {
    return (
      <div className="tg-preview tg-preview--empty">
        <span className="tg-preview__plus">+</span>
      </div>
    );
  }

  const xs = template.nodes.map((n) => n.position.x);
  const ys = template.nodes.map((n) => n.position.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const padX = 60;
  const padY = 40;
  const rangeX = maxX - minX + padX * 2 || 1;
  const rangeY = maxY - minY + padY * 2 || 1;

  const viewBox = `${minX - padX} ${minY - padY} ${rangeX} ${rangeY}`;

  return (
    <div className="tg-preview">
      <svg viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
        {template.edges.map((edge) => {
          const src = nodeMap.get(edge.source);
          const tgt = nodeMap.get(edge.target);
          if (!src || !tgt) return null;
          return (
            <line
              key={edge.id}
              x1={src.position.x + 20}
              y1={src.position.y + 15}
              x2={tgt.position.x + 20}
              y2={tgt.position.y + 15}
              className="tg-preview__edge"
            />
          );
        })}
        {template.nodes.map((node) => {
          const isDecision = node.type === 'decision';
          const isStartEnd = node.type === 'startEnd';
          if (isDecision) {
            return (
              <polygon
                key={node.id}
                points={`${node.position.x + 20},${node.position.y} ${node.position.x + 40},${node.position.y + 15} ${node.position.x + 20},${node.position.y + 30} ${node.position.x},${node.position.y + 15}`}
                className="tg-preview__node tg-preview__node--decision"
              />
            );
          }
          return (
            <rect
              key={node.id}
              x={node.position.x}
              y={node.position.y}
              width={40}
              height={30}
              rx={isStartEnd ? 15 : 4}
              className="tg-preview__node"
            />
          );
        })}
      </svg>
    </div>
  );
});

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ open, onClose }) => {
  const setDiagram = useDiagramStore((state) => state.setDiagram);
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return templates.filter((t) => {
      const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
      const matchesSearch =
        q.length === 0 ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleSelect = useCallback(
    (template: DiagramTemplate) => {
      useHistoryStore.getState().pushSnapshot(useDiagramStore.getState().createSnapshot());
      const enrichedNodes = template.nodes.map((node) => {
        const defaults = getDefaultNodeData((node.type ?? 'process') as AppNodeType);
        return {
          ...node,
          width: node.width ?? defaults.width,
          height: node.height ?? defaults.height,
          data: {
            ...defaults,
            ...node.data,
          },
        };
      });
      setDiagram(enrichedNodes, [...template.edges]);
      onClose();
    },
    [setDiagram, onClose],
  );

  // Reset search when modal opens
  useEffect(() => {
    if (open) {
      const frameId = window.requestAnimationFrame(() => {
        setSearchQuery('');
        setActiveCategory('all');
      });

      return () => window.cancelAnimationFrame(frameId);
    }
  }, [open]);

  // Focus trap + ESC
  useEffect(() => {
    if (!open) return;

    searchRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = overlayRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable || focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="tg-overlay"
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Template Gallery"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="tg-container">
        {/* Header */}
        <div className="tg-header">
          <div className="tg-header__left">
            <div>
              <h2 className="tg-title">Choose a Template</h2>
              <p className="tg-subtitle">Start with a pre-built flow or begin from scratch.</p>
            </div>
            <div className="tg-search">
              <Search size={14} className="tg-search__icon" />
              <input
                ref={searchRef}
                type="text"
                className="tg-search__input"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search templates"
              />
              {searchQuery.length > 0 && (
                <button
                  className="tg-search__clear"
                  onClick={() => {
                    setSearchQuery('');
                    searchRef.current?.focus();
                  }}
                  aria-label="Clear search"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
          <button
            className="tg-btn tg-btn--blank"
            ref={firstFocusableRef}
            onClick={() => handleSelect(templates[0])}
          >
            + Start Blank
          </button>
        </div>

        <div className="tg-body">
          {/* Sidebar */}
          <nav className="tg-sidebar" aria-label="Template categories">
            {templateCategories.map((cat) => (
              <button
                key={cat.id}
                className={`tg-cat-btn ${activeCategory === cat.id ? 'tg-cat-btn--active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span className="tg-cat-icon">{categoryIcons[cat.id]}</span>
                {cat.label}
              </button>
            ))}
          </nav>

          {/* Grid */}
          <div className="tg-grid" role="list">
            {filtered.length === 0 ? (
              <div className="tg-empty">
                <p className="tg-empty__text">No templates found for &ldquo;{searchQuery}&rdquo;</p>
                <button
                  className="tg-btn tg-btn--blank"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                    searchRef.current?.focus();
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              filtered.map((template) => (
                <div
                  key={template.id}
                  className="tg-card"
                  role="listitem"
                  onClick={() => handleSelect(template)}
                >
                  <MiniPreview template={template} />
                  <div className="tg-card__info">
                    <h3 className="tg-card__name">{template.name}</h3>
                    <p className="tg-card__desc">{template.description}</p>
                  </div>
                  <button
                    className="tg-btn tg-btn--use"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(template);
                    }}
                  >
                    Use this template
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer close */}
        <button
          className="tg-close"
          onClick={onClose}
          ref={lastFocusableRef}
          aria-label="Close template gallery"
        >
          Close
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default TemplateGallery;
