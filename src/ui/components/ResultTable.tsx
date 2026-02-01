import type { ReconciliationItem } from '../../core/domain/types'

interface ResultTableProps {
  items: ReconciliationItem[]
}

/**
 * Tabela de resultados — Estilo "Swiss Ledger"
 * Livro-razão minimalista com fonte monospace para dados
 */
export function ResultTable({ items }: ResultTableProps) {
  const formatMoney = (value?: number) => {
    if (value === undefined) return '—'
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  // Status → Texto colorido (sem badges)
  const getStatusText = (status: ReconciliationItem['status']) => {
    const config: Record<
      ReconciliationItem['status'],
      { label: string; className: string }
    > = {
      bateu: { label: 'Ok', className: 'status-ok' },
      so_no_banco: { label: 'Só banco', className: 'status-error' },
      so_na_prefeitura: { label: 'Só pref.', className: 'status-warning' },
      divergente: { label: 'Diverge', className: 'status-diverge' },
      diagnostico: { label: 'Diag.', className: 'status-muted' },
    }
    const { label, className } = config[status]
    return <span className={`ledger-status ${className}`}>{label}</span>
  }

  // Detecta se há divergência de valor
  const hasDivergence = (item: ReconciliationItem) => {
    return item.status === 'divergente' && 
           item.valorBanco !== undefined && 
           item.valorPrefeitura !== undefined &&
           item.valorBanco !== item.valorPrefeitura
  }

  if (items.length === 0) {
    return (
      <div className="ledger-empty">
        <p>Nenhum item encontrado.</p>
        <style>{tableCSS}</style>
      </div>
    )
  }

  return (
    <div className="ledger-wrapper">
      <table className="ledger">
        <thead>
          <tr>
            <th className="ledger-th-status">Status</th>
            <th>Matrícula</th>
            <th>Nome</th>
            <th>CPF</th>
            <th className="ledger-th-money">Banco</th>
            <th className="ledger-th-money">Prefeitura</th>
            <th>Obs</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.matricula}-${index}`}>
              <td>{getStatusText(item.status)}</td>
              <td className="ledger-mono">{item.matricula}</td>
              <td className="ledger-name">{item.nome || '—'}</td>
              <td className="ledger-mono ledger-cpf">{item.cpf || '—'}</td>
              <td className={`ledger-mono ledger-money ${hasDivergence(item) ? 'status-diverge' : ''}`}>
                {formatMoney(item.valorBanco)}
              </td>
              <td className={`ledger-mono ledger-money ${hasDivergence(item) ? 'status-diverge' : ''}`}>
                {formatMoney(item.valorPrefeitura)}
              </td>
              <td className="ledger-obs">{item.obs || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <style>{tableCSS}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS — Swiss Ledger Table
// ═══════════════════════════════════════════════════════════════════════════

const tableCSS = `
  /* ═══════════════════════════════════════════════════════════════════════
     LEDGER — Container
     ═══════════════════════════════════════════════════════════════════════ */
  .ledger-wrapper {
    overflow-x: auto;
    background: transparent;
  }

  .ledger {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    background: transparent;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     HEADER — Uppercase, Tracking Wide
     ═══════════════════════════════════════════════════════════════════════ */
  .ledger th {
    padding: 14px 16px;
    text-align: left;
    font-family: var(--cc-font-body);
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--cc-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border-bottom: 2px solid var(--cc-border);
    white-space: nowrap;
    background: transparent;
  }

  .ledger-th-status {
    width: 80px;
  }

  .ledger-th-money {
    text-align: right !important;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     BODY — Linhas com border-bottom (sem zebra)
     ═══════════════════════════════════════════════════════════════════════ */
  .ledger td {
    padding: 14px 16px;
    color: var(--cc-text);
    border-bottom: 1px solid var(--cc-border);
    vertical-align: middle;
    background: transparent;
  }

  .ledger tbody tr {
    transition: background-color 120ms ease;
  }

  .ledger tbody tr:hover {
    background: var(--cc-surface-hover, rgba(0, 0, 0, 0.02));
  }

  .ledger tbody tr:last-child td {
    border-bottom: none;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     MONOSPACE — Dados técnicos
     ═══════════════════════════════════════════════════════════════════════ */
  .ledger-mono {
    font-family: var(--cc-font-mono);
    font-size: 0.8125rem;
    font-weight: 500;
    letter-spacing: -0.01em;
  }

  .ledger-money {
    text-align: right;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .ledger-cpf {
    color: var(--cc-text-secondary);
  }

  .ledger-name {
    font-family: var(--cc-font-body);
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ledger-obs {
    font-family: var(--cc-font-body);
    font-size: 0.75rem;
    color: var(--cc-text-muted);
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     STATUS — Texto colorido (SEM badges)
     ═══════════════════════════════════════════════════════════════════════ */
  .ledger-status {
    font-family: var(--cc-font-mono);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  /* Light Mode Colors */
  .status-ok {
    color: #064E3B;
  }

  .status-error {
    color: #B91C1C;
  }

  .status-warning {
    color: #B45309;
  }

  .status-diverge {
    color: #B91C1C;
  }

  .status-muted {
    color: var(--cc-text-muted);
  }

  /* Dark Mode Colors */
  html[data-theme="dark"] .status-ok {
    color: #34D399;
  }

  html[data-theme="dark"] .status-error {
    color: #F87171;
  }

  html[data-theme="dark"] .status-warning {
    color: #FBBF24;
  }

  html[data-theme="dark"] .status-diverge {
    color: #F87171;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     EMPTY STATE
     ═══════════════════════════════════════════════════════════════════════ */
  .ledger-empty {
    padding: 64px 24px;
    text-align: center;
    color: var(--cc-text-muted);
    font-family: var(--cc-font-body);
    font-size: 0.9375rem;
  }
`
