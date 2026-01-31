import { type ReactNode } from 'react'
import { tokens } from '../styles/tokens'

type BadgeVariant = 'success' | 'info' | 'warning' | 'neutral' | 'error'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
}

/**
 * Badge para indicar status
 * Apple-style com cores suaves
 */
export function Badge({ variant = 'neutral', children }: BadgeProps) {
  const colors = variantColors[variant]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        fontSize: tokens.typography.fontSize.xs,
        fontWeight: tokens.typography.fontWeight.medium,
        lineHeight: 1.4,
        color: colors.text,
        backgroundColor: colors.bg,
        borderRadius: tokens.radius.sm,
        border: `1px solid ${colors.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// CORES POR VARIANTE
// ─────────────────────────────────────────────────────────────

const variantColors: Record<
  BadgeVariant,
  { text: string; bg: string; border: string }
> = {
  success: {
    text: '#1a7f37',
    bg: 'rgba(46, 160, 67, 0.08)',
    border: 'rgba(46, 160, 67, 0.2)',
  },
  info: {
    text: '#0550ae',
    bg: 'rgba(9, 105, 218, 0.08)',
    border: 'rgba(9, 105, 218, 0.2)',
  },
  warning: {
    text: '#9a6700',
    bg: 'rgba(212, 167, 44, 0.12)',
    border: 'rgba(212, 167, 44, 0.3)',
  },
  error: {
    text: '#cf222e',
    bg: 'rgba(255, 59, 48, 0.08)',
    border: 'rgba(255, 59, 48, 0.2)',
  },
  neutral: {
    text: tokens.colors.textSecondary,
    bg: 'rgba(0, 0, 0, 0.04)',
    border: 'rgba(0, 0, 0, 0.08)',
  },
}
