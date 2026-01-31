import { type ReactNode, type CSSProperties } from 'react'
import { tokens } from '../styles/tokens'

interface CardProps {
  children: ReactNode
  header?: ReactNode
  padding?: 'sm' | 'md' | 'lg'
  style?: CSSProperties
}

/**
 * Card base reutilizável
 * Com header opcional e padding consistente
 */
export function Card({ children, header, padding = 'lg', style }: CardProps) {
  const paddingMap = {
    sm: tokens.spacing.base,
    md: tokens.spacing.lg,
    lg: tokens.spacing.xl,
  }

  return (
    <div
      style={{
        backgroundColor: tokens.colors.surface,
        borderRadius: tokens.radius.lg,
        border: `1px solid ${tokens.colors.surfaceBorder}`,
        boxShadow: tokens.shadows.md,
        overflow: 'hidden',
        ...style,
      }}
    >
      {header && (
        <div
          style={{
            padding: `${tokens.spacing.base} ${paddingMap[padding]}`,
            borderBottom: `1px solid ${tokens.colors.surfaceBorder}`,
            backgroundColor: 'rgba(0, 0, 0, 0.01)',
          }}
        >
          {header}
        </div>
      )}
      <div style={{ padding: paddingMap[padding] }}>{children}</div>
    </div>
  )
}
