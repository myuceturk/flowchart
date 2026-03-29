import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, List, MoreHorizontal, Home, Star, Clock, Settings } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useDashboardStore from '../store/useDashboardStore';
import type { DiagramSummary } from '../store/useDashboardStore';
import TemplateGallery from '../components/TemplateGallery';
import { timeAgo } from '../utils/timeAgo';
import type { DiagramTemplate } from '../data/templates';
import './DashboardPage.css';

// ─── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="db-card db-card--skeleton" aria-hidden="true">
      <div className="db-card__thumb db-card__thumb--skeleton" />
      <div className="db-card__body">
        <div className="db-card__skeleton-line db-card__skeleton-line--title" />
        <div className="db-card__skeleton-line db-card__skeleton-line--sub" />
      </div>
    </div>
  );
}

// ─── Three-dot menu ───────────────────────────────────────────────────────────
interface CardMenuProps {
  diagram: DiagramSummary;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function CardMenu({ diagram: _diagram, onOpen, onRename, onDelete }: CardMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handle = (cb: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    cb();
  };

  return (
    <div className="db-card__menu" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        className="db-card__menu-trigger"
        aria-label="Seçenekler"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <ul className="db-card__dropdown" role="menu">
          <li role="menuitem"><button onClick={handle(onOpen)}>Aç</button></li>
          <li role="menuitem"><button onClick={handle(onRename)}>Yeniden adlandır</button></li>
          <li role="menuitem" className="db-card__dropdown-item--danger">
            <button onClick={handle(onDelete)}>Sil</button>
          </li>
        </ul>
      )}
    </div>
  );
}

// ─── Diagram card ─────────────────────────────────────────────────────────────
interface DiagramCardProps {
  diagram: DiagramSummary;
  viewMode: 'grid' | 'list';
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, current: string) => void;
}

function DiagramCard({ diagram, viewMode, onOpen, onDelete, onRename }: DiagramCardProps) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(diagram.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commitRename = () => {
    setEditing(false);
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== diagram.title) {
      onRename(diagram.id, trimmed);
    } else {
      setDraftTitle(diagram.title);
    }
  };

  return (
    <div
      className={`db-card ${viewMode === 'list' ? 'db-card--list' : ''}`}
      onClick={() => onOpen(diagram.id)}
      role="button"
      tabIndex={0}
      aria-label={`${diagram.title} diyagramını aç`}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(diagram.id); }}
    >
      <div className="db-card__thumb">
        <span className="db-card__node-count">{diagram.nodeCount} node</span>
      </div>

      <div className="db-card__body">
        {editing ? (
          <input
            ref={inputRef}
            className="db-card__title-input"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') { setDraftTitle(diagram.title); setEditing(false); }
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <p
            className="db-card__title"
            onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
            title="Yeniden adlandırmak için çift tıkla"
          >
            {diagram.title}
          </p>
        )}
        <p className="db-card__meta">Son düzenleme: {timeAgo(diagram.updatedAt)}</p>
      </div>

      <CardMenu
        diagram={diagram}
        onOpen={() => onOpen(diagram.id)}
        onRename={() => { setEditing(true); setDraftTitle(diagram.title); }}
        onDelete={() => onDelete(diagram.id)}
      />
    </div>
  );
}

// ─── Delete confirmation dialog ───────────────────────────────────────────────
interface DeleteDialogProps {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteDialog({ title, onConfirm, onCancel }: DeleteDialogProps) {
  return (
    <div className="db-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="db-dialog-title">
      <div className="db-dialog">
        <h3 id="db-dialog-title" className="db-dialog__title">Diyagramı sil</h3>
        <p className="db-dialog__body">
          <strong>"{title}"</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz.
        </p>
        <div className="db-dialog__actions">
          <button className="db-btn db-btn--ghost" onClick={onCancel}>İptal</button>
          <button className="db-btn db-btn--danger" onClick={onConfirm}>Sil</button>
        </div>
      </div>
    </div>
  );
}

// ─── User avatar ──────────────────────────────────────────────────────────────
function UserAvatar({ name, email }: { name?: string; email: string }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : email[0].toUpperCase();
  return (
    <div className="db-avatar" aria-hidden="true" title={name ?? email}>
      {initials}
    </div>
  );
}

// ─── DashboardPage ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { diagrams, isLoading, error, fetchDiagrams, createDiagram, deleteDiagram, renameDiagram } =
    useDashboardStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DiagramSummary | null>(null);

  useEffect(() => {
    fetchDiagrams();
  }, [fetchDiagrams]);

  const handleOpen = useCallback(
    (id: string) => navigate(`/app/diagram/${id}`),
    [navigate],
  );

  const handleNewBlank = useCallback(async () => {
    const id = await createDiagram([], [], '');
    navigate(`/app/diagram/${id}`);
  }, [createDiagram, navigate]);

  const handleTemplateSelect = useCallback(
    async (template: DiagramTemplate) => {
      const id = await createDiagram(template.nodes, template.edges, template.name);
      navigate(`/app/diagram/${id}`);
    },
    [createDiagram, navigate],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteDiagram(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, deleteDiagram]);

  const handleRename = useCallback(
    async (id: string, title: string) => {
      await renameDiagram(id, title);
    },
    [renameDiagram],
  );

  return (
    <div className="db-layout">
      {/* ── Sidebar ── */}
      <aside className="db-sidebar">
        <div className="db-sidebar__top">
          <div className="db-sidebar__brand">
            <span className="db-sidebar__logo">◈</span>
            <span className="db-sidebar__brand-name">FlowDiagram</span>
          </div>
        </div>

        <nav className="db-sidebar__nav" aria-label="Ana navigasyon">
          <button className="db-nav-item db-nav-item--active">
            <Home size={16} />
            Ana Sayfa
          </button>
          <button className="db-nav-item db-nav-item--soon" disabled title="Yakında">
            <Clock size={16} />
            Son Açılanlar
            <span className="db-soon-badge">Yakında</span>
          </button>
          <button className="db-nav-item db-nav-item--soon" disabled title="Yakında">
            <Star size={16} />
            Yıldızlılar
            <span className="db-soon-badge">Yakında</span>
          </button>
        </nav>

        <div className="db-sidebar__bottom">
          <button className="db-nav-item" disabled title="Yakında">
            <Settings size={16} />
            Ayarlar
          </button>
          <div className="db-sidebar__user">
            <UserAvatar name={user?.name} email={user?.email ?? ''} />
            <div className="db-sidebar__user-info">
              <span className="db-sidebar__user-name">{user?.name ?? user?.email}</span>
              {user?.name && <span className="db-sidebar__user-email">{user.email}</span>}
            </div>
            <button className="db-sidebar__logout" onClick={logout} title="Çıkış yap">
              ⎋
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="db-main">
        {/* Header row */}
        <div className="db-main__header">
          <h1 className="db-main__title">Diyagramlarım</h1>
          <button
            className="db-btn db-btn--primary"
            onClick={() => setShowTemplateGallery(true)}
          >
            + Yeni Diyagram
          </button>
        </div>

        {/* Template strip */}
        <section className="db-templates" aria-label="Hızlı başlangıç şablonları">
          <h2 className="db-section-title">Şablonlar</h2>
          <div className="db-templates__strip">
            <button className="db-tpl-chip db-tpl-chip--blank" onClick={handleNewBlank}>
              <span className="db-tpl-chip__icon">＋</span>
              Boş Kanvas
            </button>
            {['Onay Akışı', 'Yazılım Süreci', 'Müşteri Yolculuğu'].map((name) => (
              <button
                key={name}
                className="db-tpl-chip"
                onClick={() => setShowTemplateGallery(true)}
                title={`${name} şablonunu seç`}
              >
                <span className="db-tpl-chip__icon">◻</span>
                {name}
              </button>
            ))}
            <button className="db-tpl-chip db-tpl-chip--more" onClick={() => setShowTemplateGallery(true)}>
              Tümünü gör →
            </button>
          </div>
        </section>

        {/* Diagrams section */}
        <section className="db-diagrams" aria-label="Diyagram listesi">
          <div className="db-diagrams__toolbar">
            <h2 className="db-section-title">Son Diyagramlar</h2>
            <div className="db-view-toggle" role="group" aria-label="Görünüm">
              <button
                className={`db-view-btn ${viewMode === 'grid' ? 'db-view-btn--active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid görünümü"
                aria-pressed={viewMode === 'grid'}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                className={`db-view-btn ${viewMode === 'list' ? 'db-view-btn--active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="Liste görünümü"
                aria-pressed={viewMode === 'list'}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className={`db-grid ${viewMode === 'list' ? 'db-grid--list' : ''}`}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="db-state db-state--error">
              <p>{error}</p>
              <button className="db-btn db-btn--ghost" onClick={fetchDiagrams}>Tekrar dene</button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && diagrams.length === 0 && (
            <div className="db-state db-state--empty">
              <div className="db-state__icon">◈</div>
              <h3 className="db-state__heading">Henüz bir diyagramın yok</h3>
              <p className="db-state__sub">Akışlarını görselleştirmek için ilk diyagramını oluştur.</p>
              <button
                className="db-btn db-btn--primary"
                onClick={() => setShowTemplateGallery(true)}
              >
                + İlk diyagramını oluştur
              </button>
            </div>
          )}

          {/* Cards */}
          {!isLoading && !error && diagrams.length > 0 && (
            <div className={`db-grid ${viewMode === 'list' ? 'db-grid--list' : ''}`}>
              {diagrams.map((d) => (
                <DiagramCard
                  key={d.id}
                  diagram={d}
                  viewMode={viewMode}
                  onOpen={handleOpen}
                  onDelete={(id) => setDeleteTarget(diagrams.find((x) => x.id === id) ?? null)}
                  onRename={handleRename}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── Template gallery modal ── */}
      <TemplateGallery
        open={showTemplateGallery}
        onClose={() => setShowTemplateGallery(false)}
        onSelect={handleTemplateSelect}
      />

      {/* ── Delete confirmation ── */}
      {deleteTarget && (
        <DeleteDialog
          title={deleteTarget.title}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
