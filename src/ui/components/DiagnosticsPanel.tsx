import { useState, useMemo, useCallback } from 'react'
import { Badge } from './Badge'
import { CopyButton } from './CopyButton'
import { CodePill } from './CodePill'
import { JsonViewerModal } from './JsonViewerModal'
import {
  formatDiagnosticForClipboard,
  severityOrder,
  type SeverityFilter,
  type GroupedDiagnostic,
} from '../utils/groupDiagnostics'
import { formatDiagnosticForUi, type FormattedDiagnostic } from '../diagnostics/format'
import { getDiagnosticCopyWithFallback } from '../diagnostics/catalog'
import type { DiagnosticsItem, DiagnosticSeverity } from '../../core/domain/types'

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

interface DiagnosticsPanelProps {
  diagnostics: DiagnosticsItem[]
  defaultFilter?: SeverityFilter
  /** Modo de visualização inicial (default: agrupado) */
  defaultView?: 'grouped' | 'list'
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────────────────────

export function DiagnosticsPanel({
  diagnostics,
  defaultFilter = 'all',
  defaultView = 'grouped',
}: DiagnosticsPanelProps) {
  // Estado
  const [filter, setFilter] = useState<SeverityFilter>(defaultFilter)
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>(defaultView)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [modalData, setModalData] = useState<{ diag: DiagnosticsItem; formatted: FormattedDiagnostic } | null>(null)

  // Contadores por severidade
  const counts = useMemo(() => {
    const result = { all: diagnostics.length, error: 0, warn: 0, info: 0 }
    for (const d of diagnostics) {
      if (d.severity === 'error') result.error++
      else if (d.severity === 'warn') result.warn++
      else if (d.severity === 'info') result.info++
    }
    return result
  }, [diagnostics])

  // Diagnósticos filtrados por severidade
  const filtered = useMemo(() => {
    if (filter === 'all') return diagnostics
    return diagnostics.filter(d => d.severity === filter)
  }, [diagnostics, filter])

  // Diagnósticos agrupados (por code + severity)
  const grouped = useMemo(() => {
    const groups = new Map<string, { group: GroupedDiagnostic; items: DiagnosticsItem[] }>()
    
    for (const d of filtered) {
      const key = `${d.severity}:${d.code}`
      if (groups.has(key)) {
        const existing = groups.get(key)!
        existing.group.count++
        existing.items.push(d)
      } else {
        groups.set(key, {
          group: {
            code: d.code,
            severity: d.severity,
            message: d.message,
            count: 1,
          },
          items: [d],
        })
      }
    }

    // Ordenar: error > warn > info, depois por count desc
    return Array.from(groups.values()).sort((a, b) => {
      const sevDiff = severityOrder(a.group.severity) - severityOrder(b.group.severity)
      if (sevDiff !== 0) return sevDiff
      return b.group.count - a.group.count
    })
  }, [filtered])

  // Handlers
  const handleFilterChange = useCallback((newFilter: SeverityFilter) => {
    setFilter(newFilter)
    setExpandedGroups(new Set())
  }, [])

  const handleToggleGroup = useCallback((key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  const handleViewDetails = useCallback((diag: DiagnosticsItem) => {
    setModalData({ diag, formatted: formatDiagnosticForUi(diag) })
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalData(null)
  }, [])

  // Estado vazio
  if (diagnostics.length === 0) {
    return (
      <div className="diag-panel">
        <div className="diag-empty">
          <EmptyIcon />
          <p className="diag-empty-title">Nenhum diagnóstico</p>
          <p className="diag-empty-text">
            A extração foi realizada sem problemas detectados.
          </p>
        </div>
        <style>{diagnosticsPanelCSS}</style>
      </div>
    )
  }

  return (
    <div className="diag-panel">
      {/* Toolbar */}
      <div className="diag-toolbar">
        {/* Filtros */}
        <div className="diag-filters">
          <FilterChip active={filter === 'all'} onClick={() => handleFilterChange('all')} count={counts.all}>
            Todos
          </FilterChip>
          <FilterChip active={filter === 'error'} onClick={() => handleFilterChange('error')} count={counts.error} severity="error">
            Erros
          </FilterChip>
          <FilterChip active={filter === 'warn'} onClick={() => handleFilterChange('warn')} count={counts.warn} severity="warn">
            Avisos
          </FilterChip>
          <FilterChip active={filter === 'info'} onClick={() => handleFilterChange('info')} count={counts.info} severity="info">
            Info
          </FilterChip>
        </div>

        {/* Toggle de visualização */}
        <div className="diag-view-toggle">
          <button
            className={`diag-view-btn ${viewMode === 'grouped' ? 'active' : ''}`}
            onClick={() => setViewMode('grouped')}
            title="Visualização agrupada"
          >
            <GroupIcon />
          </button>
          <button
            className={`diag-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Visualização em lista"
          >
            <ListIcon />
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      {filtered.length === 0 ? (
        <div className="diag-empty">
          <FilterEmptyIcon />
          <p className="diag-empty-title">Sem diagnósticos nesse filtro</p>
          <p className="diag-empty-text">
            Tente outro filtro para ver os diagnósticos.
          </p>
        </div>
      ) : viewMode === 'grouped' ? (
        /* VISUALIZAÇÃO AGRUPADA */
        <div className="diag-grouped">
          {grouped.map(({ group, items }) => {
            const key = `${group.severity}:${group.code}`
            const isExpanded = expandedGroups.has(key)
            const copy = getDiagnosticCopyWithFallback(group.code)
            const visibleItems = isExpanded ? items : items.slice(0, 3)

            return (
              <div key={key} className={`diag-group diag-group-${group.severity}`}>
                {/* Header do grupo */}
                <div className="diag-group-header" onClick={() => handleToggleGroup(key)}>
                  <div className="diag-group-left">
                    <SeverityBadge severity={group.severity} />
                    <div className="diag-group-content">
                      <span className="diag-group-title">{copy.title}</span>
                      <span className="diag-group-message">{copy.message}</span>
                    </div>
                  </div>
                  <div className="diag-group-right">
                    <span className="diag-group-count">{group.count}×</span>
                    <CodePill code={group.code} showLabel={false} />
                    <ChevronIcon expanded={isExpanded} />
                  </div>
                </div>

                {/* Exemplos (colapsável) */}
                {isExpanded && (
                  <div className="diag-group-items">
                    {visibleItems.map((item, idx) => (
                      <div key={idx} className="diag-group-item">
                        <span className="diag-item-line">
                          {item.details?.lineNo ? `Linha ${item.details.lineNo}` : `#${idx + 1}`}
                        </span>
                        <span className="diag-item-text">{item.message}</span>
                        <button className="diag-item-btn" onClick={() => handleViewDetails(item)}>
                          Ver
                        </button>
                      </div>
                    ))}
                    {items.length > 3 && !isExpanded && (
                      <div className="diag-group-more">
                        +{items.length - 3} mais
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* VISUALIZAÇÃO EM LISTA */
        <div className="diag-list">
          {filtered.slice(0, 50).map((diag, idx) => {
            const copy = getDiagnosticCopyWithFallback(diag.code)
            return (
              <div key={idx} className={`diag-item diag-item-${diag.severity}`}>
                <div className="diag-item-header">
                  <SeverityBadge severity={diag.severity} />
                  <CodePill code={diag.code} showLabel={false} />
                </div>
                <div className="diag-item-content">
                  <span className="diag-item-title">{copy.title}</span>
                  <span className="diag-item-message">{copy.message}</span>
                </div>
                <div className="diag-item-actions">
                  <CopyButton text={formatDiagnosticForClipboard(diag)} label="Copiar" size="sm" />
                  <button className="diag-view-detail-btn" onClick={() => handleViewDetails(diag)}>
                    Ver
                  </button>
                </div>
              </div>
            )
          })}
          {filtered.length > 50 && (
            <div className="diag-more-info">
              Exibindo 50 de {filtered.length} diagnósticos
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="diag-info">
        {viewMode === 'grouped' 
          ? `${grouped.length} tipos de diagnósticos (${filtered.length} total)`
          : `${Math.min(filtered.length, 50)} de ${filtered.length} diagnósticos`
        }
      </div>

      {/* Modal */}
      {modalData && (
        <JsonViewerModal
          open={true}
          onClose={handleCloseModal}
          title={modalData.formatted.title}
          data={modalData.diag}
          renderHeader={
            <div className="diag-modal-header">
              <div className="diag-modal-meta">
                <SeverityBadge severity={modalData.diag.severity} />
                <CodePill code={modalData.diag.code} />
              </div>
              <p className="diag-modal-message">{modalData.formatted.message}</p>
              {modalData.formatted.action && (
                <div className="diag-modal-action">
                  <strong>O que fazer:</strong> {modalData.formatted.action}
                </div>
              )}
            </div>
          }
        />
      )}

      <style>{diagnosticsPanelCSS}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTES
// ─────────────────────────────────────────────────────────────

interface FilterChipProps {
  active: boolean
  onClick: () => void
  count: number
  severity?: DiagnosticSeverity
  children: React.ReactNode
}

function FilterChip({ active, onClick, count, severity, children }: FilterChipProps) {
  const severityClass = severity ? `filter-chip-${severity}` : ''
  return (
    <button
      className={`filter-chip ${active ? 'filter-chip-active' : ''} ${severityClass}`}
      onClick={onClick}
    >
      {children}
      <span className="filter-chip-count">{count}</span>
    </button>
  )
}

function SeverityBadge({ severity }: { severity: DiagnosticSeverity }) {
  const config: Record<DiagnosticSeverity, { label: string; variant: 'success' | 'warning' | 'error' }> = {
    info: { label: 'Info', variant: 'success' },
    warn: { label: 'Aviso', variant: 'warning' },
    error: { label: 'Erro', variant: 'error' },
  }
  const { label, variant } = config[severity]
  return <Badge variant={variant}>{label}</Badge>
}

// ─────────────────────────────────────────────────────────────
// ÍCONES
// ─────────────────────────────────────────────────────────────

function EmptyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
}

function FilterEmptyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

function GroupIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>
  )
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────

const diagnosticsPanelCSS = `
  .diag-panel {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* Toolbar */
  .diag-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
  }

  .diag-filters {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
  }

  .filter-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 11px;
    border: 1px solid var(--cc-border);
    border-radius: 18px;
    background: var(--cc-surface);
    color: var(--cc-text-secondary);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .filter-chip:hover {
    background: var(--cc-surface-hover);
    border-color: var(--cc-border-hover);
  }

  .filter-chip-active {
    background: var(--cc-primary);
    border-color: var(--cc-primary);
    color: white;
  }

  .filter-chip-active .filter-chip-count {
    background: rgba(255, 255, 255, 0.25);
    color: white;
  }

  .filter-chip-count {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 5px;
    border-radius: 8px;
    background: var(--cc-surface-2);
    color: var(--cc-text-muted);
  }

  .filter-chip-error.filter-chip-active { background: var(--cc-error); border-color: var(--cc-error); }
  .filter-chip-warn.filter-chip-active { background: var(--cc-warning); border-color: var(--cc-warning); }
  .filter-chip-info.filter-chip-active { background: var(--cc-success); border-color: var(--cc-success); }

  /* View toggle */
  .diag-view-toggle {
    display: flex;
    gap: 3px;
    padding: 3px;
    background: var(--cc-surface-2);
    border: 1px solid var(--cc-border);
    border-radius: 8px;
  }

  .diag-view-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 26px;
    border: none;
    border-radius: 5px;
    background: transparent;
    color: var(--cc-text-muted);
    cursor: pointer;
    transition: all 0.15s;
  }

  .diag-view-btn:hover {
    color: var(--cc-text);
    background: var(--cc-surface-hover);
  }

  .diag-view-btn.active {
    background: var(--cc-primary);
    color: white;
  }

  /* Grouped view */
  .diag-grouped {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 360px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .diag-group {
    background: var(--cc-surface);
    border: 1px solid var(--cc-border);
    border-radius: 10px;
    overflow: hidden;
    transition: all 0.15s;
  }

  .diag-group:hover {
    border-color: var(--cc-border-hover);
  }

  .diag-group-error { border-left: 3px solid var(--cc-error); }
  .diag-group-warn { border-left: 3px solid var(--cc-warning); }
  .diag-group-info { border-left: 3px solid var(--cc-success); }

  .diag-group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 12px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .diag-group-header:hover {
    background: var(--cc-surface-hover);
  }

  .diag-group-left {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  .diag-group-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .diag-group-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--cc-text);
    line-height: 1.3;
  }

  .diag-group-message {
    font-size: 11px;
    color: var(--cc-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.4;
  }

  .diag-group-right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .diag-group-count {
    font-size: 11px;
    font-weight: 600;
    color: var(--cc-text-muted);
    background: var(--cc-surface-2);
    padding: 2px 7px;
    border-radius: 8px;
  }

  .diag-group-items {
    border-top: 1px solid var(--cc-border);
    padding: 6px 12px;
    background: var(--cc-surface-2);
  }

  .diag-group-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid var(--cc-border-hairline);
  }

  .diag-group-item:last-child {
    border-bottom: none;
  }

  .diag-item-line {
    font-size: 10px;
    font-weight: 500;
    color: var(--cc-text-muted);
    background: var(--cc-surface);
    padding: 2px 5px;
    border-radius: 4px;
    white-space: nowrap;
  }

  .diag-item-text {
    flex: 1;
    font-size: 11px;
    color: var(--cc-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.4;
  }

  .diag-item-btn {
    font-size: 10px;
    font-weight: 500;
    color: var(--cc-primary);
    background: none;
    border: none;
    cursor: pointer;
    padding: 3px 6px;
    border-radius: 4px;
    transition: background 0.15s;
  }

  .diag-item-btn:hover {
    background: var(--cc-primary-light);
  }

  /* List view */
  .diag-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 360px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .diag-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    background: var(--cc-surface);
    border: 1px solid var(--cc-border);
    border-radius: 10px;
    transition: all 0.15s;
  }

  .diag-item:hover {
    border-color: var(--cc-border-hover);
  }

  .diag-item-error { border-left: 3px solid var(--cc-error); }
  .diag-item-warn { border-left: 3px solid var(--cc-warning); }
  .diag-item-info { border-left: 3px solid var(--cc-success); }

  .diag-item-header {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .diag-item-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .diag-item-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--cc-text);
  }

  .diag-item-message {
    font-size: 11px;
    color: var(--cc-text-secondary);
    line-height: 1.4;
  }

  .diag-item-actions {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .diag-view-detail-btn {
    font-size: 10px;
    font-weight: 500;
    color: var(--cc-text-secondary);
    background: var(--cc-surface-2);
    border: 1px solid var(--cc-border);
    border-radius: 5px;
    padding: 3px 8px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .diag-view-detail-btn:hover {
    background: var(--cc-surface-hover);
    color: var(--cc-text);
  }

  /* Info */
  .diag-info, .diag-more-info {
    text-align: center;
    font-size: 11px;
    color: var(--cc-text-muted);
    padding: 8px 0;
  }

  /* Empty */
  .diag-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    color: var(--cc-text-muted);
  }

  .diag-empty svg {
    margin-bottom: 14px;
    color: var(--cc-success);
    opacity: 0.8;
  }

  .diag-empty-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--cc-text);
    margin: 0 0 4px;
  }

  .diag-empty-text {
    font-size: 12px;
    color: var(--cc-text-secondary);
    margin: 0;
    max-width: 260px;
    line-height: 1.5;
  }

  /* Modal header */
  .diag-modal-header {
    margin-bottom: 14px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--cc-border);
  }

  .diag-modal-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }

  .diag-modal-message {
    font-size: 13px;
    color: var(--cc-text-secondary);
    margin: 0 0 10px;
    line-height: 1.5;
  }

  .diag-modal-action {
    font-size: 12px;
    color: var(--cc-primary);
    padding: 10px 12px;
    background: var(--cc-primary-light);
    border-radius: 8px;
    line-height: 1.4;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .diag-toolbar {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }

    .diag-view-toggle {
      align-self: flex-end;
    }

    .diag-filters {
      width: 100%;
    }

    .filter-chip {
      flex: 1;
      justify-content: center;
      padding: 7px 5px;
      font-size: 11px;
    }

    .diag-group-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }

    .diag-group-right {
      width: 100%;
      justify-content: flex-start;
    }
    
    .diag-grouped,
    .diag-list {
      max-height: none;
    }
  }
`
