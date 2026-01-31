import { tokens } from '../styles/tokens'

export interface KeyValueItem {
  label: string
  value: string | number | undefined
  icon?: 'bullet' | 'check' | 'arrow'
}

interface KeyValueListProps {
  items: KeyValueItem[]
  size?: 'sm' | 'md'
}

/**
 * Lista de chave-valor com ícone opcional
 * Para exibir métricas como "Linhas lidas: 123"
 */
export function KeyValueList({ items, size = 'sm' }: KeyValueListProps) {
  const fontSize =
    size === 'sm' ? tokens.typography.fontSize.xs : tokens.typography.fontSize.sm

  return (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      {items.map((item, index) => (
        <li
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize,
            color: tokens.colors.textSecondary,
            lineHeight: 1.5,
          }}
        >
          <span
            style={{
              color: tokens.colors.textMuted,
              fontSize: '10px',
              width: '12px',
              textAlign: 'center',
            }}
          >
            {getIcon(item.icon)}
          </span>
          <span style={{ color: tokens.colors.textMuted }}>{item.label}:</span>
          <span
            style={{
              color: tokens.colors.textPrimary,
              fontWeight: tokens.typography.fontWeight.medium,
            }}
          >
            {item.value ?? '—'}
          </span>
        </li>
      ))}
    </ul>
  )
}

function getIcon(icon?: 'bullet' | 'check' | 'arrow'): string {
  switch (icon) {
    case 'check':
      return '✓'
    case 'arrow':
      return '→'
    case 'bullet':
    default:
      return '•'
  }
}
