import type { AppNodeType } from '../nodes/types';

const S = 28;
const fill = 'color-mix(in srgb, var(--theme-primary, #38bdf8) 18%, transparent)';
const stroke = 'var(--theme-primary, #38bdf8)';

const shapes: Partial<Record<AppNodeType, string>> = {
  process: `<rect x="1" y="4" width="26" height="20" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`,
  startEnd: `<rect x="1" y="4" width="26" height="20" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`,
  decision: `<polygon points="14,2 26,14 14,26 2,14" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`,
  inputOutput: `<polygon points="6,4 27,4 22,24 1,24" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`,
  document: `<path d="M1 4 H27 V20 C22 26, 6 14, 1 20 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`,
  database: `<path d="M1 8 A13 4 0 0 1 27 8 V20 A13 4 0 0 1 1 20 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/><ellipse cx="14" cy="8" rx="13" ry="4" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`,
  subprocess: `<rect x="1" y="4" width="26" height="20" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/><line x1="5" y1="4" x2="5" y2="24" stroke="${stroke}" stroke-width="1.5"/><line x1="23" y1="4" x2="23" y2="24" stroke="${stroke}" stroke-width="1.5"/>`,
  manualInput: `<polygon points="6,2 27,2 27,24 1,24" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`,
  annotation: `<rect x="1" y="2" width="26" height="24" rx="2" fill="#fef3c7" stroke="#eab308" stroke-width="1.2"/><polygon points="21,2 27,2 27,8" fill="#fde68a" stroke="#eab308" stroke-width="0.8"/>`,
  connector: `<polygon points="1,2 18,2 27,14 18,26 1,26" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`,
  swimlane: `<rect x="1" y="2" width="26" height="24" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="1.2" stroke-dasharray="3 2"/><line x1="8" y1="2" x2="8" y2="26" stroke="${stroke}" stroke-width="1"/>`,
  user: `<rect x="1" y="4" width="26" height="20" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`,
  screen: `<rect x="1" y="2" width="26" height="20" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/><line x1="10" y1="22" x2="18" y2="22" stroke="${stroke}" stroke-width="1.2"/><line x1="14" y1="22" x2="14" y2="26" stroke="${stroke}" stroke-width="1.2"/>`,
  apiCall: `<rect x="1" y="4" width="26" height="20" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`,
  success: `<rect x="1" y="4" width="26" height="20" rx="10" fill="color-mix(in srgb, #22c55e 18%, transparent)" stroke="#22c55e" stroke-width="1.2"/>`,
  error: `<rect x="1" y="4" width="26" height="20" rx="10" fill="color-mix(in srgb, #ef4444 18%, transparent)" stroke="#ef4444" stroke-width="1.2"/>`,
  server: `<rect x="1" y="2" width="26" height="24" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/><line x1="1" y1="10" x2="27" y2="10" stroke="${stroke}" stroke-width="0.8"/><circle cx="5" cy="6" r="1.2" fill="${stroke}"/>`,
  databaseAdvanced: `<path d="M1 8 A13 4 0 0 1 27 8 V20 A13 4 0 0 1 1 20 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/><ellipse cx="14" cy="8" rx="13" ry="4" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`,
  queue: `<rect x="1" y="4" width="26" height="20" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="1.2" stroke-dasharray="4 2"/>`,
  microservice: `<rect x="1" y="4" width="26" height="20" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`,
  externalApi: `<rect x="1" y="4" width="26" height="20" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`,
  text: `<rect x="1" y="4" width="26" height="20" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="1.2" stroke-dasharray="3 2"/>`,
  stickyNote: `<rect x="1" y="2" width="26" height="24" rx="2" fill="#fef3c7" stroke="#eab308" stroke-width="1.2"/>`,
  image: `<rect x="1" y="4" width="26" height="20" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`,
  group: `<rect x="1" y="2" width="26" height="24" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="1.2" stroke-dasharray="4 2"/>`,
  container: `<rect x="1" y="2" width="26" height="24" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`,
};

const fallbackShape = `<rect x="1" y="4" width="26" height="20" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`;

export function getDragShapeSvg(type: AppNodeType | string): string {
  const inner = shapes[type as AppNodeType] ?? fallbackShape;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${inner}</svg>`;
}
