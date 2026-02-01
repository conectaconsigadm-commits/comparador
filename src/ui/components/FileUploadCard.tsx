import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { Badge } from './Badge'
import { KeyValueList, type KeyValueItem } from './KeyValueList'

interface FileUploadCardProps {
  title: string
  stepNumber: number
  accept: string
  hint?: string
  file: File | null
  onFile: (file: File | null) => void
  badge?: {
    text: string
    variant: 'success' | 'info' | 'warning' | 'error' | 'neutral'
  }
  metrics?: KeyValueItem[]
  formatInfo?: string
  loading?: boolean
}

/**
 * Card de upload de arquivo - estilo mockup 2
 * Mostra arquivo selecionado + métricas de leitura
 */
export function FileUploadCard({
  title,
  stepNumber,
  accept,
  hint,
  file,
  onFile,
  badge,
  metrics,
  formatInfo,
  loading,
}: FileUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const acceptedExtensions = accept
    .split(',')
    .map((ext) => ext.trim().toLowerCase().replace('*', ''))

  const validateFile = (f: File): boolean => {
    const fileName = f.name.toLowerCase()
    const isValid = acceptedExtensions.some((ext) => fileName.endsWith(ext))
    if (!isValid) {
      setError(`Formato não aceito. Use: ${acceptedExtensions.join(', ')}`)
      return false
    }
    setError(null)
    return true
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && validateFile(droppedFile)) {
      onFile(droppedFile)
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    if (selectedFile && validateFile(selectedFile)) {
      onFile(selectedFile)
    }
    e.target.value = ''
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleRemove = () => {
    onFile(null)
    setError(null)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="file-card">
      {/* Header */}
      <div className="file-card-header">
        <span className="file-card-step">{stepNumber}</span>
        <h3 className="file-card-title">{title}</h3>
      </div>

      {/* Content */}
      <div className="file-card-content">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          style={{ display: 'none' }}
        />

        {file ? (
          <>
            {/* File row */}
            <div className="file-card-row">
              <div className="file-card-info">
                <FileIcon />
                <div className="file-card-details">
                  <span className="file-card-name">{file.name}</span>
                  <span className="file-card-size">{formatFileSize(file.size)}</span>
                </div>
              </div>
              {badge && <Badge variant={badge.variant}>{badge.text}</Badge>}
            </div>

            {/* Loading */}
            {loading && (
              <div className="file-card-loading">
                <div className="file-card-loading-bar" />
              </div>
            )}

            {/* Métricas */}
            {metrics && metrics.length > 0 && (
              <div className="file-card-metrics">
                <KeyValueList items={metrics} />
              </div>
            )}

            {/* Footer */}
            <div className="file-card-footer">
              <div className="file-card-footer-left">
                {formatInfo && <span className="file-card-format">{formatInfo}</span>}
              </div>
              <div className="file-card-footer-right">
                <button className="file-card-link" onClick={handleClick}>
                  Trocar
                </button>
                <span className="file-card-sep">|</span>
                <button className="file-card-link" onClick={handleRemove}>
                  Remover
                </button>
              </div>
            </div>
          </>
        ) : (
          <div
            className={`file-card-dropzone ${isDragging ? 'dragging' : ''} ${error ? 'error' : ''}`}
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <UploadIcon />
            <div className="file-card-dropzone-text">
              <strong>Clique para selecionar</strong> ou arraste o arquivo
            </div>
            {hint && <div className="file-card-dropzone-hint">{hint}</div>}
          </div>
        )}

        {error && <div className="file-card-error">{error}</div>}
      </div>

      <style>{fileCardCSS}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ÍCONES
// ─────────────────────────────────────────────────────────────

function UploadIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--cc-text-muted)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--cc-primary)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────

const fileCardCSS = `
  .file-card {
    background: var(--cc-surface);
    border-radius: var(--cc-radius-lg);
    border: 1px solid var(--cc-border);
    box-shadow: var(--cc-shadow-glass);
    backdrop-filter: var(--cc-blur);
    -webkit-backdrop-filter: var(--cc-blur);
    overflow: hidden;
    transition: background 300ms ease, border-color 300ms ease;
  }

  .file-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--cc-border);
    background: var(--cc-surface-2);
  }

  .file-card-step {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 12px;
    font-weight: 600;
    color: var(--cc-primary);
    background: var(--cc-primary-light);
    border-radius: 8px;
    flex-shrink: 0;
  }

  .file-card-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--cc-text);
    margin: 0;
    letter-spacing: -0.01em;
  }

  .file-card-content {
    padding: 20px;
  }

  .file-card-dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 32px 24px;
    border-radius: var(--cc-radius-md);
    border: 1.5px dashed var(--cc-border-strong);
    background: var(--cc-surface-2);
    cursor: pointer;
    transition: all 200ms ease;
    text-align: center;
  }

  .file-card-dropzone:hover {
    border-color: var(--cc-primary);
    background: var(--cc-primary-light);
  }

  .file-card-dropzone.dragging {
    border-color: var(--cc-primary);
    background: var(--cc-primary-light);
    border-style: solid;
  }

  .file-card-dropzone.error {
    border-color: var(--cc-danger);
    background: var(--cc-danger-light);
  }

  .file-card-dropzone-text {
    font-size: 14px;
    color: var(--cc-text-secondary);
    line-height: 1.5;
  }

  .file-card-dropzone-text strong {
    font-weight: 600;
    color: var(--cc-primary);
  }

  .file-card-dropzone-hint {
    font-size: 12px;
    color: var(--cc-text-muted);
  }

  .file-card-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    background: var(--cc-primary-light);
    border: 1px solid var(--cc-primary);
    border-color: rgba(37, 99, 235, 0.15);
    border-radius: var(--cc-radius-md);
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  .file-card-info {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    flex: 1;
  }

  .file-card-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .file-card-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--cc-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 220px;
  }

  .file-card-size {
    font-size: 12px;
    color: var(--cc-text-muted);
  }

  .file-card-loading {
    height: 3px;
    background: var(--cc-primary-light);
    border-radius: 2px;
    margin-bottom: 12px;
    overflow: hidden;
  }

  .file-card-loading-bar {
    width: 30%;
    height: 100%;
    background: var(--cc-primary);
    border-radius: 2px;
    animation: file-card-loading 1.5s ease-in-out infinite;
  }

  @keyframes file-card-loading {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(250%); }
    100% { transform: translateX(-100%); }
  }

  .file-card-metrics {
    margin-bottom: 12px;
  }

  .file-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--cc-border);
  }

  .file-card-footer-left,
  .file-card-footer-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .file-card-format {
    font-size: 12px;
    color: var(--cc-text-muted);
  }

  .file-card-link {
    padding: 4px 8px;
    margin: -4px;
    font-size: 12px;
    font-weight: 500;
    color: var(--cc-primary);
    background-color: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 150ms ease;
  }

  .file-card-link:hover {
    background: var(--cc-primary-light);
  }

  .file-card-sep {
    color: var(--cc-border-strong);
    font-size: 12px;
  }

  .file-card-error {
    margin-top: 8px;
    font-size: 12px;
    color: var(--cc-danger);
  }

  /* Mobile */
  @media (max-width: 640px) {
    .file-card-header {
      padding: 12px 16px;
    }

    .file-card-content {
      padding: 16px;
    }

    .file-card-dropzone {
      padding: 24px 16px;
    }

    .file-card-name {
      max-width: 160px;
    }

    .file-card-row {
      padding: 10px 12px;
    }
  }
`
