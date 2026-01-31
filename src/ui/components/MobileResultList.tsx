import { tokens } from '../styles/tokens'
import { Badge } from './Badge'
import type { ReconciliationItem } from '../../core/domain/types'

interface MobileResultListProps {
  items: ReconciliationItem[]
}

/**
 * Lista de resultados para mobile (cards compactos)
 */
export function MobileResultList({ items }: MobileResultListProps) {
  const formatMoney = (value?: number) => {
    if (value === undefined) return '—'
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const getStatusBadge = (status: ReconciliationItem['status']) => {
    const config: Record<
      ReconciliationItem['status'],
      { label: string; variant: 'success' | 'error' | 'warning' | 'info' | 'neutral' }
    > = {
      bateu: { label: 'Bateu', variant: 'success' },
      so_no_banco: { label: 'Só banco', variant: 'error' },
      so_na_prefeitura: { label: 'Só prefeitura', variant: 'warning' },
      divergente: { label: 'Divergência', variant: 'info' },
      diagnostico: { label: 'Diagnóstico', variant: 'neutral' },
    }
    const { label, variant } = config[status]
    return <Badge variant={variant}>{label}</Badge>
  }

  if (items.length === 0) {
    return (
      <div className="mobile-result-empty">
        <p>Nenhum item encontrado.</p>
        <style>{mobileListCSS}</style>
      </div>
    )
  }

  return (
    <div className="mobile-result-list">
      {items.map((item, index) => (
        <div key={`${item.matricula}-${index}`} className="mobile-result-card">
          <div className="mobile-result-header">
            {getStatusBadge(item.status)}
            <span className="mobile-result-matricula">{item.matricula}</span>
          </div>
          {(item.nome || item.cpf) && (
            <div className="mobile-result-info">
              {item.nome && <span className="mobile-result-name">{item.nome}</span>}
              {item.cpf && <span className="mobile-result-cpf">{item.cpf}</span>}
            </div>
          )}
          <div className="mobile-result-values">
            <div className="mobile-result-value">
              <span className="mobile-result-label">Banco</span>
              <span className="mobile-result-amount">
                {formatMoney(item.valorBanco)}
              </span>
            </div>
            <div className="mobile-result-value">
              <span className="mobile-result-label">Prefeitura</span>
              <span className="mobile-result-amount">
                {formatMoney(item.valorPrefeitura)}
              </span>
            </div>
          </div>
          {item.obs && <p className="mobile-result-obs">{item.obs}</p>}
        </div>
      ))}

      <style>{mobileListCSS}</style>
    </div>
  )
}

const mobileListCSS = `
  .mobile-result-list {
    display: flex;
    flex-direction: column;
    gap: ${tokens.spacing.sm};
  }

  .mobile-result-card {
    padding: ${tokens.spacing.base};
    background-color: rgba(0, 0, 0, 0.01);
    border: 1px solid ${tokens.colors.surfaceBorder};
    border-radius: ${tokens.radius.md};
  }

  .mobile-result-header {
    display: flex;
    align-items: center;
    gap: ${tokens.spacing.md};
    margin-bottom: ${tokens.spacing.sm};
  }

  .mobile-result-matricula {
    font-family: ${tokens.typography.fontFamilyMono};
    font-size: ${tokens.typography.fontSize.sm};
    font-weight: ${tokens.typography.fontWeight.medium};
    color: ${tokens.colors.textPrimary};
  }

  .mobile-result-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: ${tokens.spacing.sm};
    padding-bottom: ${tokens.spacing.xs};
    border-bottom: 1px solid ${tokens.colors.surfaceBorder};
  }

  .mobile-result-name {
    font-size: ${tokens.typography.fontSize.sm};
    color: ${tokens.colors.textPrimary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-result-cpf {
    font-family: ${tokens.typography.fontFamilyMono};
    font-size: ${tokens.typography.fontSize.xs};
    color: ${tokens.colors.textSecondary};
  }

  .mobile-result-values {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${tokens.spacing.md};
    margin-bottom: ${tokens.spacing.xs};
  }

  .mobile-result-value {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .mobile-result-label {
    font-size: ${tokens.typography.fontSize.xs};
    color: ${tokens.colors.textMuted};
  }

  .mobile-result-amount {
    font-family: ${tokens.typography.fontFamilyMono};
    font-size: ${tokens.typography.fontSize.sm};
    font-weight: ${tokens.typography.fontWeight.medium};
    color: ${tokens.colors.textPrimary};
  }

  .mobile-result-obs {
    font-size: ${tokens.typography.fontSize.xs};
    color: ${tokens.colors.textMuted};
    margin: 0;
    padding-top: ${tokens.spacing.xs};
    border-top: 1px solid ${tokens.colors.surfaceBorder};
  }

  .mobile-result-empty {
    padding: ${tokens.spacing.xl};
    text-align: center;
    color: ${tokens.colors.textMuted};
  }
`
