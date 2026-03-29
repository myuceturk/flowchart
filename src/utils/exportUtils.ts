import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import type { Node, Edge } from 'reactflow';

function getTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function getDiagramBounds(nodes: Node[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 800, height: 600 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const w = node.width ?? 180;
    const h = node.height ?? 60;
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + w);
    maxY = Math.max(maxY, node.position.y + h);
  }

  const padding = 60;
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

/** SVG presentation attributes that CSS can set but html-to-image won't inline */
const SVG_STYLE_PROPS = [
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-opacity',
  'fill',
  'fill-opacity',
  'opacity',
  'marker-end',
  'marker-start',
] as const;

/**
 * Inline all computed SVG presentation styles onto the elements themselves.
 * html-to-image clones the DOM but doesn't transfer CSS-applied SVG attributes,
 * so edges (SVG paths) become invisible in the export.
 * Returns a cleanup function to restore original inline styles.
 */
function inlineSvgStyles(container: HTMLElement): () => void {
  const svgEls = container.querySelectorAll<SVGElement>(
    '.react-flow__edge path, .react-flow__edge line, .react-flow__edge polyline, .react-flow__edge circle, .react-flow__connectionline path'
  );

  const originals: Array<{ el: SVGElement; style: string }> = [];

  svgEls.forEach((el) => {
    originals.push({ el, style: el.getAttribute('style') ?? '' });
    const computed = window.getComputedStyle(el);
    for (const prop of SVG_STYLE_PROPS) {
      const val = computed.getPropertyValue(prop);
      if (val && val !== 'none' && val !== '' && val !== 'normal') {
        el.style.setProperty(prop, val);
      }
    }
    // Ensure fill is explicitly set (paths default to black fill if not set)
    if (!el.style.fill) {
      el.style.fill = 'none';
    }
  });

  return () => {
    for (const { el, style } of originals) {
      if (style) {
        el.setAttribute('style', style);
      } else {
        el.removeAttribute('style');
      }
    }
  };
}

/**
 * Captures the React Flow canvas as a PNG data URL.
 *
 * Strategy:
 * 1. Temporarily override the viewport CSS transform to frame all nodes
 * 2. Inline SVG styles on edge paths (html-to-image can't read CSS-applied SVG attrs)
 * 3. Hide UI overlays (controls, minimap, panels, background grid)
 * 4. Capture the .react-flow container
 * 5. Restore everything
 */
async function captureCanvas(nodes: Node[]): Promise<string> {
  const flowContainer = document.querySelector<HTMLElement>('.react-flow');
  if (!flowContainer) throw new Error('React Flow container not found');

  const viewport = flowContainer.querySelector<HTMLElement>('.react-flow__viewport');
  if (!viewport) throw new Error('Viewport not found');

  const bounds = getDiagramBounds(nodes);

  // ── 1. Save original state ──
  const origViewportTransform = viewport.style.transform;
  const origContainerWidth = flowContainer.style.width;
  const origContainerHeight = flowContainer.style.height;

  // ── 2. Set viewport transform to frame the diagram ──
  viewport.style.transform = `translate(${-bounds.x}px, ${-bounds.y}px) scale(1)`;

  // ── 3. Inline SVG edge styles ──
  const restoreSvgStyles = inlineSvgStyles(flowContainer);

  // ── 4. Also inline styles on the edges SVG container itself ──
  const edgesSvg = flowContainer.querySelector<SVGSVGElement>('svg.react-flow__edges');
  const origEdgesSvgStyle = edgesSvg?.getAttribute('style') ?? '';
  if (edgesSvg) {
    edgesSvg.style.overflow = 'visible';
    edgesSvg.style.position = 'absolute';
    edgesSvg.style.width = '100%';
    edgesSvg.style.height = '100%';
    edgesSvg.style.top = '0';
    edgesSvg.style.left = '0';
  }

  // ── 5. Hide UI overlays ──
  const overlaySelectors = [
    '.react-flow__controls',
    '.react-flow__minimap',
    '.react-flow__panel',
    '.react-flow__attribution',
    '.react-flow__background',
  ];
  const hiddenEls: Array<{ el: HTMLElement; prev: string }> = [];
  for (const sel of overlaySelectors) {
    flowContainer.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      hiddenEls.push({ el, prev: el.style.display });
      el.style.display = 'none';
    });
  }

  // Pre-fetch cross-origin images as base64 so html-to-image can inline them.
  // Images already using data: URLs (drag & drop uploads) are skipped.
  const imgEls = flowContainer.querySelectorAll<HTMLImageElement>('.image-node__img');
  const origSrcs: Array<{ el: HTMLImageElement; src: string }> = [];
  await Promise.allSettled(
    Array.from(imgEls).map(async (img) => {
      if (!img.src || img.src.startsWith('data:')) return;
      try {
        const res = await fetch(img.src, { mode: 'cors', cache: 'force-cache' });
        const blob = await res.blob();
        return new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            origSrcs.push({ el: img, src: img.src });
            img.src = e.target?.result as string;
            resolve();
          };
          reader.readAsDataURL(blob);
        });
      } catch {
        // If CORS fails, leave the src as-is; html-to-image will do its best.
      }
    }),
  );

  try {
    const dataUrl = await toPng(flowContainer, {
      backgroundColor: '#ffffff',
      width: bounds.width,
      height: bounds.height,
      pixelRatio: 2,
      style: {
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
        overflow: 'hidden',
      },
    });
    return dataUrl;
  } finally {
    // Restore original cross-origin src values
    for (const { el, src } of origSrcs) {
      el.src = src;
    }
    // ── Restore everything ──
    viewport.style.transform = origViewportTransform;
    flowContainer.style.width = origContainerWidth;
    flowContainer.style.height = origContainerHeight;
    restoreSvgStyles();
    if (edgesSvg) {
      if (origEdgesSvgStyle) {
        edgesSvg.setAttribute('style', origEdgesSvgStyle);
      } else {
        edgesSvg.removeAttribute('style');
      }
    }
    for (const { el, prev } of hiddenEls) {
      el.style.display = prev;
    }
  }
}

export async function exportToPng(nodes: Node[]): Promise<void> {
  const dataUrl = await captureCanvas(nodes);

  const link = document.createElement('a');
  link.download = `diagram-${getTimestamp()}.png`;
  link.href = dataUrl;
  link.click();
}

export async function exportToPdf(nodes: Node[]): Promise<void> {
  const dataUrl = await captureCanvas(nodes);
  const bounds = getDiagramBounds(nodes);

  const orientation = bounds.width > bounds.height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [bounds.width, bounds.height],
  });

  pdf.addImage(dataUrl, 'PNG', 0, 0, bounds.width, bounds.height);
  pdf.save(`diagram-${getTimestamp()}.pdf`);
}

// ─── SVG Export ─────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getNodeHandlePos(
  node: Node,
  handleId: string | null | undefined,
  role: 'source' | 'target',
): { x: number; y: number } {
  const w = node.width ?? 180;
  const h = node.height ?? 60;
  const { x, y } = node.position;
  const cx = x + w / 2;
  const cy = y + h / 2;

  switch (handleId) {
    case 'top':
    case 'decision-top':
      return { x: cx, y };
    case 'bottom':
      return { x: cx, y: y + h };
    case 'left':
    case 'decision-left':
      return { x, y: cy };
    case 'right':
      return { x: x + w, y: cy };
    case 'decision-yes':
      return { x: x + w, y: cy };
    case 'decision-no':
      return { x: cx, y: y + h };
    default:
      return role === 'source' ? { x: cx, y: y + h } : { x: cx, y };
  }
}

function buildBezierPath(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
): string {
  const dy = Math.abs(ty - sy);
  const offset = Math.max(dy * 0.4, 40);
  return `M ${sx} ${sy} C ${sx} ${sy + offset} ${tx} ${ty - offset} ${tx} ${ty}`;
}

function renderNodeSvg(node: Node, offsetX: number, offsetY: number): string {
  const w = node.width ?? 180;
  const h = node.height ?? 60;
  const x = node.position.x - offsetX;
  const y = node.position.y - offsetY;
  const cx = x + w / 2;
  const cy = y + h / 2;

  const fill = (node.data as { color?: string | null } | undefined)?.color ?? '#ffffff';
  const stroke = '#64748b';
  const sw = 1.5;
  const label: string =
    (node.data as { label?: string } | undefined)?.label ?? '';
  const type = node.type ?? 'process';

  let shape = '';
  if (type === 'decision') {
    const pts = `${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`;
    shape = `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  } else if (type === 'startEnd') {
    shape = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  } else if (type === 'inputOutput') {
    const sk = 12;
    const pts = `${x + sk},${y} ${x + w},${y} ${x + w - sk},${y + h} ${x},${y + h}`;
    shape = `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  } else if (type === 'stickyNote') {
    const noteFill = fill !== '#ffffff' ? fill : '#fef9c3';
    shape = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${noteFill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  } else if (type === 'text') {
    shape = '';
  } else {
    shape = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  }

  if (!label) return `<g>${shape}</g>`;

  const fontSize = 13;
  const lineH = fontSize * 1.4;
  const rawLines = label.split('\n');
  const textStartY = cy - ((rawLines.length - 1) * lineH) / 2;
  const tspans = rawLines
    .map(
      (ln, i) =>
        `<tspan x="${cx}" ${i === 0 ? `y="${textStartY}"` : `dy="${lineH}"`}>${escapeXml(ln)}</tspan>`,
    )
    .join('');
  const textEl = `<text text-anchor="middle" dominant-baseline="middle" font-family="system-ui,-apple-system,sans-serif" font-size="${fontSize}" fill="#1e293b">${tspans}</text>`;

  return `<g>${shape}${textEl}</g>`;
}

function renderArrowMarker(color: string, id: string): string {
  return `<marker id="${id}" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
  <polygon points="0 0, 10 3.5, 0 7" fill="${color}"/>
</marker>`;
}

function renderEdgeSvg(
  edge: Edge,
  nodeMap: Map<string, Node>,
  offsetX: number,
  offsetY: number,
): string {
  const source = nodeMap.get(edge.source);
  const target = nodeMap.get(edge.target);
  if (!source || !target) return '';

  const sp = getNodeHandlePos(source, edge.sourceHandle, 'source');
  const tp = getNodeHandlePos(target, edge.targetHandle, 'target');
  const sx = sp.x - offsetX;
  const sy = sp.y - offsetY;
  const tx = tp.x - offsetX;
  const ty = tp.y - offsetY;

  const edgeData = edge.data as
    | { sourceColor?: string | null; label?: string; lineType?: string }
    | undefined;
  const color = edgeData?.sourceColor ?? '#64748b';
  const markerId = `arrow-${edge.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const pathD = buildBezierPath(sx, sy, tx, ty);
  const dashArray =
    edgeData?.lineType === 'dashed'
      ? 'stroke-dasharray="6 3"'
      : edgeData?.lineType === 'dotted'
        ? 'stroke-dasharray="2 3"'
        : '';

  const defs = `<defs>${renderArrowMarker(color, markerId)}</defs>`;
  const path = `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="1.5" ${dashArray} marker-end="url(#${markerId})"/>`;

  const label = edgeData?.label;
  const midX = (sx + tx) / 2;
  const midY = (sy + ty) / 2;
  const labelEl = label
    ? `<text x="${midX}" y="${midY - 6}" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="11" fill="#475569" paint-order="stroke" stroke="#ffffff" stroke-width="3">${escapeXml(label)}</text>`
    : '';

  return `<g>${defs}${path}${labelEl}</g>`;
}

export function exportAsSVG(nodes: Node[], edges: Edge[]): void {
  if (nodes.length === 0) return;

  const bounds = getDiagramBounds(nodes);
  const offsetX = bounds.x;
  const offsetY = bounds.y;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const edgeSvgs = edges.map((e) => renderEdgeSvg(e, nodeMap, offsetX, offsetY)).join('\n');
  const nodeSvgs = nodes.map((n) => renderNodeSvg(n, offsetX, offsetY)).join('\n');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="0 0 ${bounds.width} ${bounds.height}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <g class="edges">${edgeSvgs}</g>
  <g class="nodes">${nodeSvgs}</g>
</svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `diagram-${getTimestamp()}.svg`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Embed Code ──────────────────────────────────────────────────────────────

export function generateEmbedCode(diagramId: string): string {
  return `<iframe
  src="http://localhost:5173/embed/${diagramId}"
  width="800"
  height="600"
  frameborder="0"
  title="Embedded Diagram"
  style="border:1px solid #e2e8f0;border-radius:8px;"
></iframe>`;
}

// ─────────────────────────────────────────────────────────────────────────────

export function exportToJson(nodes: Node[], edges: Edge[]): void {
  const data = JSON.stringify({ nodes, edges }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.download = `diagram-${getTimestamp()}.json`;
  link.href = url;
  link.click();

  URL.revokeObjectURL(url);
}

interface DiagramData {
  nodes: Node[];
  edges: Edge[];
}

export async function importFromJson(file: File): Promise<DiagramData> {
  const text = await file.text();
  const data: unknown = JSON.parse(text);

  if (
    typeof data !== 'object' ||
    data === null ||
    !Array.isArray((data as DiagramData).nodes) ||
    !Array.isArray((data as DiagramData).edges)
  ) {
    throw new Error('Invalid diagram file: must contain "nodes" and "edges" arrays.');
  }

  return data as DiagramData;
}
