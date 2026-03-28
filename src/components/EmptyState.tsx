import React from 'react';
import { Shapes } from 'lucide-react';
import './EmptyState.css';

type EmptyStateProps = {
  onOpenTemplates: () => void;
};

const EmptyState: React.FC<EmptyStateProps> = ({ onOpenTemplates }) => (
  <div className="empty-state">
    <div className="empty-state__card">
      <Shapes size={40} strokeWidth={1.4} className="empty-state__icon" />
      <p className="empty-state__text">Drag a shape to get started</p>
      <button type="button" className="empty-state__button" onClick={onOpenTemplates}>
        or choose a template &rarr;
      </button>
    </div>
  </div>
);

export default React.memo(EmptyState);
