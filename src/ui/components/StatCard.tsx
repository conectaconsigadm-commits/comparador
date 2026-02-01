interface StatCardProps {
  title: string
  value: number
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

/**
 * Card de estatística com número grande
 * Suporta light/dark mode via CSS variables
 */
export function StatCard({ title, value, variant = 'default' }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${variant}`}>
      <span className="stat-card-value">
        {value.toLocaleString('pt-BR')}
      </span>
      <span className="stat-card-title">{title}</span>

      <style>{statCardCSS}</style>
    </div>
  )
}

const statCardCSS = `
  .stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 18px 14px;
    background: var(--cc-surface);
    border-radius: var(--cc-radius-lg);
    border: 1px solid var(--cc-border);
    box-shadow: var(--cc-shadow-glass);
    backdrop-filter: var(--cc-blur);
    -webkit-backdrop-filter: var(--cc-blur);
    text-align: center;
    min-width: 0;
    transition: all 200ms ease;
    position: relative;
    overflow: hidden;
  }

  .stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    opacity: 0.6;
    transition: opacity 200ms ease;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--cc-shadow-lg);
  }

  .stat-card:hover::before {
    opacity: 1;
  }

  .stat-card-value {
    font-size: 1.625rem;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 5px;
    letter-spacing: -0.02em;
  }

  .stat-card-title {
    font-size: 10px;
    font-weight: 600;
    color: var(--cc-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Variantes */
  .stat-card--default .stat-card-value {
    color: var(--cc-text);
  }
  .stat-card--default::before {
    background: var(--cc-text-muted);
  }

  .stat-card--success {
    border-color: rgba(5, 150, 105, 0.25);
  }
  .stat-card--success .stat-card-value {
    color: var(--cc-success);
  }
  .stat-card--success::before {
    background: var(--cc-success);
  }

  .stat-card--warning {
    border-color: rgba(202, 138, 4, 0.25);
  }
  .stat-card--warning .stat-card-value {
    color: var(--cc-warning);
  }
  .stat-card--warning::before {
    background: var(--cc-warning);
  }

  .stat-card--error {
    border-color: rgba(220, 38, 38, 0.25);
  }
  .stat-card--error .stat-card-value {
    color: var(--cc-danger);
  }
  .stat-card--error::before {
    background: var(--cc-danger);
  }

  .stat-card--info {
    border-color: rgba(8, 145, 178, 0.25);
  }
  .stat-card--info .stat-card-value {
    color: var(--cc-info);
  }
  .stat-card--info::before {
    background: var(--cc-info);
  }

  @media (max-width: 640px) {
    .stat-card {
      padding: 14px 10px;
    }

    .stat-card-value {
      font-size: 1.25rem;
    }

    .stat-card-title {
      font-size: 9px;
    }
  }
`
