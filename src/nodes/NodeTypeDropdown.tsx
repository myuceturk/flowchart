import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePluginNodeRegistry } from '../plugins/pluginSystem';
import type { AppNodeType } from './types';

interface NodeTypeDropdownProps {
  value: AppNodeType;
  onChange: (type: AppNodeType) => void;
}

// Stable SVG chevron — same markup every render, no need to re-create the element.
const CHEVRON_SVG = (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 4L5 6.5L7.5 4" />
  </svg>
);

const NodeTypeDropdown: React.FC<NodeTypeDropdownProps> = ({ value, onChange }) => {
  const registry = usePluginNodeRegistry();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // flatMap + find runs on every render without memo; with memo it only reruns
  // when `registry` or `value` actually changes.
  const currentDef = useMemo(
    () => registry.flatMap((cat) => cat.nodes).find((n) => n.type === value),
    [registry, value],
  );

  const handleSelect = useCallback(
    (type: AppNodeType) => {
      onChange(type);
      setOpen(false);
    },
    [onChange],
  );

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="type-dropdown" ref={containerRef}>
      <button
        type="button"
        className="type-dropdown__trigger"
        onClick={() => setOpen((prev) => !prev)}
        title="Change node type"
      >
        {currentDef?.label ?? value}
        {CHEVRON_SVG}
      </button>

      {open && (
        <div
          className="type-dropdown__menu"
          onWheel={(e) => e.stopPropagation()}
        >
          {registry.map((category) => (
            <div key={category.category} className="type-dropdown__group">
              <div className="type-dropdown__group-label">{category.category}</div>
              {category.nodes.map((node) => (
                <button
                  key={node.type}
                  type="button"
                  className={`type-dropdown__item ${node.type === value ? 'type-dropdown__item--active' : ''}`}
                  onClick={() => handleSelect(node.type)}
                >
                  <span className="type-dropdown__item-icon">{node.icon}</span>
                  {node.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(NodeTypeDropdown);
