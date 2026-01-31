import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { tokens } from '../styles/tokens'
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
  showPreviewLink?: boolean
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
  showPreviewLink,
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
                {showPreviewLink && (
                  <button className="file-card-link">Ver prévia</button>
                )}
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
      stroke={tokens.colors.textMuted}
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
      stroke={tokens.colors.primary}
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
    background-color: ${tokens.colors.surface};
    border-radius: ${tokens.radius.lg};
    border: 1px solid ${tokens.colors.surfaceBorder};
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    overflow: hidden;
  }

  .file-card-header {
    display: flex;
    align-items: center;
    gap: ${tokens.spacing.md};
    padding: ${tokens.spacing.base} ${tokens.spacing.lg};
    border-bottom: 1px solid ${tokens.colors.surfaceBorder};
    background-color: rgba(0, 0, 0, 0.01);
  }

  .file-card-step {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    font-size: ${tokens.typography.fontSize.xs};
    font-weight: ${tokens.typography.fontWeight.semibold};
    color: ${tokens.colors.primary};
    background-color: rgba(0, 102, 204, 0.08);
    border-radius: ${tokens.radius.full};
    flex-shrink: 0;
  }

  .file-card-title {
    font-size: ${tokens.typography.fontSize.sm};
    font-weight: ${tokens.typography.fontWeight.medium};
    color: ${tokens.colors.textPrimary};
    margin: 0;
  }

  .file-card-content {
    padding: ${tokens.spacing.lg};
  }

  .file-card-dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: ${tokens.spacing.md};
    padding: ${tokens.spacing.xl} ${tokens.spacing.lg};
    border-radius: ${tokens.radius.md};
    border: 1.5px dashed rgba(0, 0, 0, 0.12);
    cursor: pointer;
    transition: all ${tokens.transitions.normal};
    text-align: center;
  }

  .file-card-dropzone:hover {
    border-color: rgba(0, 0, 0, 0.2);
    background-color: rgba(0, 0, 0, 0.01);
  }

  .file-card-dropzone.dragging {
    border-color: ${tokens.colors.primary};
    background-color: rgba(0, 102, 204, 0.02);
  }

  .file-card-dropzone.error {
    border-color: ${tokens.colors.error};
  }

  .file-card-dropzone-text {
    font-size: ${tokens.typography.fontSize.sm};
    color: ${tokens.colors.textSecondary};
  }

  .file-card-dropzone-text strong {
    font-weight: ${tokens.typography.fontWeight.medium};
    color: ${tokens.colors.textPrimary};
  }

  .file-card-dropzone-hint {
    font-size: ${tokens.typography.fontSize.xs};
    color: ${tokens.colors.textMuted};
  }

  .file-card-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${tokens.spacing.base};
    padding: ${tokens.spacing.md};
    background-color: rgba(0, 0, 0, 0.02);
    border-radius: ${tokens.radius.md};
    margin-bottom: ${tokens.spacing.base};
    flex-wrap: wrap;
  }

  .file-card-info {
    display: flex;
    align-items: center;
    gap: ${tokens.spacing.md};
    min-width: 0;
    flex: 1;
  }

  .file-card-details {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .file-card-name {
    font-size: ${tokens.typography.fontSize.sm};
    font-weight: ${tokens.typography.fontWeight.medium};
    color: ${tokens.colors.textPrimary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }

  .file-card-size {
    font-size: ${tokens.typography.fontSize.xs};
    color: ${tokens.colors.textMuted};
  }

  .file-card-loading {
    height: 2px;
    background-color: rgba(0, 102, 204, 0.1);
    border-radius: 1px;
    margin-bottom: ${tokens.spacing.base};
    overflow: hidden;
  }

  .file-card-loading-bar {
    width: 30%;
    height: 100%;
    background-color: ${tokens.colors.primary};
    border-radius: 1px;
    animation: file-card-loading 1.5s ease-in-out infinite;
  }

  @keyframes file-card-loading {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(200%); }
    100% { transform: translateX(-100%); }
  }

  .file-card-metrics {
    margin-bottom: ${tokens.spacing.base};
  }

  .file-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: ${tokens.spacing.sm};
    padding-top: ${tokens.spacing.md};
    border-top: 1px solid ${tokens.colors.surfaceBorder};
  }

  .file-card-footer-left,
  .file-card-footer-right {
    display: flex;
    align-items: center;
    gap: ${tokens.spacing.sm};
  }

  .file-card-format {
    font-size: ${tokens.typography.fontSize.xs};
    color: ${tokens.colors.textMuted};
  }

  .file-card-link {
    padding: 0;
    font-size: ${tokens.typography.fontSize.xs};
    font-weight: ${tokens.typography.fontWeight.medium};
    color: ${tokens.colors.primary};
    background-color: transparent;
    border: none;
    cursor: pointer;
    transition: opacity ${tokens.transitions.fast};
  }

  .file-card-link:hover {
    opacity: 0.7;
  }

  .file-card-sep {
    color: ${tokens.colors.textMuted};
    font-size: ${tokens.typography.fontSize.xs};
  }

  .file-card-error {
    margin-top: ${tokens.spacing.sm};
    font-size: ${tokens.typography.fontSize.xs};
    color: ${tokens.colors.error};
  }

  /* Mobile */
  @media (max-width: 640px) {
    .file-card-header {
      padding: ${tokens.spacing.md} ${tokens.spacing.base};
    }

    .file-card-content {
      padding: ${tokens.spacing.base};
    }

    .file-card-dropzone {
      padding: ${tokens.spacing.lg} ${tokens.spacing.base};
    }

    .file-card-name {
      max-width: 140px;
    }

    .file-card-row {
      padding: ${tokens.spacing.sm};
    }
  }
`
