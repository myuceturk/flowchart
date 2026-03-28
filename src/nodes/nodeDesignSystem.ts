export type NodeLibraryCategory = 'Flowchart' | 'Product' | 'Technical' | 'Content' | 'Advanced';
export type NodeTone = 'blue' | 'purple' | 'orange' | 'green' | 'gray';

export type NodeColorTokens = {
  tone: NodeTone;
  background: string;
  border: string;
  icon: string;
  glow: string;
  shadow: string;
  shadowHover: string;
};

export const categoryColorSystem: Record<NodeLibraryCategory, NodeColorTokens> = {
  Flowchart: {
    tone: 'blue',
    background: '#eff6ff',
    border: '#93c5fd',
    icon: '#2563eb',
    glow: 'rgba(37, 99, 235, 0.22)',
    shadow: '0 14px 32px rgba(37, 99, 235, 0.12), 0 4px 10px rgba(15, 23, 42, 0.08)',
    shadowHover: '0 18px 40px rgba(37, 99, 235, 0.18), 0 10px 18px rgba(15, 23, 42, 0.1)',
  },
  Product: {
    tone: 'purple',
    background: '#f5f3ff',
    border: '#c4b5fd',
    icon: '#7c3aed',
    glow: 'rgba(124, 58, 237, 0.22)',
    shadow: '0 14px 32px rgba(124, 58, 237, 0.12), 0 4px 10px rgba(15, 23, 42, 0.08)',
    shadowHover: '0 18px 40px rgba(124, 58, 237, 0.18), 0 10px 18px rgba(15, 23, 42, 0.1)',
  },
  Technical: {
    tone: 'orange',
    background: '#fff7ed',
    border: '#fdba74',
    icon: '#ea580c',
    glow: 'rgba(234, 88, 12, 0.2)',
    shadow: '0 14px 32px rgba(234, 88, 12, 0.12), 0 4px 10px rgba(15, 23, 42, 0.08)',
    shadowHover: '0 18px 40px rgba(234, 88, 12, 0.18), 0 10px 18px rgba(15, 23, 42, 0.1)',
  },
  Content: {
    tone: 'green',
    background: '#ecfdf5',
    border: '#86efac',
    icon: '#16a34a',
    glow: 'rgba(22, 163, 74, 0.2)',
    shadow: '0 14px 32px rgba(22, 163, 74, 0.12), 0 4px 10px rgba(15, 23, 42, 0.08)',
    shadowHover: '0 18px 40px rgba(22, 163, 74, 0.18), 0 10px 18px rgba(15, 23, 42, 0.1)',
  },
  Advanced: {
    tone: 'gray',
    background: '#f8fafc',
    border: '#cbd5e1',
    icon: '#475569',
    glow: 'rgba(71, 85, 105, 0.2)',
    shadow: '0 14px 32px rgba(71, 85, 105, 0.1), 0 4px 10px rgba(15, 23, 42, 0.08)',
    shadowHover: '0 18px 40px rgba(71, 85, 105, 0.14), 0 10px 18px rgba(15, 23, 42, 0.1)',
  },
};

export function getCategoryColors(category: NodeLibraryCategory) {
  return categoryColorSystem[category];
}
