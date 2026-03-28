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
