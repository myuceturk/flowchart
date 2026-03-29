import React, { memo, useCallback } from 'react';

type SidebarCategoryProps = {
  id: string;
  title: string;
  icon: React.ReactNode;
  collapsed: boolean;
  expanded: boolean;
  onToggle: (categoryId: string) => void;
  children: React.ReactNode;
};

const SidebarCategory: React.FC<SidebarCategoryProps> = ({
  id,
  title,
  icon,
  collapsed,
  expanded,
  onToggle,
  children,
}) => {
  const isOpen = collapsed || expanded;

  // Stable wrapper so the trigger button doesn't get a new function reference
  // on every SidebarCategory render when onToggle and id haven't changed.
  const handleTriggerClick = useCallback(() => onToggle(id), [onToggle, id]);

  if (collapsed) {
    return (
      <section className="sidebar-category sidebar-category--collapsed is-open" aria-label={title}>
        <div
          id={`sidebar-category-${id}`}
          className="sidebar-category__content"
        >
          <div className="sidebar-category__content-inner">{children}</div>
        </div>
      </section>
    );
  }

  return (
    <section className={`sidebar-category ${isOpen ? 'is-open' : ''}`} aria-label={title}>
      <button
        type="button"
        className="sidebar-category__trigger"
        onClick={handleTriggerClick}
        aria-expanded={isOpen}
        aria-controls={`sidebar-category-${id}`}
        title={collapsed ? title : undefined}
      >
        <span className="sidebar-category__title-wrap">
          <span className="sidebar-category__icon" aria-hidden="true">{icon}</span>
          {!collapsed ? (
            <span
              className="sidebar-category__title"
              role="heading"
              aria-level={3}
            >
              {title}
            </span>
          ) : null}
        </span>
        {!collapsed ? (
          <span className="sidebar-category__chevron" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m8 10 4 4 4-4" />
            </svg>
          </span>
        ) : null}
      </button>

      <div
        id={`sidebar-category-${id}`}
        className="sidebar-category__content"
      >
        <div className="sidebar-category__content-inner">{children}</div>
      </div>
    </section>
  );
};

export default memo(SidebarCategory);
