import { useState, useCallback } from 'react'

interface CopyButtonProps {
  /** Texto para copiar */
  text: string
  /** Label do botão (default: "Copiar") */
  label?: string
  /** Label após copiar (default: "Copiado!") */
  copiedLabel?: string
  /** Tamanho do botão */
  size?: 'sm' | 'md'
  /** Classe adicional */
  className?: string
}

/**
 * Botão de copiar com feedback visual
 */
export function CopyButton({
  text,
  label = 'Copiar',
  copiedLabel = 'Copiado!',
  size = 'sm',
  className = '',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch (err) {
      console.error('Falha ao copiar:', err)
    }
  }, [text])

  return (
    <>
      <button
        className={`copy-btn copy-btn-${size} ${copied ? 'copy-btn-copied' : ''} ${className}`}
        onClick={handleCopy}
        title={copied ? copiedLabel : label}
      >
        {copied ? (
          <>
            <CheckIcon />
            <span>{copiedLabel}</span>
          </>
        ) : (
          <>
            <CopyIcon />
            <span>{label}</span>
          </>
        )}
      </button>
      <style>{copyButtonCSS}</style>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// ÍCONES
// ─────────────────────────────────────────────────────────────

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────

const copyButtonCSS = `
  .copy-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border: 1px solid var(--cc-border);
    border-radius: 6px;
    background: var(--cc-surface-elevated);
    color: var(--cc-text-secondary);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .copy-btn:hover {
    background: var(--cc-surface-hover);
    color: var(--cc-text);
    border-color: var(--cc-border-hover);
  }

  .copy-btn-copied {
    background: var(--cc-success-light, rgba(34, 197, 94, 0.1));
    border-color: var(--cc-success);
    color: var(--cc-success);
  }

  .copy-btn-sm {
    padding: 4px 8px;
    font-size: 11px;
  }

  .copy-btn-sm svg {
    width: 12px;
    height: 12px;
  }

  .copy-btn-md {
    padding: 8px 12px;
    font-size: 13px;
  }

  .copy-btn-md svg {
    width: 16px;
    height: 16px;
  }
`
