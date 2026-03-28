import React, { useState } from 'react';
import { LayoutTemplate, MoonStar, SunMedium } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useThemeStore } from '../theme';
import { saveDiagramToApi } from '../app/services/diagramPersistence';
import { useDiagramCommands } from '../hooks/useDiagramCommands';
import useDiagramStore from '../store/useDiagramStore';
import useHistoryStore from '../store/useHistoryStore';
import ThemePanel from './ThemePanel';
import ExportMenu from './ExportMenu';
import TemplateGallery from './TemplateGallery';
import './Header.css';

const Header: React.FC = () => {
  const { nodes, edges, diagramId, setDiagramId, isSaving } = useDiagramStore(
    useShallow((state) => ({
      nodes: state.nodes,
      edges: state.edges,
      diagramId: state.diagramId,
      setDiagramId: state.setDiagramId,
      isSaving: state.isSaving,
    })),
  );
  const { pastLength, futureLength } = useHistoryStore(
    useShallow((state) => ({
      pastLength: state.past.length,
      futureLength: state.future.length,
    })),
  );
  const { undoCommand, redoCommand, clearCanvasCommand } = useDiagramCommands();
  const { mode, preference, setTheme } = useThemeStore(
    useShallow((state) => ({
      mode: state.mode,
      preference: state.preference,
      setTheme: state.setTheme,
    })),
  );
  const [isManualSaving, setIsManualSaving] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const handleThemeToggle = () => {
    setTheme(mode === 'dark' ? 'light' : 'dark');
  };

  const handleSave = async () => {
    setIsManualSaving(true);

    try {
      const result = await saveDiagramToApi({ id: diagramId ?? undefined, nodes, edges });

      if (result.created) {
        setDiagramId(result.id);
        window.history.pushState(null, '', `?id=${result.id}`);
      }
    } catch (error) {
      console.error('Error saving diagram:', error);
      alert('Failed to save diagram');
    } finally {
      setIsManualSaving(false);
    }
  };

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="header-title">Flow Diagram App</div>
        <div className="header-subtitle">Production workflow builder</div>
      </div>
      <div className="header-actions">
        {nodes.length > 0 ? (
          <div className={`save-status ${isSaving ? 'saving' : 'saved'}`} key={`${isSaving}`}>
            {isSaving ? 'Saving...' : 'Draft Saved'}
          </div>
        ) : null}

        <div className="history-controls">
          <button
            className="btn-history btn-theme"
            onClick={handleThemeToggle}
            title={
              preference === 'system'
                ? `Using system theme (${mode}). Click to override.`
                : `Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`
            }
          >
            <span className="icon" aria-hidden="true">
              {mode === 'dark' ? (
                <SunMedium size={15} strokeWidth={1.9} />
              ) : (
                <MoonStar size={15} strokeWidth={1.9} />
              )}
            </span>
            {preference === 'system'
              ? `System ${mode}`
              : mode === 'dark'
                ? 'Light Mode'
                : 'Dark Mode'}
          </button>
          <ThemePanel />
          <button
            className="btn-history"
            onClick={undoCommand}
            disabled={pastLength === 0}
            title="Undo (Ctrl+Z)"
          >
            <span className="icon">↩</span> Undo
          </button>
          <button
            className="btn-history"
            onClick={redoCommand}
            disabled={futureLength === 0}
            title="Redo (Ctrl+Y)"
          >
            Redo <span className="icon">↪</span>
          </button>
        </div>

        <div className="divider" />

        <button
          className="btn-history btn-templates"
          onClick={() => setGalleryOpen(true)}
          title="Browse templates"
        >
          <span className="icon" aria-hidden="true">
            <LayoutTemplate size={15} strokeWidth={1.9} />
          </span>
          Templates
        </button>

        <div className="divider" />

        <ExportMenu />

        <div className="divider" />

        <button
          className="btn-clear"
          onClick={clearCanvasCommand}
          title="Clear all nodes and edges"
        >
          Clear Canvas
        </button>

        <div className="divider" />

        {diagramId ? <span className="diagram-id-label">ID: {diagramId}</span> : null}
        <button className="btn-save" onClick={handleSave} disabled={isManualSaving}>
          {isManualSaving ? 'Updating...' : 'Save Cloud'}
        </button>

      </div>
      <TemplateGallery open={galleryOpen} onClose={() => setGalleryOpen(false)} />
    </header>
  );
};

export default Header;
