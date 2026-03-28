import React from 'react';
import type { NodeLibraryCategory } from './nodeDesignSystem';
import { getCategoryColors } from './nodeDesignSystem';

type NodeBaseProps = {
  category: NodeLibraryCategory;
  className?: string;
  isActive?: boolean;
  backgroundOverride?: string | null;
  width?: number;
  height?: number;
  icon: React.ReactNode;
  overlay?: React.ReactNode;
  children: React.ReactNode;
  onDoubleClick?: React.MouseEventHandler<HTMLDivElement>;
};

function normalizeHexColor(value: string) {
  const trimmed = value.trim();
  const hex = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;

  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return `#${hex
      .split('')
      .map((char) => `${char}${char}`)
      .join('')
      .toLowerCase()}`;
  }

  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `#${hex.toLowerCase()}`;
  }

  return null;
}

function getNodeLabelColor(backgroundOverride?: string | null) {
  if (!backgroundOverride) {
    return 'var(--theme-node-label)';
  }

  const normalized = normalizeHexColor(backgroundOverride);

  if (!normalized) {
    return 'var(--theme-node-label)';
  }

  const r = Number.parseInt(normalized.slice(1, 3), 16);
  const g = Number.parseInt(normalized.slice(3, 5), 16);
  const b = Number.parseInt(normalized.slice(5, 7), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

  return luminance > 0.68 ? '#0f172a' : '#f8fafc';
}

const NodeBase: React.FC<NodeBaseProps> = ({
  category,
  className,
  isActive = false,
  backgroundOverride,
  width,
  height,
  icon,
  overlay,
  children,
  onDoubleClick,
}) => {
  const colors = getCategoryColors(category);

  return (
    <div
      className={['node-shell', className, isActive ? 'is-active' : ''].filter(Boolean).join(' ')}
      data-node-category={category}
      data-node-tone={colors.tone}
      onDoubleClick={onDoubleClick}
      style={
        {
          width,
          height,
          '--node-background': backgroundOverride ?? 'var(--theme-node-surface, #eff6ff)',
          '--node-border': colors.border,
          '--node-icon': colors.icon,
          '--node-label-color': getNodeLabelColor(backgroundOverride),
          '--node-glow': colors.glow,
          '--node-shadow': colors.shadow,
          '--node-shadow-hover': colors.shadowHover,
        } as React.CSSProperties
      }
    >
      {overlay}
      <div className="node-shell__body">
        <span className="node-shell__icon" aria-hidden="true">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
};

export default React.memo(NodeBase);
