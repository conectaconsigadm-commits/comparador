import { useState } from 'react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { ProgressBar } from '../components/ProgressBar'
import { StepList, type StepItem } from '../components/StepList'
import { InlineBanner } from '../components/InlineBanner'
import { Illustration } from '../components/Illustration'

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

export interface ProcessingProgress {
  percent: number
  currentStep: number
  steps: StepItem[]
}

export interface ProcessingDetails {
  bankLines?: number
  prefFormat?: string
  prefExtracted?: number
  message?: string
}

interface ProcessingScreenProps {
  progress: ProcessingProgress
  details: ProcessingDetails
  showPartialWarning?: boolean
  onCancel: () => void
  onBack: () => void
}

/**
 * Tela 2 - Processando
 * Exibe progresso da reconciliação
 */
export function ProcessingScreen({
  progress,
  details,
  showPartialWarning = false,
  onCancel,
  onBack,
}: ProcessingScreenProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="processing-screen">
      {/* Header */}
      <header className="processing-header">
        <h1 className="processing-title">Gerando relatório…</h1>
        <p className="processing-subtitle">
          Processamento local no seu navegador.
        </p>
        <p className="processing-note">
          Se algum dado não puder ser extraído com segurança, isso será apontado
          no relatório final.
        </p>
      </header>

      {/* Grid principal */}
      <div className="processing-grid">
        {/* Coluna esquerda - Card de progresso */}
        <div className="processing-left">
          <Card>
            <div className="processing-card-header">
              <h2 className="processing-card-title">Gerando relatório…</h2>
            </div>

            {/* Progress bar */}
            <div className="processing-progress">
              <ProgressBar percent={progress.percent} />
            </div>

            {/* Steps */}
            <div className="processing-steps">
              <StepList steps={progress.steps} />
            </div>

            {/* Details box (desktop) */}
            <div className="processing-details-box desktop-only">
              <h4 className="processing-details-title">
                Detalhes do processamento
              </h4>
              <DetailsList details={details} />
            </div>

            {/* Mobile: accordion para detalhes */}
            <div className="processing-details-accordion mobile-only">
              <button
                className="processing-details-toggle"
                onClick={() => setShowDetails(!showDetails)}
              >
                <span>Ver detalhes</span>
                <ChevronIcon open={showDetails} />
              </button>
              {showDetails && (
                <div className="processing-details-content">
                  <DetailsList details={details} />
                </div>
              )}
            </div>

            {/* Warning banner */}
            {showPartialWarning && (
              <div className="processing-warning">
                <InlineBanner
                  variant="warning"
                  title="Extração parcial: algumas linhas podem não ser lidas com confiança."
                >
                  O relatório final mostrará o que foi possível.
                </InlineBanner>
              </div>
            )}

            {/* Actions */}
            <div className="processing-actions">
              <Button variant="secondary" onClick={onCancel}>
                Cancelar
              </Button>
              <button className="processing-link" onClick={onBack}>
                Voltar e trocar arquivos
              </button>
            </div>
          </Card>
        </div>

        {/* Coluna direita - Detalhes + Ilustração */}
        <aside className="processing-right">
          {/* Card de detalhes */}
          <Card padding="md">
            <h3 className="processing-info-title">Detalhe do processamento</h3>
            <DetailsList details={details} />
          </Card>

          {/* Ilustração */}
          <div className="processing-illustration">
            <Illustration name="processing" size="md" />
          </div>
        </aside>
      </div>

      <style>{processingCSS}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// COMPONENTES INTERNOS
// ─────────────────────────────────────────────────────────────

function DetailsList({ details }: { details: ProcessingDetails }) {
  return (
    <ul className="details-list">
      {details.bankLines !== undefined && (
        <li>
          <BulletIcon /> Arquivo do banco: <strong>{details.bankLines} linhas</strong>
        </li>
      )}
      {details.prefFormat && (
        <li>
          <BulletIcon /> Prefeitura: formato detectado{' '}
          <strong>({details.prefFormat})</strong>
        </li>
      )}
      {details.prefExtracted !== undefined && (
        <li>
          <BulletIcon /> Registros extraídos:{' '}
          <strong>{details.prefExtracted}</strong>
        </li>
      )}
      <li>
        <BulletIcon /> {details.message || 'Comparação em andamento…'}
      </li>
    </ul>
  )
}

// ─────────────────────────────────────────────────────────────
// ÍCONES
// ─────────────────────────────────────────────────────────────

function BulletIcon() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: '6px',
        height: '6px',
        backgroundColor: 'var(--cc-primary)',
        borderRadius: '50%',
        marginRight: '10px',
        flexShrink: 0,
      }}
    />
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: 'transform 200ms ease',
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────

const processingCSS = `
  .processing-screen {
    width: 100%;
  }

  .processing-header {
    margin-bottom: 32px;
    text-align: center;
  }

  .processing-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--cc-text);
    letter-spacing: -0.02em;
    margin-bottom: 8px;
  }

  .processing-subtitle {
    font-size: 15px;
    color: var(--cc-text-secondary);
    margin-bottom: 6px;
  }

  .processing-note {
    font-size: 13px;
    color: var(--cc-text-muted);
    max-width: 480px;
    margin: 0 auto;
    line-height: 1.5;
  }

  .processing-grid {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 32px;
    align-items: start;
  }

  .processing-left {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .processing-right {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .processing-card-header {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--cc-border);
  }

  .processing-card-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--cc-text);
    margin: 0;
    letter-spacing: -0.01em;
  }

  .processing-progress {
    margin-bottom: 24px;
  }

  .processing-steps {
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--cc-border);
  }

  .processing-details-box {
    padding: 16px;
    background: var(--cc-surface-2);
    border-radius: var(--cc-radius-md);
    margin-bottom: 20px;
  }

  .processing-details-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--cc-text);
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .processing-details-accordion {
    margin-bottom: 20px;
  }

  .processing-details-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 500;
    color: var(--cc-primary);
    background: var(--cc-primary-light);
    border: 1px solid var(--cc-primary);
    border-color: rgba(37, 99, 235, 0.2);
    border-radius: var(--cc-radius-md);
    cursor: pointer;
    transition: all 150ms ease;
  }

  .processing-details-toggle:hover {
    background: var(--cc-primary-light);
  }

  .processing-details-content {
    padding: 16px;
    margin-top: 8px;
    background: var(--cc-surface-2);
    border-radius: var(--cc-radius-md);
  }

  .processing-warning {
    margin-bottom: 20px;
  }

  .processing-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding-top: 8px;
  }

  .processing-actions button:first-child {
    width: 100%;
    max-width: 260px;
  }

  .processing-link {
    padding: 8px 12px;
    margin: -8px;
    font-size: 13px;
    font-weight: 500;
    color: var(--cc-primary);
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 150ms ease;
  }

  .processing-link:hover {
    background: var(--cc-primary-light);
  }

  .processing-info-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--cc-text);
    margin-bottom: 12px;
  }

  .processing-illustration {
    display: flex;
    justify-content: center;
    padding: 20px;
  }

  .details-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 13px;
    color: var(--cc-text-secondary);
    line-height: 1.5;
  }

  .details-list li {
    display: flex;
    align-items: center;
  }

  .details-list strong {
    color: var(--cc-text);
    font-weight: 600;
  }

  /* Desktop only */
  .desktop-only {
    display: block;
  }

  .mobile-only {
    display: none;
  }

  /* Tablet/Mobile */
  @media (max-width: 900px) {
    .processing-grid {
      grid-template-columns: 1fr;
      gap: 24px;
    }

    .processing-right {
      display: none;
    }

    .desktop-only {
      display: none;
    }

    .mobile-only {
      display: block;
    }
  }

  /* Mobile */
  @media (max-width: 640px) {
    .processing-header {
      margin-bottom: 24px;
      text-align: left;
    }

    .processing-title {
      font-size: 1.375rem;
    }

    .processing-subtitle {
      font-size: 14px;
    }

    .processing-note {
      font-size: 12px;
      margin: 0;
    }
  }
`
