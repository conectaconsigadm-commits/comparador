import { useState, useMemo } from 'react'
import { tokens } from '../styles/tokens'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { StatCard } from '../components/StatCard'
import { Tabs, type TabItem } from '../components/Tabs'
import { SearchInput } from '../components/SearchInput'
import { ResultTable } from '../components/ResultTable'
import { MobileResultList } from '../components/MobileResultList'
import { DiagnosticsList } from '../components/DiagnosticsList'
import type { ReconciliationResult } from '../../core/domain/types'

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

interface ResultScreenProps {
  result: ReconciliationResult
  onNewUpload: () => void
  onDownload: () => void
  canDownload: boolean
}

type TabId = 'todos' | 'bateu' | 'so_no_banco' | 'so_na_prefeitura' | 'divergente' | 'diagnosticos'

/**
 * Tela 3 - Resultado da validação
 */
export function ResultScreen({
  result,
  onNewUpload,
  onDownload,
  canDownload,
}: ResultScreenProps) {
  const [activeTab, setActiveTab] = useState<TabId>('todos')
  const [query, setQuery] = useState('')

  const { summary, items, diagnostics } = result

  // ─────────────────────────────────────────────────────────────
  // TABS
  // ─────────────────────────────────────────────────────────────

  const tabs: TabItem[] = [
    { id: 'todos', label: 'Todos', count: items.length },
    { id: 'bateu', label: 'Bateu', count: summary.counts.bateu },
    { id: 'so_no_banco', label: 'Só banco', count: summary.counts.so_no_banco },
    { id: 'so_na_prefeitura', label: 'Só prefeitura', count: summary.counts.so_na_prefeitura },
    { id: 'divergente', label: 'Divergências', count: summary.counts.divergente },
    { id: 'diagnosticos', label: 'Diagnósticos', count: diagnostics.length },
  ]

  // ─────────────────────────────────────────────────────────────
  // FILTRO
  // ─────────────────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    let filtered = items

    // Filtrar por tab
    if (activeTab !== 'todos' && activeTab !== 'diagnosticos') {
      filtered = filtered.filter((item) => item.status === activeTab)
    }

    // Filtrar por busca (matrícula, nome ou CPF)
    if (query.trim()) {
      const q = query.toLowerCase()
      filtered = filtered.filter((item) =>
        item.matricula.toLowerCase().includes(q) ||
        (item.nome && item.nome.toLowerCase().includes(q)) ||
        (item.cpf && item.cpf.includes(q))
      )
    }

    return filtered
  }, [items, activeTab, query])

  // ─────────────────────────────────────────────────────────────
  // RESUMO RÁPIDO
  // ─────────────────────────────────────────────────────────────

  const quickSummary = useMemo(() => {
    const reasons: string[] = []

    if (summary.counts.divergente > 0) {
      reasons.push('Valores divergentes entre banco e prefeitura')
    }
    if (summary.counts.so_no_banco > 0) {
      reasons.push('Itens do banco ausentes na prefeitura')
    }
    if (summary.counts.so_na_prefeitura > 0) {
      reasons.push('Itens da prefeitura ausentes no banco')
    }
    if (diagnostics.some((d) => d.severity === 'warn' || d.severity === 'error')) {
      reasons.push('Extração parcial ou formato variável')
    }

    return reasons.slice(0, 3)
  }, [summary.counts, diagnostics])

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="result-screen">
      {/* Header com ações */}
      <header className="result-header">
        <div className="result-header-left">
          <h1 className="result-title">Resultado da validação</h1>
          <p className="result-subtitle">
            Conferência pronta para download em Excel.
          </p>
          <div className="result-chips">
            {summary.competencia && (
              <Badge variant="info">Competência: {summary.competencia}</Badge>
            )}
            <Badge
              variant={
                summary.extracao === 'completa'
                  ? 'success'
                  : summary.extracao === 'parcial'
                  ? 'warning'
                  : 'error'
              }
            >
              Extração: {summary.extracao}
            </Badge>
          </div>
        </div>
        <div className="result-header-actions">
          <Button variant="secondary" onClick={onNewUpload}>
            Novo upload
          </Button>
          <Button
            variant="primary"
            onClick={onDownload}
            disabled={!canDownload}
          >
            Baixar Excel
          </Button>
        </div>
      </header>

      {/* Cards de contagem */}
      <div className="result-stats">
        <StatCard title="Bateu" value={summary.counts.bateu} variant="success" />
        <StatCard title="Só banco" value={summary.counts.so_no_banco} variant="error" />
        <StatCard title="Só prefeitura" value={summary.counts.so_na_prefeitura} variant="warning" />
        <StatCard title="Divergências" value={summary.counts.divergente} variant="info" />
      </div>

      {/* Grid principal */}
      <div className="result-grid">
        {/* Coluna esquerda - Tabela */}
        <div className="result-main">
          <Card>
            {/* Search + Tabs */}
            <div className="result-toolbar">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Buscar matrícula"
              />
            </div>

            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={(id) => setActiveTab(id as TabId)}
            />

            {/* Conteúdo */}
            <div className="result-content">
              {activeTab === 'diagnosticos' ? (
                <DiagnosticsList diagnostics={diagnostics} />
              ) : (
                <>
                  {/* Desktop: tabela */}
                  <div className="result-table-desktop">
                    <ResultTable items={filteredItems} />
                  </div>
                  {/* Mobile: lista */}
                  <div className="result-table-mobile">
                    <MobileResultList items={filteredItems} />
                  </div>
                </>
              )}
            </div>

            {/* CTA inferior */}
            <div className="result-cta">
              <Button
                variant="primary"
                onClick={onDownload}
                disabled={!canDownload}
                style={{ width: '100%', maxWidth: '320px' }}
              >
                Baixar Excel
              </Button>
            </div>
          </Card>
        </div>

        {/* Coluna direita - Resumo */}
        <aside className="result-aside">
          <Card padding="md">
            <h3 className="result-aside-title">Resumo rápido</h3>
            <div className="result-aside-stat">
              <span className="result-aside-label">Taxa de match</span>
              <span className="result-aside-value">
                {summary.taxaMatch?.toFixed(1) || 0}%
              </span>
            </div>

            {quickSummary.length > 0 && (
              <>
                <h4 className="result-aside-subtitle">
                  Principais motivos de problema:
                </h4>
                <ul className="result-aside-list">
                  {quickSummary.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          {/* Ilustração */}
          <div className="result-illustration">
            <ResultIllustration />
          </div>
        </aside>
      </div>

      <style>{resultCSS}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ILUSTRAÇÃO
// ─────────────────────────────────────────────────────────────

function ResultIllustration() {
  return (
    <svg
      width="180"
      height="120"
      viewBox="0 0 180 120"
      fill="none"
      style={{ opacity: 0.7, maxWidth: '100%', height: 'auto' }}
    >
      {/* Documento com checkmark */}
      <rect
        x="50"
        y="15"
        width="80"
        height="95"
        rx="6"
        fill="#e8ecf2"
        stroke="#c8cfd8"
        strokeWidth="1"
      />
      <rect x="62" y="30" width="56" height="4" rx="2" fill="#b8c0cc" />
      <rect x="62" y="42" width="48" height="4" rx="2" fill="#b8c0cc" />
      <rect x="62" y="54" width="52" height="4" rx="2" fill="#b8c0cc" />
      <rect x="62" y="66" width="40" height="4" rx="2" fill="#b8c0cc" />

      {/* Checkmark grande */}
      <circle cx="90" cy="90" r="16" fill="rgba(52, 199, 89, 0.15)" />
      <path
        d="M82 90 L87 95 L98 84"
        stroke={tokens.colors.success}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Estrelas decorativas */}
      <circle cx="40" cy="40" r="3" fill={tokens.colors.primary} opacity="0.3" />
      <circle cx="145" cy="30" r="4" fill={tokens.colors.success} opacity="0.3" />
      <circle cx="150" cy="80" r="2" fill={tokens.colors.primary} opacity="0.2" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────

const resultCSS = `
  .result-screen {
    width: 100%;
  }

  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: ${tokens.spacing.lg};
    margin-bottom: ${tokens.spacing.xl};
    flex-wrap: wrap;
  }

  .result-header-left {
    flex: 1;
    min-width: 280px;
  }

  .result-title {
    font-size: 1.875rem;
    font-weight: ${tokens.typography.fontWeight.bold};
    color: ${tokens.colors.textPrimary};
    letter-spacing: ${tokens.typography.letterSpacing.tight};
    margin-bottom: ${tokens.spacing.xs};
  }

  .result-subtitle {
    font-size: ${tokens.typography.fontSize.md};
    color: ${tokens.colors.textSecondary};
    margin-bottom: ${tokens.spacing.md};
  }

  .result-chips {
    display: flex;
    flex-wrap: wrap;
    gap: ${tokens.spacing.sm};
  }

  .result-header-actions {
    display: flex;
    gap: ${tokens.spacing.sm};
    flex-shrink: 0;
  }

  .result-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: ${tokens.spacing.base};
    margin-bottom: ${tokens.spacing.xl};
  }

  .result-grid {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: ${tokens.spacing.xl};
    align-items: start;
  }

  .result-main {
    min-width: 0;
  }

  .result-toolbar {
    margin-bottom: ${tokens.spacing.lg};
  }

  .result-content {
    margin-bottom: ${tokens.spacing.xl};
    max-height: 500px;
    overflow-y: auto;
  }

  .result-table-desktop {
    display: block;
  }

  .result-table-mobile {
    display: none;
  }

  .result-cta {
    display: flex;
    justify-content: center;
    padding-top: ${tokens.spacing.lg};
    border-top: 1px solid ${tokens.colors.surfaceBorder};
  }

  .result-aside {
    display: flex;
    flex-direction: column;
    gap: ${tokens.spacing.lg};
  }

  .result-aside-title {
    font-size: ${tokens.typography.fontSize.sm};
    font-weight: ${tokens.typography.fontWeight.semibold};
    color: ${tokens.colors.textPrimary};
    margin-bottom: ${tokens.spacing.md};
  }

  .result-aside-stat {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: ${tokens.spacing.base};
    background-color: rgba(0, 102, 204, 0.04);
    border-radius: ${tokens.radius.md};
    margin-bottom: ${tokens.spacing.lg};
  }

  .result-aside-label {
    font-size: ${tokens.typography.fontSize.sm};
    color: ${tokens.colors.textSecondary};
  }

  .result-aside-value {
    font-size: 1.5rem;
    font-weight: ${tokens.typography.fontWeight.bold};
    color: ${tokens.colors.primary};
  }

  .result-aside-subtitle {
    font-size: ${tokens.typography.fontSize.xs};
    font-weight: ${tokens.typography.fontWeight.semibold};
    color: ${tokens.colors.textSecondary};
    margin-bottom: ${tokens.spacing.sm};
  }

  .result-aside-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: ${tokens.spacing.xs};
    font-size: ${tokens.typography.fontSize.xs};
    color: ${tokens.colors.textMuted};
    line-height: 1.5;
  }

  .result-aside-list li::before {
    content: '•';
    margin-right: 8px;
    color: ${tokens.colors.error};
  }

  .result-illustration {
    display: flex;
    justify-content: center;
    padding: ${tokens.spacing.base};
  }

  /* Tablet */
  @media (max-width: 900px) {
    .result-grid {
      grid-template-columns: 1fr;
    }

    .result-aside {
      order: 2;
    }

    .result-stats {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* Mobile */
  @media (max-width: 640px) {
    .result-header {
      flex-direction: column;
    }

    .result-header-actions {
      width: 100%;
      flex-direction: column;
    }

    .result-header-actions button {
      width: 100%;
    }

    .result-title {
      font-size: 1.5rem;
    }

    .result-table-desktop {
      display: none;
    }

    .result-table-mobile {
      display: block;
    }

    .result-illustration {
      display: none;
    }
  }
`
