import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { tokens } from '../styles/tokens'
import { Button } from './Button'

interface FileDropProps {
  label: string
  hint?: string
  accept: string
  file: File | null
  onFile: (file: File | null) => void
}

/**
 * Dropzone para seleção de arquivo
 * Com drag & drop, preview do arquivo selecionado e validação
 */
export function FileDrop({ label, hint, accept, file, onFile }: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Extensões aceitas
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
    // Reset input para permitir selecionar o mesmo arquivo novamente
    e.target.value = ''
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleClear = () => {
    onFile(null)
    setError(null)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Label */}
      <div
        style={{
          marginBottom: tokens.spacing.sm,
          fontSize: tokens.typography.fontSize.sm,
          fontWeight: tokens.typography.fontWeight.medium,
          color: tokens.colors.textPrimary,
        }}
      >
        {label}
      </div>

      {/* Dropzone */}
      <div
        onClick={file ? undefined : handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          position: 'relative',
          padding: file ? tokens.spacing.base : tokens.spacing.xl,
          borderRadius: tokens.radius.md,
          border: `2px dashed ${
            error
              ? tokens.colors.error
              : isDragging
              ? tokens.colors.dropzoneActiveBorder
              : tokens.colors.dropzoneBorder
          }`,
          backgroundColor: isDragging
            ? tokens.colors.dropzoneActive
            : tokens.colors.dropzoneBg,
          cursor: file ? 'default' : 'pointer',
          transition: `all ${tokens.transitions.normal}`,
          textAlign: 'center',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          style={{ display: 'none' }}
        />

        {file ? (
          // Arquivo selecionado
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: tokens.spacing.base,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: tokens.spacing.md,
                minWidth: 0,
              }}
            >
              <FileIcon />
              <div style={{ textAlign: 'left', minWidth: 0 }}>
                <div
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.medium,
                    color: tokens.colors.textPrimary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {file.name}
                </div>
                <div
                  style={{
                    fontSize: tokens.typography.fontSize.xs,
                    color: tokens.colors.textMuted,
                  }}
                >
                  {formatFileSize(file.size)}
                </div>
              </div>
            </div>
            <Button variant="ghost" onClick={handleClear}>
              Trocar
            </Button>
          </div>
        ) : (
          // Estado vazio
          <>
            <UploadIcon />
            <div
              style={{
                marginTop: tokens.spacing.md,
                fontSize: tokens.typography.fontSize.sm,
                color: tokens.colors.textSecondary,
              }}
            >
              <span style={{ fontWeight: tokens.typography.fontWeight.medium }}>
                Clique para selecionar
              </span>{' '}
              ou arraste o arquivo
            </div>
            {hint && (
              <div
                style={{
                  marginTop: tokens.spacing.xs,
                  fontSize: tokens.typography.fontSize.xs,
                  color: tokens.colors.textMuted,
                }}
              >
                {hint}
              </div>
            )}
          </>
        )}
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div
          style={{
            marginTop: tokens.spacing.sm,
            fontSize: tokens.typography.fontSize.xs,
            color: tokens.colors.error,
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ÍCONES SVG
// ─────────────────────────────────────────────────────────────

function UploadIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke={tokens.colors.textMuted}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ margin: '0 auto' }}
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
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke={tokens.colors.primary}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}
