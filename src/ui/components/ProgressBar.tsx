import { tokens } from '../styles/tokens'

interface ProgressBarProps {
  percent: number
  showLabel?: boolean
}

/**
 * Barra de progresso horizontal
 * Com label opcional à direita
 */
export function ProgressBar({ percent, showLabel = true }: ProgressBarProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent))

  return (
    <div className="progress-bar-wrapper">
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
      {showLabel && (
        <span className="progress-bar-label">{Math.round(clampedPercent)}%</span>
      )}

      <style>{progressBarCSS}</style>
    </div>
  )
}

const progressBarCSS = `
  .progress-bar-wrapper {
    display: flex;
    align-items: center;
    gap: ${tokens.spacing.md};
    width: 100%;
  }

  .progress-bar-track {
    flex: 1;
    height: 8px;
    background-color: rgba(0, 0, 0, 0.06);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, ${tokens.colors.primary} 0%, #3d8bdb 100%);
    border-radius: 4px;
    transition: width 300ms ease-out;
  }

  .progress-bar-label {
    font-size: ${tokens.typography.fontSize.sm};
    font-weight: ${tokens.typography.fontWeight.semibold};
    color: ${tokens.colors.textPrimary};
    min-width: 40px;
    text-align: right;
  }
`
