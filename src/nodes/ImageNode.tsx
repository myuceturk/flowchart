import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { getPluginNodeDefinition } from '../plugins/pluginSystem';
import ResizeHandles from '../components/ResizeHandles';
import { useDiagramCommands } from '../hooks/useDiagramCommands';
import { useNodeData, useNodeEditingState } from '../store/selectors';
import NodeActionToolbar from './NodeActionToolbar';
import NodeBase from './NodeBase';
import type { CustomNodeProps } from './types';
import './nodes.css';

const ACCEPTED_MIME = 'image/png,image/jpeg,image/svg+xml,image/webp';

const HANDLE_CONFIG = [
  { id: 'top', position: Position.Top, className: 'node-handle node-handle--top' },
  { id: 'right', position: Position.Right, className: 'node-handle node-handle--right' },
  { id: 'bottom', position: Position.Bottom, className: 'node-handle node-handle--bottom' },
  { id: 'left', position: Position.Left, className: 'node-handle node-handle--left' },
] as const;

const ImageNode: React.FC<CustomNodeProps> = ({ id, data, selected }) => {
  const { updateNodeData } = useDiagramCommands();
  const { isSingleNodeSelected } = useNodeEditingState();
  const nodeData = useNodeData(id) ?? data;
  const definition = getPluginNodeDefinition('image');

  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // When the stored imageUrl changes, reset loading/error state
  useEffect(() => {
    if (nodeData.imageUrl) {
      setIsLoading(true);
      setHasError(false);
      setShowUrlInput(false);
      setUrlInputValue('');
    } else {
      setIsLoading(false);
      setHasError(false);
    }
  }, [nodeData.imageUrl]);

  const readFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        updateNodeData(id, { imageUrl: url, imageAlt: file.name });
      };
      reader.readAsDataURL(file);
    },
    [id, updateNodeData],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) readFile(file);
    },
    [readFile],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) readFile(file);
      e.target.value = '';
    },
    [readFile],
  );

  const commitUrl = useCallback(() => {
    const trimmed = urlInputValue.trim();
    if (trimmed) {
      updateNodeData(id, { imageUrl: trimmed, imageAlt: 'Image' });
    } else {
      setShowUrlInput(false);
    }
  }, [id, urlInputValue, updateNodeData]);

  const handleUrlKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') commitUrl();
      if (e.key === 'Escape') {
        setShowUrlInput(false);
        setUrlInputValue('');
      }
    },
    [commitUrl],
  );

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setIsLoading(false);
      setHasError(false);
      if (nodeData.aspectRatioLocked) {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        const ratio = naturalWidth / naturalHeight;
        if (!nodeData.aspectRatio || Math.abs(nodeData.aspectRatio - ratio) > 0.001) {
          updateNodeData(id, { aspectRatio: ratio });
        }
      }
    },
    [id, nodeData.aspectRatio, nodeData.aspectRatioLocked, updateNodeData],
  );

  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const handleClearImage = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      updateNodeData(id, { imageUrl: '', imageAlt: '' });
    },
    [id, updateNodeData],
  );

  const openFilePicker = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  }, []);

  const openUrlInput = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowUrlInput(true);
  }, []);

  let bodyContent: React.ReactNode;

  if (!nodeData.imageUrl) {
    // ── Upload placeholder UI ────────────────────────────────────
    bodyContent = (
      <div
        className={`image-node__upload${isDragging ? ' image-node__upload--drag' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFilePicker}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_MIME}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          tabIndex={-1}
        />
        <svg
          className="image-node__upload-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span className="image-node__upload-hint">
          {isDragging ? 'Drop here' : 'Drop or click'}
        </span>
        {!showUrlInput ? (
          <button
            className="image-node__url-btn"
            onClick={openUrlInput}
            tabIndex={-1}
          >
            Use URL
          </button>
        ) : (
          <div
            className="image-node__url-row"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              className="image-node__url-input"
              placeholder="https://…"
              value={urlInputValue}
              onChange={(e) => setUrlInputValue(e.target.value)}
              onKeyDown={handleUrlKeyDown}
              onBlur={commitUrl}
              autoFocus
              tabIndex={-1}
            />
          </div>
        )}
      </div>
    );
  } else if (hasError) {
    // ── Error fallback ────────────────────────────────────────────
    bodyContent = (
      <div className="image-node__fallback">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          width="26"
          height="26"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5" />
        </svg>
        <span className="image-node__fallback-text">Could not load image</span>
        <button
          className="image-node__fallback-btn"
          onClick={handleClearImage}
          tabIndex={-1}
        >
          Change
        </button>
      </div>
    );
  } else {
    // ── Image preview ─────────────────────────────────────────────
    bodyContent = (
      <div className="image-node__preview">
        {isLoading && <div className="image-node__skeleton" aria-hidden="true" />}
        <img
          src={nodeData.imageUrl}
          alt={nodeData.imageAlt || 'Image'}
          className={`image-node__img${isLoading ? ' image-node__img--hidden' : ''}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          draggable={false}
        />
        {nodeData.label && (
          <span className="image-node__caption">{nodeData.label}</span>
        )}
      </div>
    );
  }

  return (
    <NodeBase
      category={definition?.category ?? 'Content'}
      icon={definition?.icon ?? null}
      className="node-card node-card--image"
      backgroundOverride={nodeData.color}
      width={nodeData.width}
      height={nodeData.height}
      overlay={
        <>
          {selected && isSingleNodeSelected ? (
            <NodeActionToolbar id={id} type="image" data={nodeData} />
          ) : null}

          {HANDLE_CONFIG.map((handle) => (
            <Handle
              key={handle.id}
              type="source"
              position={handle.position}
              id={handle.id}
              className={handle.className}
            />
          ))}

          <ResizeHandles nodeId={id} nodeType="image" data={nodeData} selected={!!selected} />
        </>
      }
    >
      {bodyContent}
    </NodeBase>
  );
};

export default React.memo(ImageNode);
