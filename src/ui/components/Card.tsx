import { type ReactNode, type CSSProperties } from 'react'

interface CardProps {
  children: ReactNode
  header?: ReactNode
  padding?: 'sm' | 'md' | 'lg'
  variant?: 'glass' | 'solid'
  style?: CSSProperties
  className?: string
}

const paddingMap = {
  sm: '16px',
  md: '20px',
  lg: '24px',
}

/**
 * Card base reutilizável com glassmorphism
 * Usa tokens CSS para suporte a light/dark mode
 */
export function Card({ 
  children, 
  header, 
  padding = 'lg', 
  variant = 'glass',
  style, 
  className = '' 
}: CardProps) {
  const cardClass = variant === 'glass' ? 'cc-card' : 'cc-card-solid'

  return (
    <div
      className={`${cardClass} ${className}`}
      style={{
        overflow: 'visible',
        ...style,
      }}
    >
      {header && (
        <div
          style={{
            padding: `12px ${paddingMap[padding]}`,
            borderBottom: '1px solid var(--cc-border)',
            backgroundColor: 'var(--cc-surface-2)',
          }}
        >
          {header}
        </div>
      )}
      <div style={{ padding: paddingMap[padding] }}>{children}</div>
    </div>
  )
}
