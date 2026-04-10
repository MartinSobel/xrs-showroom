'use client';

import { useRef, useState } from 'react';
import { formatBytes } from '@/lib/utils';

/**
 * File upload component with drag & drop, click to browse, and progress bar.
 */
export default function FileUploader({
  label,
  icon,
  accept,
  currentFile,
  uploadProgress,
  onUpload,
  onRemove,
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) onUpload?.(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload?.(file);
    e.target.value = '';
  };

  const isUploading = typeof uploadProgress === 'number';

  return (
    <div className="file-uploader">
      <div className="upload-label">
        {icon && <span>{icon}</span>}
        {label}
      </div>

      {currentFile ? (
        <div>
          <div className="file-info-row">
            <span className="file-name">{currentFile.fileName}</span>
            {currentFile.size && (
              <span className="file-size">{formatBytes(currentFile.size)}</span>
            )}
            <button
              className="btn btn-sm btn-primary"
              onClick={handleClick}
              disabled={isUploading}
            >
              ↻
            </button>
            {onRemove && (
              <button
                className="btn btn-sm btn-danger"
                onClick={onRemove}
                disabled={isUploading}
              >
                ✕
              </button>
            )}
          </div>
          {isUploading && (
            <div className="upload-progress">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      ) : (
        <div
          className={`upload-zone ${dragging ? 'dragging' : ''}`}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="upload-icon">📁</div>
          <div className="upload-text">
            {isUploading ? `Subiendo… ${uploadProgress}%` : 'Click o arrastrá un archivo'}
          </div>
          {accept && (
            <div className="upload-hint">{accept}</div>
          )}
          {isUploading && (
            <div className="upload-progress" style={{ marginTop: 8 }}>
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
