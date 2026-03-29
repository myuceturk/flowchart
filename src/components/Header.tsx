import React, { useCallback, useState } from 'react';
import { LayoutTemplate, MoonStar, SunMedium } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useThemeStore } from '../theme';
import { saveDiagramToApi } from '../app/services/diagramPersistence';
import { useDiagramCommands } from '../hooks/useDiagramCommands';
import useDiagramStore from '../store/useDiagramStore';
import useHistoryStore from '../store/useHistoryStore';
import useAuthStore from '../store/useAuthStore';
import useCollaborationStore from '../store/useCollaborationStore';
import ThemePanel from './ThemePanel';
import ExportMenu from './ExportMenu';
import TemplateGallery from './TemplateGallery';
import './Header.css';

const Header: React.FC = () => {
  // Subscribe only to the boolean and scalars we need for rendering.
  // nodes/edges are read imperatively in handleSave so Header doesn't
  // re-render on every diagram edit just to check `nodes.length > 0`.
  const { hasNodes, diagramId, setDiagramId, isSaving } = useDiagramStore(
    useShallow((state) => ({
      hasNodes: state.nodes.length > 0,
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
  const { isAuthenticated, user, logout, openAuthModal } = useAuthStore(
    useShallow((s) => ({
      isAuthenticated: s.isAuthenticated,
      user: s.user,
      logout: s.logout,
      openAuthModal: s.openAuthModal,
    })),
  );
  const activeUsers = useCollaborationStore((s) => s.activeUsers);
  const MAX_VISIBLE_AVATARS = 5;

  const [isManualSaving, setIsManualSaving] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const handleThemeToggle = useCallback(() => {
    setTheme(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setTheme]);

  const handleOpenGallery = useCallback(() => setGalleryOpen(true), []);
  const handleCloseGallery = useCallback(() => setGalleryOpen(false), []);

  const handleSave = useCallback(async () => {
    setIsManualSaving(true);

    // Read the current snapshot imperatively — no subscription needed.
    const { nodes, edges } = useDiagramStore.getState();

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
  }, [diagramId, setDiagramId]);

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="header-title">Flow Diagram App</div>
        <div className="header-subtitle">Production workflow builder</div>
      </div>
      <div className="header-actions">
        {hasNodes ? (
          <div
            className={`save-status ${isSaving ? 'saving' : 'saved'}`}
            key={`${isSaving}`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {isSaving ? 'Saving...' : 'Draft Saved'}
          </div>
        ) : null}

        <div className="history-controls">
          <button
            className="btn-history btn-theme"
            onClick={handleThemeToggle}
            aria-label={
              preference === 'system'
                ? `Using system theme (${mode}). Click to override.`
                : `Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`
            }
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
            aria-label="Undo (Ctrl+Z)"
            title="Undo (Ctrl+Z)"
          >
            <span className="icon" aria-hidden="true">↩</span> Undo
          </button>
          <button
            className="btn-history"
            onClick={redoCommand}
            disabled={futureLength === 0}
            aria-label="Redo (Ctrl+Y)"
            title="Redo (Ctrl+Y)"
          >
            Redo <span className="icon" aria-hidden="true">↪</span>
          </button>
        </div>

        <div className="divider" />

        <button
          className="btn-history btn-templates"
          onClick={handleOpenGallery}
          aria-label="Browse templates"
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
          aria-label="Clear all nodes and edges"
          title="Clear all nodes and edges"
        >
          Clear Canvas
        </button>

        <div className="divider" />

        {diagramId ? <span className="diagram-id-label">ID: {diagramId}</span> : null}
        <button
          className="btn-save"
          onClick={handleSave}
          disabled={isManualSaving}
          aria-label={isManualSaving ? 'Updating diagram…' : 'Save diagram to cloud'}
        >
          {isManualSaving ? 'Updating...' : 'Save Cloud'}
        </button>

        <div className="divider" />

        {isAuthenticated && activeUsers.length > 0 && (
          <>
            <div className="collaborator-avatars" role="list" aria-label="Active collaborators">
              {activeUsers.slice(0, MAX_VISIBLE_AVATARS).map((collaborator) => (
                <span
                  key={collaborator.id}
                  role="listitem"
                  className="collaborator-avatar"
                  style={{ background: collaborator.color }}
                  title={collaborator.name}
                  aria-label={collaborator.name}
                >
                  {collaborator.name[0].toUpperCase()}
                </span>
              ))}
              {activeUsers.length > MAX_VISIBLE_AVATARS && (
                <span
                  className="collaborator-overflow"
                  title={`${activeUsers.length - MAX_VISIBLE_AVATARS} more collaborators`}
                >
                  +{activeUsers.length - MAX_VISIBLE_AVATARS}
                </span>
              )}
            </div>
            <div className="divider" />
          </>
        )}

        {isAuthenticated && user ? (
          <div className="auth-user">
            <span className="auth-avatar" aria-label={user.email} title={user.email}>
              {user.email[0].toUpperCase()}
            </span>
            <button
              className="btn-history btn-logout"
              onClick={logout}
              aria-label="Sign out"
              title="Sign out"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            className="btn-signin"
            onClick={openAuthModal}
            aria-label="Sign in"
          >
            Sign In
          </button>
        )}

      </div>
      <TemplateGallery open={galleryOpen} onClose={handleCloseGallery} />
    </header>
  );
};

export default React.memo(Header);
