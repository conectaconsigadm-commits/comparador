import { useState, useMemo } from 'react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Tabs, type TabItem } from '../components/Tabs'
import { SearchInput } from '../components/SearchInput'
import { ResultTable } from '../components/ResultTable'
import { MobileResultList } from '../components/MobileResultList'
import { DiagnosticsPanel } from '../components/DiagnosticsPanel'
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
 * Estilo "Swiss Ledger" — Modern Editorial
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
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="result-screen">
      {/* Header — Título + Ações */}
      <header className="result-header">
        <div className="result-header-left">
          <h1 className="result-title">Resultado da Validação</h1>
          <p className="result-subtitle">
            Conferência pronta para download.
            {summary.competencia && (
              <span className="result-competencia"> • Competência: {summary.competencia}</span>
            )}
          </p>
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

      {/* Big Metrics — Números gigantes com separadores */}
      <div className="result-metrics">
        <div className="metric metric-ok">
          <span className="metric-value">{summary.counts.bateu}</span>
          <span className="metric-label">Bateu</span>
        </div>
        <div className="metric-divider" />
        <div className="metric metric-error">
          <span className="metric-value">{summary.counts.so_no_banco}</span>
          <span className="metric-label">Só Banco</span>
        </div>
        <div className="metric-divider" />
        <div className="metric metric-warning">
          <span className="metric-value">{summary.counts.so_na_prefeitura}</span>
          <span className="metric-label">Só Prefeitura</span>
        </div>
        <div className="metric-divider" />
        <div className="metric metric-diverge">
          <span className="metric-value">{summary.counts.divergente}</span>
          <span className="metric-label">Divergências</span>
        </div>
      </div>

      {/* Main Content — Tabela */}
      <Card>
        {/* Toolbar: Search + Taxa */}
        <div className="result-toolbar">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Buscar matrícula, nome ou CPF"
          />
          <div className="result-match-rate">
            <span className="match-label">Taxa de match</span>
            <span className="match-value">{summary.taxaMatch?.toFixed(1) || 0}%</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as TabId)}
        />

        {/* Content */}
        <div className="result-content">
          {activeTab === 'diagnosticos' ? (
            <DiagnosticsPanel diagnostics={diagnostics} />
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
            style={{ width: '100%', maxWidth: '360px' }}
          >
            Baixar Excel
          </Button>
        </div>
      </Card>

      <style>{resultCSS}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS — Swiss Ledger Result Screen
// ═══════════════════════════════════════════════════════════════════════════

const resultCSS = `
  /* ═══════════════════════════════════════════════════════════════════════
     CONTAINER
     ═══════════════════════════════════════════════════════════════════════ */
  .result-screen {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     HEADER
     ═══════════════════════════════════════════════════════════════════════ */
  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    margin-bottom: 32px;
    flex-wrap: wrap;
  }

  .result-header-left {
    flex: 1;
    min-width: 280px;
  }

  .result-title {
    font-family: var(--cc-font-body);
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--cc-text);
    letter-spacing: -0.02em;
    line-height: 1.2;
    margin: 0 0 6px 0;
  }

  .result-subtitle {
    font-family: var(--cc-font-body);
    font-size: 1rem;
    color: var(--cc-text-tertiary);
    margin: 0;
  }

  .result-competencia {
    color: var(--cc-text-secondary);
  }

  .result-header-actions {
    display: flex;
    gap: 12px;
    flex-shrink: 0;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     METRICS — Números com separadores verticais (compacto)
     ═══════════════════════════════════════════════════════════════════════ */
  .result-metrics {
    display: flex;
    align-items: stretch;
    background: var(--cc-surface);
    border: 1px solid var(--cc-border);
    border-radius: 12px;
    margin-bottom: 24px;
    overflow: hidden;
  }

  .metric {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px 20px;
    gap: 6px;
  }

  .metric-value {
    font-family: var(--cc-font-body);
    font-size: 2.5rem;
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }

  .metric-label {
    font-family: var(--cc-font-body);
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--cc-text-muted);
  }

  .metric-divider {
    width: 1px;
    background: var(--cc-border);
    flex-shrink: 0;
  }

  /* Metric Colors — Light Mode */
  .metric-ok .metric-value { color: #059669; }
  .metric-error .metric-value { color: #DC2626; }
  .metric-warning .metric-value { color: #D97706; }
  .metric-diverge .metric-value { color: #DC2626; }

  /* Metric Colors — Dark Mode */
  html[data-theme="dark"] .metric-ok .metric-value { color: #34D399; }
  html[data-theme="dark"] .metric-error .metric-value { color: #F87171; }
  html[data-theme="dark"] .metric-warning .metric-value { color: #FBBF24; }
  html[data-theme="dark"] .metric-diverge .metric-value { color: #F87171; }

  /* ═══════════════════════════════════════════════════════════════════════
     TOOLBAR — Search + Match Rate
     ═══════════════════════════════════════════════════════════════════════ */
  .result-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .result-match-rate {
    display: flex;
    align-items: baseline;
    gap: 12px;
    padding: 12px 20px;
    background: var(--cc-primary-light);
    border-radius: 12px;
  }

  .match-label {
    font-family: var(--cc-font-body);
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--cc-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .match-value {
    font-family: var(--cc-font-mono);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--cc-primary);
    letter-spacing: -0.02em;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     CONTENT — Tabela
     ═══════════════════════════════════════════════════════════════════════ */
  .result-content {
    margin-bottom: 24px;
    max-height: 520px;
    overflow-y: auto;
    border-radius: 12px;
  }

  .result-table-desktop {
    display: block;
  }

  .result-table-mobile {
    display: none;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     CTA — Botão inferior
     ═══════════════════════════════════════════════════════════════════════ */
  .result-cta {
    display: flex;
    justify-content: center;
    padding-top: 24px;
    border-top: 1px solid var(--cc-border);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     RESPONSIVE — Tablet
     ═══════════════════════════════════════════════════════════════════════ */
  @media (max-width: 900px) {
    .result-metrics {
      flex-wrap: wrap;
    }

    .metric {
      flex: 1 1 45%;
      min-width: 140px;
    }

    .metric-divider {
      display: none;
    }

    .metric:nth-child(1),
    .metric:nth-child(3) {
      border-right: 1px solid var(--cc-border);
    }

    .metric:nth-child(1),
    .metric:nth-child(2) {
      border-bottom: 1px solid var(--cc-border);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     RESPONSIVE — Mobile
     ═══════════════════════════════════════════════════════════════════════ */
  @media (max-width: 640px) {
    .result-header {
      flex-direction: column;
      gap: 16px;
    }

    .result-header-actions {
      width: 100%;
      flex-direction: column;
      gap: 10px;
    }

    .result-header-actions button {
      width: 100%;
    }

    .result-title {
      font-size: 1.5rem;
    }

    .result-subtitle {
      font-size: 0.875rem;
    }

    .result-metrics {
      border-radius: 12px;
      margin-bottom: 24px;
    }

    .metric {
      flex: 1 1 50%;
      padding: 20px 16px;
    }

    .metric-value {
      font-size: 2rem;
    }

    .metric-label {
      font-size: 0.625rem;
    }

    .result-toolbar {
      flex-direction: column;
      gap: 16px;
    }

    .result-match-rate {
      width: 100%;
      justify-content: space-between;
    }

    .result-table-desktop {
      display: none;
    }

    .result-table-mobile {
      display: block;
    }

    .result-content {
      max-height: none;
    }
  }
`
