import { useEffect, useRef } from 'react'
import type { BankParsedData, PrefeituraParsedData } from '../state/appState'
import { groupDiagnostics, hasCriticalErrors } from '../utils/groupDiagnostics'
import { getDiagnosticCopyWithFallback } from '../diagnostics/catalog'
import { getExtractionStatusText } from '../diagnostics/format'
import { CodePill } from './CodePill'

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

interface ExtractionPreviewModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (force?: boolean) => void
  bank: BankParsedData | null
  pref: PrefeituraParsedData | null
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────────────────────

export function ExtractionPreviewModal({
  open,
  onClose,
  onConfirm,
  bank,
  pref,
}: ExtractionPreviewModalProps) {
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

  // Dados derivados
  const prefExtracao = pref?.extracao || 'falhou'
  const isFailed = prefExtracao === 'falhou'
  const isPartial = prefExtracao === 'parcial'
  const hasCritical = pref ? hasCriticalErrors(pref.diagnostics) : true

  const canContinue = !isFailed && !hasCritical
  const needsForceConfirm = isPartial && canContinue

  // Amostra de 10 linhas da prefeitura
  const sampleRows = pref?.rows.slice(0, 10) || []

  // Diagnósticos agrupados (top 8)
  const allDiagnostics = [
    ...(bank?.diagnostics || []),
    ...(pref?.diagnostics || []),
  ]
  const groupedDiags = groupDiagnostics(allDiagnostics, 8)

  // Formato display
  const formatoDisplay =
    pref?.formato === 'csv_report_v1'
      ? 'CSV'
      : pref?.formato === 'xlsx_table_v1'
        ? 'XLSX'
        : pref?.formato === 'pdf_text_report_v1'
          ? 'PDF'
          : pref?.formato === 'docx_text_report_v1'
            ? 'DOCX'
            : pref?.formato || 'Desconhecido'

  // Status display
  const statusDisplay =
    prefExtracao === 'completa'
      ? '✓ Completa'
      : prefExtracao === 'parcial'
        ? '⚠ Parcial'
        : '✗ Falhou'

  const statusClass =
    prefExtracao === 'completa'
      ? 'status-success'
      : prefExtracao === 'parcial'
        ? 'status-warning'
        : 'status-error'

  // Yield (aproveitamento)
  // Tentar pegar do summary se existir
  const yieldPercent =
    pref && pref.extracted > 0 ? '100%' : pref?.extracted === 0 ? '0%' : '—'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-title"
      >
        {/* Header */}
        <header className="modal-header">
          <h2 id="preview-title" className="modal-title">
            Prévia da extração
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <CloseIcon />
          </button>
        </header>

        {/* Body */}
        <div className="modal-body">
          {/* Seção Banco */}
          <section className="preview-section">
            <h3 className="section-title">
              <BankIcon /> Banco
            </h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Linhas detectadas</span>
                <span className="stat-value">{bank?.lines || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Competência</span>
                <span className="stat-value">{bank?.competencia || '—'}</span>
              </div>
            </div>
          </section>

          {/* Seção Prefeitura */}
          <section className="preview-section">
            <h3 className="section-title">
              <PrefeituraIcon /> Prefeitura
            </h3>
            <div className="stats-grid stats-grid-4">
              <div className="stat-item">
                <span className="stat-label">Formato</span>
                <span className="stat-value">{formatoDisplay}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Linhas extraídas</span>
                <span className="stat-value">{pref?.extracted || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Aproveitamento</span>
                <span className="stat-value">{yieldPercent}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Status</span>
                <span className={`stat-value ${statusClass}`}>{statusDisplay}</span>
              </div>
            </div>
            {pref?.competencia && (
              <div className="competencia-badge">
                Competência: {pref.competencia}
              </div>
            )}
          </section>

          {/* Amostra */}
          {sampleRows.length > 0 && (
            <section className="preview-section">
              <h3 className="section-title">
                <SampleIcon /> Amostra (primeiras {sampleRows.length} linhas)
              </h3>
              <div className="sample-table-container">
                <table className="sample-table">
                  <thead>
                    <tr>
                      <th>Matrícula</th>
                      <th>Valor (R$)</th>
                      <th>Evento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleRows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="mono">{row.matricula}</td>
                        <td className="mono">{formatMoney(row.valor)}</td>
                        <td>{row.meta?.evento || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Diagnósticos humanizados */}
          {groupedDiags.length > 0 && (
            <section className="preview-section">
              <h3 className="section-title">
                <DiagIcon /> Diagnósticos ({allDiagnostics.length} total)
              </h3>
              <div className="diag-list">
                {groupedDiags.map((diag, idx) => {
                  const copy = getDiagnosticCopyWithFallback(diag.code)
                  return (
                    <div key={idx} className={`diag-item diag-${diag.severity}`}>
                      <div className="diag-header-row">
                        <span className="diag-badge">{diag.severity === 'error' ? 'Erro' : diag.severity === 'warn' ? 'Aviso' : 'Info'}</span>
                        <CodePill code={diag.code} showLabel={false} />
                        {diag.count > 1 && (
                          <span className="diag-count">×{diag.count}</span>
                        )}
                      </div>
                      <div className="diag-content">
                        <span className="diag-title">{copy.title}</span>
                        <span className="diag-message">{copy.message}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Warning se falhou */}
          {isFailed && (
            <div className="preview-warning error">
              <WarningIcon />
              <div>
                <strong>{getExtractionStatusText('falhou').title}</strong>
                <p>{getExtractionStatusText('falhou').message}</p>
                {getExtractionStatusText('falhou').action && (
                  <p className="preview-action">{getExtractionStatusText('falhou').action}</p>
                )}
              </div>
            </div>
          )}

          {/* Warning se parcial */}
          {isPartial && !isFailed && (
            <div className="preview-warning warning">
              <WarningIcon />
              <div>
                <strong>{getExtractionStatusText('parcial').title}</strong>
                <p>{getExtractionStatusText('parcial').message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Voltar
          </button>

          {canContinue && !needsForceConfirm && (
            <button className="btn btn-primary" onClick={() => onConfirm(false)}>
              Continuar
            </button>
          )}

          {needsForceConfirm && (
            <button
              className="btn btn-warning"
              onClick={() => onConfirm(true)}
            >
              Continuar mesmo assim
            </button>
          )}

          {!canContinue && (
            <button className="btn btn-primary" disabled>
              Continuar
            </button>
          )}
        </footer>
      </div>

      <style>{modalCSS}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function formatMoney(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
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

function BankIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
    </svg>
  )
}

function PrefeituraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  )
}

function SampleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  )
}

function DiagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────

const modalCSS = `
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal-container {
    background: var(--cc-surface);
    border: 1px solid var(--cc-border);
    border-radius: 16px;
    box-shadow: var(--cc-shadow-xl);
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.25s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--cc-border);
  }

  .modal-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--cc-text);
    margin: 0;
  }

  .modal-close {
    background: none;
    border: none;
    padding: 8px;
    border-radius: 8px;
    cursor: pointer;
    color: var(--cc-text-secondary);
    transition: all 0.15s;
  }

  .modal-close:hover {
    background: var(--cc-surface-hover);
    color: var(--cc-text);
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid var(--cc-border);
  }

  /* Sections */
  .preview-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--cc-text);
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
  }

  .section-title svg {
    color: var(--cc-primary);
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stats-grid-4 {
    grid-template-columns: repeat(4, 1fr);
  }

  .stat-item {
    background: var(--cc-surface-elevated);
    border: 1px solid var(--cc-border);
    border-radius: 10px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stat-label {
    font-size: 12px;
    color: var(--cc-text-secondary);
  }

  .stat-value {
    font-size: 16px;
    font-weight: 600;
    color: var(--cc-text);
  }

  .stat-value.status-success { color: var(--cc-success); }
  .stat-value.status-warning { color: var(--cc-warning); }
  .stat-value.status-error { color: var(--cc-error); }

  .competencia-badge {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    background: var(--cc-primary-muted);
    color: var(--cc-primary);
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    width: fit-content;
  }

  /* Sample Table */
  .sample-table-container {
    overflow-x: auto;
    border: 1px solid var(--cc-border);
    border-radius: 10px;
  }

  .sample-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .sample-table th,
  .sample-table td {
    padding: 10px 14px;
    text-align: left;
    border-bottom: 1px solid var(--cc-border);
  }

  .sample-table th {
    background: var(--cc-surface-elevated);
    font-weight: 600;
    color: var(--cc-text-secondary);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .sample-table tbody tr:last-child td {
    border-bottom: none;
  }

  .sample-table tbody tr:hover {
    background: var(--cc-surface-hover);
  }

  .sample-table .mono {
    font-family: 'SF Mono', Menlo, Monaco, monospace;
  }

  /* Diagnostics */
  .diag-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .diag-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    background: var(--cc-surface-elevated);
    border: 1px solid var(--cc-border);
    border-radius: 10px;
    font-size: 13px;
  }

  .diag-item.diag-error {
    border-left: 3px solid var(--cc-error);
    background: rgba(239, 68, 68, 0.03);
  }

  .diag-item.diag-warn {
    border-left: 3px solid var(--cc-warning);
    background: rgba(245, 158, 11, 0.03);
  }

  .diag-item.diag-info {
    border-left: 3px solid var(--cc-success);
  }

  .diag-header-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .diag-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 4px;
  }

  .diag-error .diag-badge {
    background: var(--cc-error);
    color: white;
  }

  .diag-warn .diag-badge {
    background: var(--cc-warning);
    color: white;
  }

  .diag-info .diag-badge {
    background: var(--cc-success);
    color: white;
  }

  .diag-count {
    font-size: 11px;
    font-weight: 600;
    color: var(--cc-text-secondary);
    background: var(--cc-surface);
    padding: 2px 6px;
    border-radius: 10px;
  }

  .diag-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .diag-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--cc-text);
  }

  .diag-message {
    font-size: 12px;
    color: var(--cc-text-secondary);
    line-height: 1.4;
  }

  .preview-action {
    margin-top: 4px;
    font-weight: 500;
  }

  /* Warning Box */
  .preview-warning {
    display: flex;
    gap: 12px;
    padding: 16px;
    border-radius: 10px;
    border: 1px solid;
  }

  .preview-warning.error {
    background: rgba(239, 68, 68, 0.08);
    border-color: var(--cc-error);
    color: var(--cc-error);
  }

  .preview-warning.warning {
    background: rgba(245, 158, 11, 0.08);
    border-color: var(--cc-warning);
    color: var(--cc-warning);
  }

  .preview-warning svg {
    flex-shrink: 0;
    margin-top: 2px;
  }

  .preview-warning strong {
    display: block;
    margin-bottom: 4px;
  }

  .preview-warning p {
    margin: 0;
    font-size: 13px;
    opacity: 0.9;
  }

  /* Buttons */
  .btn {
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    border: none;
  }

  .btn-primary {
    background: var(--cc-primary);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--cc-primary-hover);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: var(--cc-surface-elevated);
    color: var(--cc-text);
    border: 1px solid var(--cc-border);
  }

  .btn-secondary:hover {
    background: var(--cc-surface-hover);
  }

  .btn-warning {
    background: var(--cc-warning);
    color: white;
  }

  .btn-warning:hover {
    filter: brightness(0.95);
  }

  /* Responsive */
  @media (max-width: 640px) {
    .modal-container {
      max-height: 100vh;
      height: 100%;
      border-radius: 0;
    }

    .modal-overlay {
      padding: 0;
    }

    .stats-grid-4 {
      grid-template-columns: repeat(2, 1fr);
    }

    .modal-header {
      padding: 16px 20px;
    }

    .modal-body {
      padding: 20px;
    }

    .modal-footer {
      padding: 12px 20px;
    }

    .diag-item {
      flex-direction: column;
      align-items: flex-start;
    }

    .diag-message {
      min-width: unset;
      width: 100%;
      margin-top: 4px;
    }
  }
`
