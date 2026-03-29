import React, { memo, useId, useState } from 'react';

type SidebarItemTone = 'blue' | 'purple' | 'orange' | 'green' | 'gray';

export interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  collapsed: boolean;
  active?: boolean;
  disabled?: boolean;
  tone?: SidebarItemTone;
  draggable?: boolean;
  isPlaceholder?: boolean;
  indicator?: string;
  onClick?: () => void;
  onDragStart?: (event: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  description,
  collapsed,
  active = false,
  disabled = false,
  tone = 'gray',
  draggable = false,
  isPlaceholder = false,
  indicator,
  onClick,
  onDragStart,
  onDragEnd,
}) => {
  const descId = useId();
  const [isGrabbed, setIsGrabbed] = useState(false);

  const className = [
    'sidebar-item',
    `sidebar-item--${tone}`,
    active ? 'is-active' : '',
    disabled ? 'is-disabled' : '',
    collapsed ? 'is-collapsed' : '',
    isPlaceholder ? 'is-placeholder' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
    setIsGrabbed(true);
    onDragStart?.(e);
  };

  const handleDragEnd = () => {
    setIsGrabbed(false);
    onDragEnd?.();
  };

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      draggable={draggable && !disabled}
      disabled={disabled}
      aria-label={label}
      aria-grabbed={draggable ? isGrabbed : undefined}
      aria-describedby={description ? descId : undefined}
    >
      <span className="sidebar-item__indicator" aria-hidden="true" />
      <span className="sidebar-item__icon" aria-hidden="true">{icon}</span>
      {!collapsed && (
        <>
          <span className="sidebar-item__label">{label}</span>
          {description ? (
            <span id={descId} className="sidebar-item__description">{description}</span>
          ) : null}
        </>
      )}
      {!collapsed && (indicator || disabled) ? (
        <span className="sidebar-item__badge">{indicator ?? 'Soon'}</span>
      ) : null}
      {collapsed ? (
        <span className="sidebar-item__tooltip" role="tooltip" aria-hidden="true">
          {label}
        </span>
      ) : null}
    </button>
  );
};

export default memo(SidebarItem);
