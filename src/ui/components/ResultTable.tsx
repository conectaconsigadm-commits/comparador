import { tokens } from '../styles/tokens'
import { Badge } from './Badge'
import type { ReconciliationItem } from '../../core/domain/types'

interface ResultTableProps {
  items: ReconciliationItem[]
}

/**
 * Tabela de resultados para desktop
 */
export function ResultTable({ items }: ResultTableProps) {
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
      <div className="result-table-empty">
        <p>Nenhum item encontrado.</p>
        <style>{tableCSS}</style>
      </div>
    )
  }

  return (
    <div className="result-table-wrapper">
      <table className="result-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Matrícula</th>
            <th>Nome</th>
            <th>CPF</th>
            <th>Banco (R$)</th>
            <th>Prefeitura (R$)</th>
            <th>Observação</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.matricula}-${index}`}>
              <td>{getStatusBadge(item.status)}</td>
              <td className="result-table-mono">{item.matricula}</td>
              <td className="result-table-name">{item.nome || '—'}</td>
              <td className="result-table-cpf">{item.cpf || '—'}</td>
              <td className="result-table-money">{formatMoney(item.valorBanco)}</td>
              <td className="result-table-money">{formatMoney(item.valorPrefeitura)}</td>
              <td className="result-table-obs">{item.obs || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <style>{tableCSS}</style>
    </div>
  )
}

const tableCSS = `
  .result-table-wrapper {
    overflow-x: auto;
  }

  .result-table {
    width: 100%;
    border-collapse: collapse;
    font-size: ${tokens.typography.fontSize.sm};
  }

  .result-table th {
    padding: ${tokens.spacing.md} ${tokens.spacing.base};
    text-align: left;
    font-weight: ${tokens.typography.fontWeight.semibold};
    color: ${tokens.colors.textSecondary};
    background-color: rgba(0, 0, 0, 0.02);
    border-bottom: 1px solid ${tokens.colors.surfaceBorder};
    white-space: nowrap;
  }

  .result-table td {
    padding: ${tokens.spacing.md} ${tokens.spacing.base};
    color: ${tokens.colors.textPrimary};
    border-bottom: 1px solid ${tokens.colors.surfaceBorder};
    vertical-align: middle;
  }

  .result-table tbody tr:hover {
    background-color: rgba(0, 0, 0, 0.01);
  }

  .result-table-mono {
    font-family: ${tokens.typography.fontFamilyMono};
    font-size: ${tokens.typography.fontSize.xs};
  }

  .result-table-money {
    font-family: ${tokens.typography.fontFamilyMono};
    font-size: ${tokens.typography.fontSize.xs};
    text-align: right;
    white-space: nowrap;
  }

  .result-table-name {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .result-table-cpf {
    font-family: ${tokens.typography.fontFamilyMono};
    font-size: ${tokens.typography.fontSize.xs};
    white-space: nowrap;
  }

  .result-table-obs {
    font-size: ${tokens.typography.fontSize.xs};
    color: ${tokens.colors.textMuted};
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .result-table-empty {
    padding: ${tokens.spacing['2xl']};
    text-align: center;
    color: ${tokens.colors.textMuted};
  }
`
