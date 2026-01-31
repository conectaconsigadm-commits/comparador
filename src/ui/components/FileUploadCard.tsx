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
  // Métricas após leitura
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
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.stepBadge}>{stepNumber}</span>
        <h3 style={styles.title}>{title}</h3>
      </div>

      {/* Content */}
      <div style={styles.content}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          style={{ display: 'none' }}
        />

        {file ? (
          // Arquivo selecionado
          <>
            {/* File row */}
            <div style={styles.fileRow}>
              <div style={styles.fileInfo}>
                <FileIcon />
                <div style={styles.fileDetails}>
                  <span style={styles.fileName}>{file.name}</span>
                  <span style={styles.fileSize}>{formatFileSize(file.size)}</span>
                </div>
              </div>
              {badge && (
                <Badge variant={badge.variant}>{badge.text}</Badge>
              )}
            </div>

            {/* Loading indicator */}
            {loading && (
              <div style={styles.loadingBar}>
                <div style={styles.loadingBarInner} />
              </div>
            )}

            {/* Métricas */}
            {metrics && metrics.length > 0 && (
              <div style={styles.metrics}>
                <KeyValueList items={metrics} />
              </div>
            )}

            {/* Footer */}
            <div style={styles.footer}>
              <div style={styles.footerLeft}>
                {formatInfo && (
                  <span style={styles.formatInfo}>{formatInfo}</span>
                )}
                {showPreviewLink && (
                  <button style={styles.linkButton}>Ver prévia</button>
                )}
              </div>
              <div style={styles.footerRight}>
                <button style={styles.linkButton} onClick={handleClick}>
                  Trocar
                </button>
                <span style={styles.separator}>|</span>
                <button style={styles.linkButton} onClick={handleRemove}>
                  Remover
                </button>
              </div>
            </div>
          </>
        ) : (
          // Dropzone vazia
          <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              ...styles.dropzone,
              borderColor: error
                ? tokens.colors.error
                : isDragging
                ? tokens.colors.primary
                : 'rgba(0, 0, 0, 0.12)',
              backgroundColor: isDragging
                ? 'rgba(0, 102, 204, 0.02)'
                : 'transparent',
            }}
          >
            <UploadIcon />
            <div style={styles.dropzoneText}>
              <span style={styles.dropzoneTextBold}>Clique para selecionar</span>
              {' '}ou arraste o arquivo
            </div>
            {hint && <div style={styles.dropzoneHint}>{hint}</div>}
          </div>
        )}

        {/* Erro */}
        {error && <div style={styles.error}>{error}</div>}
      </div>
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
// ESTILOS
// ─────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    border: `1px solid ${tokens.colors.surfaceBorder}`,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.md,
    padding: `${tokens.spacing.base} ${tokens.spacing.lg}`,
    borderBottom: `1px solid ${tokens.colors.surfaceBorder}`,
    backgroundColor: 'rgba(0, 0, 0, 0.01)',
  },

  stepBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
    height: '22px',
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.primary,
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    borderRadius: tokens.radius.full,
  },

  title: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.textPrimary,
    margin: 0,
  },

  content: {
    padding: tokens.spacing.lg,
  },

  dropzone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.md,
    padding: `${tokens.spacing.xl} ${tokens.spacing.lg}`,
    borderRadius: tokens.radius.md,
    border: '1.5px dashed rgba(0, 0, 0, 0.12)',
    cursor: 'pointer',
    transition: `all ${tokens.transitions.normal}`,
  },

  dropzoneText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.textSecondary,
    textAlign: 'center',
  },

  dropzoneTextBold: {
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.textPrimary,
  },

  dropzoneHint: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.textMuted,
  },

  fileRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.base,
    padding: tokens.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: tokens.radius.md,
    marginBottom: tokens.spacing.base,
  },

  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.md,
    minWidth: 0,
  },

  fileDetails: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },

  fileName: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.textPrimary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  fileSize: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.textMuted,
  },

  loadingBar: {
    height: '2px',
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    borderRadius: '1px',
    marginBottom: tokens.spacing.base,
    overflow: 'hidden',
  },

  loadingBarInner: {
    width: '30%',
    height: '100%',
    backgroundColor: tokens.colors.primary,
    borderRadius: '1px',
    animation: 'loading 1.5s ease-in-out infinite',
  },

  metrics: {
    marginBottom: tokens.spacing.base,
  },

  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: tokens.spacing.md,
    borderTop: `1px solid ${tokens.colors.surfaceBorder}`,
  },

  footerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.base,
  },

  footerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },

  formatInfo: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.textMuted,
  },

  linkButton: {
    padding: 0,
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.primary,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: `opacity ${tokens.transitions.fast}`,
  },

  separator: {
    color: tokens.colors.textMuted,
    fontSize: tokens.typography.fontSize.xs,
  },

  error: {
    marginTop: tokens.spacing.sm,
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.error,
  },
}

// Injetar animação de loading
if (typeof document !== 'undefined') {
  const styleId = 'file-upload-card-styles'
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style')
    styleEl.id = styleId
    styleEl.textContent = `
      @keyframes loading {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(200%); }
        100% { transform: translateX(-100%); }
      }
    `
    document.head.appendChild(styleEl)
  }
}
