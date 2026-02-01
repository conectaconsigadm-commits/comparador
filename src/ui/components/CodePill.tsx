import { useState, useCallback } from 'react'

interface CodePillProps {
  /** Código técnico a exibir */
  code: string
  /** Mostrar label "código:" antes (default: true) */
  showLabel?: boolean
}

/**
 * Pill discreta para exibir código técnico
 * - Desktop: tooltip no hover
 * - Mobile: tap copia o código
 */
export function CodePill({ code, showLabel = true }: CodePillProps) {
  const [copied, setCopied] = useState(false)

  const handleClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch (err) {
      console.error('Falha ao copiar:', err)
    }
  }, [code])

  return (
    <>
      <button
        className={`code-pill ${copied ? 'code-pill-copied' : ''}`}
        onClick={handleClick}
        title={`Código técnico: ${code}\nClique para copiar`}
        aria-label={`Código técnico: ${code}. Clique para copiar.`}
      >
        {showLabel && <span className="code-pill-label">código:</span>}
        <span className="code-pill-code">{code}</span>
        {copied && <span className="code-pill-feedback">copiado!</span>}
      </button>
      <style>{codePillCSS}</style>
    </>
  )
}

const codePillCSS = `
  .code-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    background: var(--cc-surface-elevated);
    border: 1px solid var(--cc-border);
    border-radius: 12px;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
    max-width: 100%;
    overflow: hidden;
  }

  .code-pill:hover {
    background: var(--cc-surface-hover);
    border-color: var(--cc-border-hover);
  }

  .code-pill-copied {
    background: var(--cc-success-light, rgba(34, 197, 94, 0.1));
    border-color: var(--cc-success);
  }

  .code-pill-label {
    color: var(--cc-text-muted);
    font-weight: 400;
  }

  .code-pill-code {
    font-family: 'SF Mono', Menlo, Monaco, monospace;
    color: var(--cc-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .code-pill:hover .code-pill-code {
    color: var(--cc-text);
  }

  .code-pill-copied .code-pill-code {
    color: var(--cc-success);
  }

  .code-pill-feedback {
    color: var(--cc-success);
    font-weight: 500;
    font-size: 10px;
    margin-left: 2px;
  }
`
