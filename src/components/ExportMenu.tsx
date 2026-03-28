import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Upload, Image, FileText, FileJson, ChevronDown } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { exportToPng, exportToPdf, exportToJson, importFromJson } from '../utils/exportUtils';
import useDiagramStore from '../store/useDiagramStore';
import './ExportMenu.css';

const ExportMenu: React.FC = () => {
  const { nodes, edges, setDiagram } = useDiagramStore(
    useShallow((state) => ({
      nodes: state.nodes,
      edges: state.edges,
      setDiagram: state.setDiagram,
    })),
  );
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
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

  const showStatus = (msg: string) => {
    setStatus(msg);
    close();
  };

  const handlePng = async () => {
    try {
      await exportToPng(nodes);
      showStatus('PNG exported');
    } catch (err) {
      console.error(err);
      showStatus('PNG export failed');
    }
  };

  const handlePdf = async () => {
    try {
      await exportToPdf(nodes);
      showStatus('PDF exported');
    } catch (err) {
      console.error(err);
      showStatus('PDF export failed');
    }
  };

  const handleJson = () => {
    try {
      exportToJson(nodes, edges);
      showStatus('JSON exported');
    } catch (err) {
      console.error(err);
      showStatus('JSON export failed');
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

    // Reset so the same file can be re-imported
    e.target.value = '';
  };

  return (
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
        <button className="export-menu__item" onClick={handleJson}>
          <FileJson size={15} strokeWidth={1.8} />
          Export as JSON
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
  );
};

export default ExportMenu;
