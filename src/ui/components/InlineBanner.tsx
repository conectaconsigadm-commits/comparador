import { type ReactNode } from 'react'
import { tokens } from '../styles/tokens'

type BannerVariant = 'warning' | 'info' | 'error'

interface InlineBannerProps {
  variant?: BannerVariant
  title?: string
  children: ReactNode
}

/**
 * Banner inline para avisos e informações
 * Variantes: warning (amarelo), info (azul), error (vermelho)
 */
export function InlineBanner({
  variant = 'info',
  title,
  children,
}: InlineBannerProps) {
  const colors = variantColors[variant]

  return (
    <div
      className="inline-banner"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      <span className="inline-banner-icon" style={{ color: colors.icon }}>
        {variant === 'warning' && <WarningIcon />}
        {variant === 'info' && <InfoIcon />}
        {variant === 'error' && <ErrorIcon />}
      </span>
      <div className="inline-banner-content">
        {title && (
          <strong className="inline-banner-title" style={{ color: colors.title }}>
            {title}
          </strong>
        )}
        <span className="inline-banner-text" style={{ color: colors.text }}>
          {children}
        </span>
      </div>

      <style>{bannerCSS}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CORES POR VARIANTE
// ─────────────────────────────────────────────────────────────

const variantColors: Record<
  BannerVariant,
  { bg: string; border: string; icon: string; title: string; text: string }
> = {
  warning: {
    bg: 'rgba(212, 167, 44, 0.08)',
    border: 'rgba(212, 167, 44, 0.2)',
    icon: '#9a6700',
    title: '#9a6700',
    text: '#6e5000',
  },
  info: {
    bg: 'rgba(9, 105, 218, 0.06)',
    border: 'rgba(9, 105, 218, 0.15)',
    icon: '#0550ae',
    title: '#0550ae',
    text: '#0969da',
  },
  error: {
    bg: 'rgba(255, 59, 48, 0.06)',
    border: 'rgba(255, 59, 48, 0.15)',
    icon: '#cf222e',
    title: '#cf222e',
    text: '#cf222e',
  },
}

// ─────────────────────────────────────────────────────────────
// ÍCONES
// ─────────────────────────────────────────────────────────────

function WarningIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────

const bannerCSS = `
  .inline-banner {
    display: flex;
    align-items: flex-start;
    gap: ${tokens.spacing.md};
    padding: ${tokens.spacing.base};
    border-radius: ${tokens.radius.md};
    border: 1px solid;
  }

  .inline-banner-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1px;
  }

  .inline-banner-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .inline-banner-title {
    font-size: ${tokens.typography.fontSize.sm};
    font-weight: ${tokens.typography.fontWeight.semibold};
    line-height: 1.3;
  }

  .inline-banner-text {
    font-size: ${tokens.typography.fontSize.sm};
    line-height: 1.5;
  }
`
