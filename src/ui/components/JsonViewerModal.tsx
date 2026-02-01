import { useEffect, useRef } from 'react'
import { CopyButton } from './CopyButton'

interface JsonViewerModalProps {
  open: boolean
  onClose: () => void
  title?: string
  data: unknown
  /** Conteúdo customizado acima do JSON */
  renderHeader?: React.ReactNode
}

/**
 * Modal simples para visualização de JSON
 */
export function JsonViewerModal({
  open,
  onClose,
  title = 'Detalhes',
  data,
  renderHeader,
}: JsonViewerModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Fechar com ESC
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Prevenir scroll do body quando modal aberto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const jsonString = JSON.stringify(data, null, 2)

  return (
    <div className="json-modal-overlay" onClick={onClose}>
      <div
        className="json-modal-container"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="json-modal-title"
      >
        {/* Header */}
        <header className="json-modal-header">
          <h2 id="json-modal-title" className="json-modal-title">
            {title}
          </h2>
          <div className="json-modal-actions">
            <CopyButton text={jsonString} label="Copiar JSON" size="md" />
            <button className="json-modal-close" onClick={onClose} aria-label="Fechar">
              <CloseIcon />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="json-modal-body">
          {renderHeader}
          <div className="json-modal-section-title">Detalhes técnicos</div>
          <pre className="json-modal-pre">{jsonString}</pre>
        </div>

        {/* Footer */}
        <footer className="json-modal-footer">
          <button className="json-modal-btn" onClick={onClose}>
            Fechar
          </button>
        </footer>
      </div>

      <style>{jsonModalCSS}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ÍCONES
// ─────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────

const jsonModalCSS = `
  .json-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1001;
    padding: 16px;
    animation: jsonModalFadeIn 0.2s ease-out;
  }

  @keyframes jsonModalFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .json-modal-container {
    background: var(--cc-surface);
    border: 1px solid var(--cc-border);
    border-radius: 12px;
    box-shadow: var(--cc-shadow-xl);
    width: 100%;
    max-width: 600px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    animation: jsonModalSlideUp 0.2s ease-out;
  }

  @keyframes jsonModalSlideUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .json-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--cc-border);
    gap: 12px;
  }

  .json-modal-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--cc-text);
    margin: 0;
  }

  .json-modal-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .json-modal-close {
    background: none;
    border: none;
    padding: 6px;
    border-radius: 6px;
    cursor: pointer;
    color: var(--cc-text-secondary);
    transition: all 0.15s;
  }

  .json-modal-close:hover {
    background: var(--cc-surface-hover);
    color: var(--cc-text);
  }

  .json-modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }

  .json-modal-section-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--cc-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
  }

  .json-modal-pre {
    margin: 0;
    padding: 16px;
    background: var(--cc-surface-elevated);
    border: 1px solid var(--cc-border);
    border-radius: 8px;
    font-family: 'SF Mono', Menlo, Monaco, 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.6;
    color: var(--cc-text);
    white-space: pre-wrap;
    word-break: break-word;
    overflow-x: auto;
  }

  .json-modal-footer {
    display: flex;
    justify-content: flex-end;
    padding: 12px 20px;
    border-top: 1px solid var(--cc-border);
  }

  .json-modal-btn {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid var(--cc-border);
    background: var(--cc-surface-elevated);
    color: var(--cc-text);
    transition: all 0.15s;
  }

  .json-modal-btn:hover {
    background: var(--cc-surface-hover);
  }

  @media (max-width: 640px) {
    .json-modal-container {
      max-height: 90vh;
    }

    .json-modal-header {
      flex-wrap: wrap;
    }
  }
`
