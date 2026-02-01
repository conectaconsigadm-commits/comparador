import type { DiagnosticsItem, DiagnosticSeverity } from '../../core/domain/types'
import { getDiagnosticCopyWithFallback } from './catalog'
import { formatDetailsPreview } from '../utils/groupDiagnostics'

/**
 * Diagnóstico formatado para exibição na UI
 */
export interface FormattedDiagnostic {
  /** Título humanizado */
  title: string
  /** Mensagem explicativa */
  message: string
  /** Ação sugerida (opcional) */
  action?: string
  /** Código técnico original */
  code: string
  /** Severidade */
  severity: DiagnosticSeverity
  /** Preview dos detalhes (truncado) */
  detailsPreview: string
  /** Detalhes completos (para modal) */
  details?: Record<string, unknown>
  /** Tem detalhes para mostrar */
  hasDetails: boolean
}

/**
 * Formata um diagnóstico para exibição na UI
 * Usa o catálogo de mensagens humanizadas com fallback
 */
export function formatDiagnosticForUi(diag: DiagnosticsItem): FormattedDiagnostic {
  const copy = getDiagnosticCopyWithFallback(diag.code)

  return {
    title: copy.title,
    message: copy.message,
    action: copy.action,
    code: diag.code,
    severity: diag.severity,
    detailsPreview: formatDetailsPreview(diag.details),
    details: diag.details,
    hasDetails: !!diag.details && Object.keys(diag.details).length > 0,
  }
}

/**
 * Formata uma lista de diagnósticos para UI
 */
export function formatDiagnosticsForUi(diagnostics: DiagnosticsItem[]): FormattedDiagnostic[] {
  return diagnostics.map(formatDiagnosticForUi)
}

/**
 * Retorna texto de status humanizado baseado no estado de extração
 */
export function getExtractionStatusText(
  extracao: 'completa' | 'parcial' | 'falhou'
): { title: string; message: string; action?: string } {
  switch (extracao) {
    case 'completa':
      return {
        title: 'Extração completa',
        message: 'Todos os dados foram lidos com sucesso.',
      }
    case 'parcial':
      return {
        title: 'Extração parcial',
        message: 'Alguns dados podem não ter sido extraídos corretamente.',
        action: 'Revise os diagnósticos antes de continuar.',
      }
    case 'falhou':
      return {
        title: 'Extração falhou',
        message: 'Não foi possível extrair dados do arquivo.',
        action: 'Troque o arquivo ou converta para CSV/XLSX.',
      }
  }
}
