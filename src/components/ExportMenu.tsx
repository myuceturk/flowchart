import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Download,
  Upload,
  Image,
  FileText,
  FileJson,
  ChevronDown,
  Code2,
  Square,
  Copy,
  Check,
  X,
} from 'lucide-react';
import {
  exportToPng,
  exportToPdf,
  exportToJson,
  exportAsSVG,
  generateEmbedCode,
  importFromJson,
} from '../utils/exportUtils';
import useDiagramStore from '../store/useDiagramStore';
import './ExportMenu.css';

const ExportMenu: React.FC = () => {
  const setDiagram = useDiagramStore((state) => state.setDiagram);
  const diagramId = useDiagramStore((state) => state.diagramId);

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as HTMLElement)) {
        close();
      }
    };

    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open, close]);

  useEffect(() => {
    if (!status) return;
    const id = setTimeout(() => setStatus(null), 3000);
    return () => clearTimeout(id);
  }, [status]);

  // Reset copied state after 2 s
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const showStatus = (msg: string) => {
    setStatus(msg);
    close();
  };

  const handlePng = async () => {
    try {
      await exportToPng(useDiagramStore.getState().nodes);
      showStatus('PNG exported');
    } catch (err) {
      console.error(err);
      showStatus('PNG export failed');
    }
  };

  const handlePdf = async () => {
    try {
      await exportToPdf(useDiagramStore.getState().nodes);
      showStatus('PDF exported');
    } catch (err) {
      console.error(err);
      showStatus('PDF export failed');
    }
  };

  const handleJson = () => {
    try {
      const { nodes, edges } = useDiagramStore.getState();
      exportToJson(nodes, edges);
      showStatus('JSON exported');
    } catch (err) {
      console.error(err);
      showStatus('JSON export failed');
    }
  };

  const handleSvg = () => {
    try {
      const { nodes, edges } = useDiagramStore.getState();
      exportAsSVG(nodes, edges);
      showStatus('SVG exported');
    } catch (err) {
      console.error(err);
      showStatus('SVG export failed');
    }
  };

  const handleEmbed = () => {
    close();
    setEmbedOpen(true);
  };

  const handleCopyEmbed = async () => {
    if (!diagramId) return;
    try {
      await navigator.clipboard.writeText(generateEmbedCode(diagramId));
      setCopied(true);
    } catch {
      // fallback for older browsers / non-https
      const ta = document.createElement('textarea');
      ta.value = generateEmbedCode(diagramId);
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importFromJson(file);
      setDiagram(data.nodes, data.edges);
      showStatus('Diagram imported');
    } catch (err) {
      console.error(err);
      showStatus(err instanceof Error ? err.message : 'Import failed');
    }

    e.target.value = '';
  };

  return (
    <>
      <div className={`export-menu ${open ? 'is-open' : ''}`} ref={containerRef}>
        <button className="btn-history btn-export-trigger" onClick={() => setOpen(!open)}>
          <Download size={15} strokeWidth={1.9} />
          Export
          <ChevronDown size={13} className={`export-menu__chevron ${open ? 'is-flipped' : ''}`} />
        </button>

        <div className="export-menu__dropdown">
          <button className="export-menu__item" onClick={handlePng}>
            <Image size={15} strokeWidth={1.8} />
            Export as PNG
            <span className="export-menu__hint">2x retina</span>
          </button>
          <button className="export-menu__item" onClick={handlePdf}>
            <FileText size={15} strokeWidth={1.8} />
            Export as PDF
          </button>
          <button className="export-menu__item" onClick={handleSvg}>
            <Square size={15} strokeWidth={1.8} />
            Export as SVG
          </button>
          <button className="export-menu__item" onClick={handleJson}>
            <FileJson size={15} strokeWidth={1.8} />
            Export as JSON
          </button>

          <div className="export-menu__separator" />

          <button className="export-menu__item" onClick={handleEmbed}>
            <Code2 size={15} strokeWidth={1.8} />
            Get embed code
          </button>

          <div className="export-menu__separator" />

          <button className="export-menu__item" onClick={() => fileInputRef.current?.click()}>
            <Upload size={15} strokeWidth={1.8} />
            Import JSON
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="export-menu__file-input"
          onChange={handleImport}
        />

        {status && <div className="export-menu__toast">{status}</div>}
      </div>

      {/* Embed code modal */}
      {embedOpen && (
        <div className="embed-modal-overlay" onClick={() => setEmbedOpen(false)}>
          <div className="embed-modal" onClick={(e) => e.stopPropagation()}>
            <div className="embed-modal__header">
              <span className="embed-modal__title">Embed diagram</span>
              <button className="embed-modal__close" onClick={() => setEmbedOpen(false)}>
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            {diagramId ? (
              <>
                <p className="embed-modal__desc">
                  Paste this snippet into any HTML page to embed this diagram.
                </p>
                <div className="embed-modal__code-wrap">
                  <pre className="embed-modal__code">{generateEmbedCode(diagramId)}</pre>
                </div>
                <button className="embed-modal__copy" onClick={handleCopyEmbed}>
                  {copied ? (
                    <>
                      <Check size={14} strokeWidth={2.2} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} strokeWidth={1.9} />
                      Copy to clipboard
                    </>
                  )}
                </button>
              </>
            ) : (
              <p className="embed-modal__desc embed-modal__desc--warn">
                Save the diagram first to generate an embed code.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ExportMenu;
