import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronRight,
  LayoutTemplate,
  Loader2,
  MoonStar,
  SunMedium,
} from 'lucide-react';
import { Link, useBlocker, useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useThemeStore } from '../theme';
import { saveDiagramToApi, saveAutosavedDiagram } from '../app/services/diagramPersistence';
import { useDiagramCommands } from '../hooks/useDiagramCommands';
import useDiagramStore from '../store/useDiagramStore';
import useHistoryStore from '../store/useHistoryStore';
import useAuthStore from '../store/useAuthStore';
import useCollaborationStore from '../store/useCollaborationStore';
import { API_URL } from '../config';
import ThemePanel from './ThemePanel';
import ExportMenu from './ExportMenu';
import TemplateGallery from './TemplateGallery';
import './Header.css';

const Header: React.FC = () => {
  // Subscribe only to scalars/booleans needed for rendering.
  // nodes/edges are read imperatively in handleSave to avoid re-renders on every edit.
  const {
    hasNodes,
    diagramId,
    diagramTitle,
    setDiagramId,
    setDiagramTitle,
    saveStatus,
    isSaving,
  } = useDiagramStore(
    useShallow((state) => ({
      hasNodes: state.nodes.length > 0,
      diagramId: state.diagramId,
      diagramTitle: state.diagramTitle,
      setDiagramId: state.setDiagramId,
      setDiagramTitle: state.setDiagramTitle,
      saveStatus: state.saveStatus,
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
  const navigate = useNavigate();

  const [isManualSaving, setIsManualSaving] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  // ── Inline title editing ─────────────────────────────────────────────────────
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.select();
  }, [isEditingTitle]);

  const handleTitleClick = useCallback(() => {
    setTitleDraft(diagramTitle ?? '');
    setIsEditingTitle(true);
  }, [diagramTitle]);

  const commitTitleSave = useCallback(async () => {
    setIsEditingTitle(false);
    if (!diagramId) return;
    const trimmed = titleDraft.trim();
    const newTitle = trimmed || 'İsimsiz Diyagram';
    const prevTitle = diagramTitle;
    if (newTitle === prevTitle) return;
    // Optimistic update
    setDiagramTitle(newTitle);
    try {
      const headers = useAuthStore.getState().getAuthHeaders();
      const res = await fetch(`${API_URL}/diagrams/${diagramId}/title`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!res.ok) throw new Error('Rename failed');
    } catch {
      // Rollback on failure
      setDiagramTitle(prevTitle ?? null);
    }
  }, [titleDraft, diagramId, diagramTitle, setDiagramTitle]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') void commitTitleSave();
      if (e.key === 'Escape') {
        setIsEditingTitle(false);
        setTitleDraft('');
      }
    },
    [commitTitleSave],
  );

  // ── Unsaved-changes navigation blocker ──────────────────────────────────────
  const blocker = useBlocker(isSaving);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  const handleThemeToggle = useCallback(() => {
    setTheme(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setTheme]);

  const handleOpenGallery = useCallback(() => setGalleryOpen(true), []);
  const handleCloseGallery = useCallback(() => setGalleryOpen(false), []);

  const handleSave = useCallback(async () => {
    setIsManualSaving(true);
    const { nodes, edges } = useDiagramStore.getState();
    try {
      const result = await saveDiagramToApi({ id: diagramId ?? undefined, nodes, edges });
      if (result.created) {
        setDiagramId(result.id);
        navigate(`/app/diagram/${result.id}`, { replace: true });
      }
    } catch (error) {
      console.error('Error saving diagram:', error);
      alert('Failed to save diagram');
    } finally {
      setIsManualSaving(false);
    }
  }, [diagramId, setDiagramId, navigate]);

  const handleRetrySave = useCallback(() => {
    const { nodes, edges, setSaveStatus } = useDiagramStore.getState();
    setSaveStatus('saving');
    try {
      saveAutosavedDiagram({ nodes, edges });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <header className="app-header">
        {/* ── Left: back button + breadcrumb ── */}
        <div className="header-brand">
          <button
            className="header-back-btn"
            onClick={() => navigate('/app')}
            aria-label="Diyagramlarıma dön"
            title="Diyagramlarıma dön"
          >
            <ArrowLeft size={15} strokeWidth={1.9} />
          </button>
          <nav className="header-breadcrumb" aria-label="Konum">
            <Link to="/app" className="header-breadcrumb__link">
              Diyagramlarım
            </Link>
            <ChevronRight size={13} className="header-breadcrumb__sep" aria-hidden="true" />
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                className="header-title-input"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={() => void commitTitleSave()}
                onKeyDown={handleTitleKeyDown}
                placeholder="İsimsiz Diyagram"
                aria-label="Diyagram başlığı"
              />
            ) : (
              <button
                className="header-breadcrumb__title"
                onClick={handleTitleClick}
                title="Başlığı düzenlemek için tıkla"
                aria-label={`Başlık: ${diagramTitle || 'İsimsiz Diyagram'}. Düzenlemek için tıkla.`}
              >
                {diagramTitle || 'İsimsiz Diyagram'}
              </button>
            )}
          </nav>
        </div>

        {/* ── Right: actions ── */}
        <div className="header-actions">
          {/* Auto-save status indicator */}
          {hasNodes && saveStatus !== 'idle' && (
            <div
              className={`save-status save-status--${saveStatus}`}
              key={saveStatus}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {saveStatus === 'saving' && (
                <>
                  <Loader2 size={12} className="save-status__spinner" aria-hidden="true" />
                  Kaydediliyor...
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check size={12} aria-hidden="true" />
                  az önce kaydedildi
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <AlertTriangle size={12} aria-hidden="true" />
                  Kayıt hatası{' '}
                  <button className="save-retry-btn" onClick={handleRetrySave}>
                    tekrar dene
                  </button>
                </>
              )}
            </div>
          )}

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
              aria-label="Geri al (Ctrl+Z)"
              title="Geri al (Ctrl+Z)"
            >
              <span className="icon" aria-hidden="true">↩</span> Geri Al
            </button>
            <button
              className="btn-history"
              onClick={redoCommand}
              disabled={futureLength === 0}
              aria-label="İleri al (Ctrl+Y)"
              title="İleri al (Ctrl+Y)"
            >
              İleri Al <span className="icon" aria-hidden="true">↪</span>
            </button>
          </div>

          <div className="divider" />

          <button
            className="btn-history btn-templates"
            onClick={handleOpenGallery}
            aria-label="Şablonlara göz at"
            title="Şablonlara göz at"
          >
            <span className="icon" aria-hidden="true">
              <LayoutTemplate size={15} strokeWidth={1.9} />
            </span>
            Şablonlar
          </button>

          <div className="divider" />

          <ExportMenu />

          <div className="divider" />

          <button
            className="btn-clear"
            onClick={clearCanvasCommand}
            aria-label="Tüm node ve edge'leri temizle"
            title="Tüm node ve edge'leri temizle"
          >
            Temizle
          </button>

          <div className="divider" />

          <button
            className="btn-save"
            onClick={handleSave}
            disabled={isManualSaving}
            aria-label={isManualSaving ? 'Diyagram güncelleniyor…' : 'Diyagramı buluta kaydet'}
          >
            {isManualSaving ? 'Kaydediliyor...' : 'Buluta Kaydet'}
          </button>

          <div className="divider" />

          {isAuthenticated && activeUsers.length > 0 && (
            <>
              <div className="collaborator-avatars" role="list" aria-label="Aktif ortak çalışanlar">
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
                    title={`${activeUsers.length - MAX_VISIBLE_AVATARS} kişi daha`}
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
                onClick={handleLogout}
                aria-label="Çıkış yap"
                title="Çıkış yap"
              >
                Çıkış
              </button>
            </div>
          ) : (
            <button className="btn-signin" onClick={openAuthModal} aria-label="Giriş yap">
              Giriş Yap
            </button>
          )}
        </div>
      </header>

      {/* ── Unsaved-changes blocker dialog ── */}
      {blocker.state === 'blocked' && (
        <div className="blocker-overlay" role="dialog" aria-modal="true" aria-labelledby="blocker-title">
          <div className="blocker-dialog">
            <h3 id="blocker-title" className="blocker-dialog__title">
              Kaydedilmemiş değişiklikler
            </h3>
            <p className="blocker-dialog__body">
              Değişiklikler kaydedilmedi. Çıkmak istiyor musun?
            </p>
            <div className="blocker-dialog__actions">
              <button className="blocker-btn blocker-btn--ghost" onClick={() => blocker.reset()}>
                Sayfada kal
              </button>
              <button className="blocker-btn blocker-btn--danger" onClick={() => blocker.proceed()}>
                Çık
              </button>
            </div>
          </div>
        </div>
      )}

      <TemplateGallery open={galleryOpen} onClose={handleCloseGallery} />
    </>
  );
};

export default React.memo(Header);
