import { useState } from 'react'
import { tokens } from '../styles/tokens'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { ProgressBar } from '../components/ProgressBar'
import { StepList, type StepItem } from '../components/StepList'
import { InlineBanner } from '../components/InlineBanner'

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
            <ProcessingIllustration />
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
          <BulletIcon /> TXT lido: <strong>{details.bankLines} linhas</strong>
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
        backgroundColor: tokens.colors.primary,
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

function ProcessingIllustration() {
  return (
    <svg
      width="200"
      height="140"
      viewBox="0 0 200 140"
      fill="none"
      style={{ opacity: 0.75, maxWidth: '100%', height: 'auto' }}
    >
      {/* Clipboard */}
      <rect
        x="60"
        y="20"
        width="80"
        height="100"
        rx="6"
        fill="#e8ecf2"
        stroke="#c8cfd8"
        strokeWidth="1"
      />
      {/* Clip */}
      <rect x="85" y="12" width="30" height="16" rx="3" fill="#c8cfd8" />
      <rect x="90" y="16" width="20" height="8" rx="2" fill="#b8c0cc" />

      {/* Lines */}
      <rect x="72" y="40" width="56" height="4" rx="2" fill="#b8c0cc" />
      <rect x="72" y="52" width="48" height="4" rx="2" fill="#b8c0cc" />
      <rect x="72" y="64" width="52" height="4" rx="2" fill="#b8c0cc" />
      <rect x="72" y="76" width="40" height="4" rx="2" fill="#b8c0cc" />

      {/* Checkmarks */}
      <circle cx="72" y="92" r="8" fill="rgba(52, 199, 89, 0.15)" />
      <path
        d="M68 92 L71 95 L77 89"
        stroke={tokens.colors.success}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      <circle cx="92" cy="92" r="8" fill="rgba(52, 199, 89, 0.15)" />
      <path
        d="M88 92 L91 95 L97 89"
        stroke={tokens.colors.success}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Spinner */}
      <circle
        cx="112"
        cy="92"
        r="7"
        stroke={tokens.colors.primary}
        strokeOpacity="0.2"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M112 85 a7 7 0 0 1 7 7"
        stroke={tokens.colors.primary}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 112 92"
          to="360 112 92"
          dur="1s"
          repeatCount="indefinite"
        />
      </path>
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
    margin-bottom: ${tokens.spacing.xl};
  }

  .processing-title {
    font-size: 1.875rem;
    font-weight: ${tokens.typography.fontWeight.bold};
    color: ${tokens.colors.textPrimary};
    letter-spacing: ${tokens.typography.letterSpacing.tight};
    margin-bottom: ${tokens.spacing.xs};
  }

  .processing-subtitle {
    font-size: ${tokens.typography.fontSize.md};
    color: ${tokens.colors.textSecondary};
    margin-bottom: ${tokens.spacing.sm};
  }

  .processing-note {
    font-size: ${tokens.typography.fontSize.sm};
    color: ${tokens.colors.textMuted};
    max-width: 500px;
  }

  .processing-grid {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: ${tokens.spacing.xl};
    align-items: start;
  }

  .processing-left {
    display: flex;
    flex-direction: column;
    gap: ${tokens.spacing.lg};
  }

  .processing-right {
    display: flex;
    flex-direction: column;
    gap: ${tokens.spacing.lg};
  }

  .processing-card-header {
    margin-bottom: ${tokens.spacing.lg};
  }

  .processing-card-title {
    font-size: ${tokens.typography.fontSize.lg};
    font-weight: ${tokens.typography.fontWeight.semibold};
    color: ${tokens.colors.textPrimary};
    margin: 0;
  }

  .processing-progress {
    margin-bottom: ${tokens.spacing.xl};
  }

  .processing-steps {
    margin-bottom: ${tokens.spacing.xl};
    padding-bottom: ${tokens.spacing.lg};
    border-bottom: 1px solid ${tokens.colors.surfaceBorder};
  }

  .processing-details-box {
    padding: ${tokens.spacing.base};
    background-color: rgba(0, 0, 0, 0.02);
    border-radius: ${tokens.radius.md};
    margin-bottom: ${tokens.spacing.lg};
  }

  .processing-details-title {
    font-size: ${tokens.typography.fontSize.sm};
    font-weight: ${tokens.typography.fontWeight.semibold};
    color: ${tokens.colors.textPrimary};
    margin: 0 0 ${tokens.spacing.md} 0;
  }

  .processing-details-accordion {
    margin-bottom: ${tokens.spacing.lg};
  }

  .processing-details-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: ${tokens.spacing.md};
    font-size: ${tokens.typography.fontSize.sm};
    font-weight: ${tokens.typography.fontWeight.medium};
    color: ${tokens.colors.primary};
    background-color: rgba(0, 102, 204, 0.04);
    border: 1px solid rgba(0, 102, 204, 0.1);
    border-radius: ${tokens.radius.md};
    cursor: pointer;
    transition: background-color ${tokens.transitions.fast};
  }

  .processing-details-toggle:hover {
    background-color: rgba(0, 102, 204, 0.08);
  }

  .processing-details-content {
    padding: ${tokens.spacing.base};
    margin-top: ${tokens.spacing.sm};
    background-color: rgba(0, 0, 0, 0.02);
    border-radius: ${tokens.radius.md};
  }

  .processing-warning {
    margin-bottom: ${tokens.spacing.lg};
  }

  .processing-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${tokens.spacing.md};
  }

  .processing-actions button:first-child {
    width: 100%;
    max-width: 280px;
  }

  .processing-link {
    padding: 0;
    font-size: ${tokens.typography.fontSize.sm};
    font-weight: ${tokens.typography.fontWeight.medium};
    color: ${tokens.colors.primary};
    background: none;
    border: none;
    cursor: pointer;
    transition: opacity ${tokens.transitions.fast};
  }

  .processing-link:hover {
    opacity: 0.7;
  }

  .processing-info-title {
    font-size: ${tokens.typography.fontSize.sm};
    font-weight: ${tokens.typography.fontWeight.semibold};
    color: ${tokens.colors.textPrimary};
    margin-bottom: ${tokens.spacing.md};
  }

  .processing-illustration {
    display: flex;
    justify-content: center;
    padding: ${tokens.spacing.lg};
  }

  .details-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: ${tokens.spacing.sm};
    font-size: ${tokens.typography.fontSize.sm};
    color: ${tokens.colors.textSecondary};
    line-height: 1.5;
  }

  .details-list li {
    display: flex;
    align-items: center;
  }

  .details-list strong {
    color: ${tokens.colors.textPrimary};
    font-weight: ${tokens.typography.fontWeight.medium};
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
      gap: ${tokens.spacing.lg};
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
      margin-bottom: ${tokens.spacing.lg};
    }

    .processing-title {
      font-size: 1.5rem;
    }

    .processing-subtitle {
      font-size: ${tokens.typography.fontSize.sm};
    }

    .processing-note {
      font-size: ${tokens.typography.fontSize.xs};
    }
  }
`
