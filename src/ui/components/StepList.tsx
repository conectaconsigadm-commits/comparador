import { tokens } from '../styles/tokens'

export interface StepItem {
  label: string
  state: 'done' | 'active' | 'pending'
}

interface StepListProps {
  steps: StepItem[]
}

/**
 * Lista de etapas do processamento
 * Com ícones de estado: done, active, pending
 */
export function StepList({ steps }: StepListProps) {
  return (
    <ul className="step-list">
      {steps.map((step, index) => (
        <li key={index} className={`step-item step-${step.state}`}>
          <span className="step-icon">
            {step.state === 'done' && <CheckIcon />}
            {step.state === 'active' && <SpinnerIcon />}
            {step.state === 'pending' && <BulletIcon />}
          </span>
          <span className="step-label">{step.label}</span>
        </li>
      ))}

      <style>{stepListCSS}</style>
    </ul>
  )
}

// ─────────────────────────────────────────────────────────────
// ÍCONES
// ─────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2ea043"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="step-spinner"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke={tokens.colors.primary}
        strokeOpacity="0.25"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M14 8a6 6 0 00-6-6"
        stroke={tokens.colors.primary}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

function BulletIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3" fill={tokens.colors.textMuted} opacity="0.5" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────

const stepListCSS = `
  .step-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: ${tokens.spacing.md};
  }

  .step-item {
    display: flex;
    align-items: center;
    gap: ${tokens.spacing.md};
    font-size: ${tokens.typography.fontSize.sm};
    line-height: 1.4;
  }

  .step-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .step-done .step-label {
    color: ${tokens.colors.textSecondary};
  }

  .step-active .step-label {
    color: ${tokens.colors.textPrimary};
    font-weight: ${tokens.typography.fontWeight.medium};
  }

  .step-pending .step-label {
    color: ${tokens.colors.textMuted};
  }

  .step-spinner {
    animation: step-spin 1s linear infinite;
  }

  @keyframes step-spin {
    to { transform: rotate(360deg); }
  }
`
