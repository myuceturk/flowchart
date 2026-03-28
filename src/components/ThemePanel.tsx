import React, { useEffect, useRef, useState } from 'react';
import { Paintbrush, RotateCcw } from 'lucide-react';
import { useThemeStore } from '../theme';
import './ThemePanel.css';

const THEME_FIELDS = [
  {
    key: 'primary',
    label: 'Primary',
    hint: 'Buttons, accents, and highlights',
  },
  {
    key: 'background',
    label: 'Background',
    hint: 'App shell and canvas atmosphere',
  },
  {
    key: 'node',
    label: 'Nodes',
    hint: 'Default fill for unstyled nodes',
  },
  {
    key: 'grid',
    label: 'Grid',
    hint: 'Canvas grid and guides tone',
  },
] as const;

const ThemePanel: React.FC = () => {
  const customTheme = useThemeStore((state) => state.customTheme);
  const resetCustomTheme = useThemeStore((state) => state.resetCustomTheme);
  const updateCustomTheme = useThemeStore((state) => state.updateCustomTheme);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const handleFieldChange = (key: keyof typeof customTheme, value: string) => {
    updateCustomTheme({ [key]: value } as Partial<typeof customTheme>);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div className={`theme-panel ${open ? 'is-open' : ''}`} ref={panelRef}>
      <button
        type="button"
        className="btn-history btn-theme-panel-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Customize theme colors"
      >
        <span className="icon" aria-hidden="true">
          <Paintbrush size={15} strokeWidth={1.9} />
        </span>
        Theme Builder
      </button>

      <div className="theme-panel__popover" role="dialog" aria-label="Theme builder">
        <div className="theme-panel__header">
          <div>
            <div className="theme-panel__eyebrow">Customize</div>
            <div className="theme-panel__title">Theme Builder</div>
          </div>
          <button
            type="button"
            className="theme-panel__reset"
            onClick={resetCustomTheme}
            title="Reset theme colors"
          >
            <RotateCcw size={14} strokeWidth={1.9} />
            Reset
          </button>
        </div>

        <div className="theme-panel__controls">
          {THEME_FIELDS.map((field) => (
            <label className="theme-panel__field" key={field.key}>
              <div className="theme-panel__field-meta">
                <span className="theme-panel__field-label">{field.label}</span>
                <span className="theme-panel__field-value">
                  {customTheme[field.key].startsWith('#')
                    ? customTheme[field.key].toUpperCase()
                    : customTheme[field.key]}
                </span>
              </div>
              <div className="theme-panel__field-control">
                <input
                  className="theme-panel__color-input"
                  type="color"
                  value={customTheme[field.key]}
                  onChange={(event) => handleFieldChange(field.key, event.target.value)}
                  aria-label={`${field.label} color`}
                />
                <span className="theme-panel__field-hint">{field.hint}</span>
              </div>
            </label>
          ))}
        </div>

        <div className="theme-panel__preview">
          <div className="theme-panel__preview-card theme-panel__preview-card--primary">
            <span>Primary action</span>
            <button type="button">Preview</button>
          </div>
          <div className="theme-panel__preview-card theme-panel__preview-card--node">
            <span>Node preview</span>
            <div className="theme-panel__preview-node" />
          </div>
          <div className="theme-panel__preview-grid" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};

export default ThemePanel;
