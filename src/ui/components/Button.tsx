import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { tokens } from '../styles/tokens'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
  children: ReactNode
}

/**
 * Botão base reutilizável
 * Variantes: primary, secondary, ghost
 * Estados: disabled, loading
 */
export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...(isDisabled ? disabledStyles : {}),
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          Object.assign(e.currentTarget.style, hoverStyles[variant])
        }
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, variantStyles[variant])
      }}
      {...props}
    >
      {loading && <Spinner />}
      <span style={{ opacity: loading ? 0.7 : 1 }}>{children}</span>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// SPINNER
// ─────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{
        marginRight: '8px',
        animation: 'spin 1s linear infinite',
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M14 8a6 6 0 00-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────

const baseStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '10px 20px',
  fontSize: tokens.typography.fontSize.base,
  fontWeight: tokens.typography.fontWeight.medium,
  fontFamily: 'inherit',
  lineHeight: '1.4',
  borderRadius: tokens.radius.md,
  border: 'none',
  cursor: 'pointer',
  transition: `all ${tokens.transitions.normal}`,
  whiteSpace: 'nowrap',
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: tokens.colors.primary,
    color: tokens.colors.textInverse,
    boxShadow: `0 1px 2px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
  },
  secondary: {
    backgroundColor: tokens.colors.surface,
    color: tokens.colors.textPrimary,
    border: `1px solid ${tokens.colors.surfaceBorder}`,
    boxShadow: tokens.shadows.sm,
  },
  ghost: {
    backgroundColor: 'transparent',
    color: tokens.colors.primary,
  },
}

const hoverStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: tokens.colors.primaryHover,
  },
  secondary: {
    backgroundColor: tokens.colors.surfaceHover,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  ghost: {
    backgroundColor: tokens.colors.primaryLight,
  },
}

const disabledStyles: React.CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed',
}
