import type { DiagnosticsItem, DiagnosticSeverity } from '../../core/domain/types'

/**
 * Diagnóstico agrupado para exibição
 */
export interface GroupedDiagnostic {
  code: string
  severity: DiagnosticSeverity
  message: string
  count: number
}

/**
 * Tipo para filtro de severidade
 */
export type SeverityFilter = 'all' | DiagnosticSeverity

/**
 * Ordena severidades: error > warn > info
 */
export function severityOrder(severity: DiagnosticSeverity): number {
  switch (severity) {
    case 'error':
      return 0
    case 'warn':
      return 1
    case 'info':
      return 2
    default:
      return 3
  }
}

/**
 * Agrupa diagnósticos por code + severity, conta ocorrências
 * e ordena: error > warn > info, depois por contagem desc
 *
 * @param diagnostics Lista de diagnósticos
 * @param limit Número máximo de grupos a retornar (default: 8)
 * @returns Lista de diagnósticos agrupados
 */
export function groupDiagnostics(
  diagnostics: DiagnosticsItem[],
  limit: number = 8
): GroupedDiagnostic[] {
  // Agrupar por code + severity
  const groups = new Map<string, GroupedDiagnostic>()

  for (const diag of diagnostics) {
    const key = `${diag.code}:${diag.severity}`

    if (groups.has(key)) {
      const existing = groups.get(key)!
      existing.count++
    } else {
      groups.set(key, {
        code: diag.code,
        severity: diag.severity,
        message: diag.message,
        count: 1,
      })
    }
  }

  // Converter para array e ordenar
  const sorted = Array.from(groups.values()).sort((a, b) => {
    // Primeiro por severidade
    const severityDiff = severityOrder(a.severity) - severityOrder(b.severity)
    if (severityDiff !== 0) return severityDiff

    // Depois por contagem (desc)
    return b.count - a.count
  })

  // Limitar
  return sorted.slice(0, limit)
}

/**
 * Retorna a severidade mais alta de uma lista de diagnósticos
 */
export function getTopSeverity(
  diagnostics: DiagnosticsItem[]
): DiagnosticSeverity | null {
  let hasError = false
  let hasWarn = false
  let hasInfo = false

  for (const diag of diagnostics) {
    if (diag.severity === 'error') hasError = true
    else if (diag.severity === 'warn') hasWarn = true
    else if (diag.severity === 'info') hasInfo = true
  }

  if (hasError) return 'error'
  if (hasWarn) return 'warn'
  if (hasInfo) return 'info'
  return null
}

/**
 * Verifica se há erros críticos nos diagnósticos
 */
export function hasCriticalErrors(diagnostics: DiagnosticsItem[]): boolean {
  const criticalCodes = [
    'prefeitura_extraction_failed',
    'prefeitura_unsupported_format',
    'PDF_SCAN_DETECTED',
    'PARSE_ERROR',
    'CSV_NO_ROWS',
    'TEXT_ZERO_ROWS',
  ]

  return diagnostics.some(
    (d) => d.severity === 'error' && criticalCodes.includes(d.code)
  )
}

/**
 * Filtra diagnósticos por severidade e/ou busca textual
 *
 * @param diagnostics Lista de diagnósticos
 * @param severity Filtro de severidade ('all' para todos)
 * @param query Texto para buscar em code, message e details
 * @returns Lista filtrada e ordenada (error > warn > info, depois por code)
 */
export function filterDiagnostics(
  diagnostics: DiagnosticsItem[],
  severity: SeverityFilter = 'all',
  query: string = ''
): DiagnosticsItem[] {
  let filtered = diagnostics

  // Filtrar por severidade
  if (severity !== 'all') {
    filtered = filtered.filter((d) => d.severity === severity)
  }

  // Filtrar por busca textual
  if (query.trim()) {
    const q = query.toLowerCase().trim()
    filtered = filtered.filter((d) => {
      // Buscar em code
      if (d.code.toLowerCase().includes(q)) return true

      // Buscar em message
      if (d.message.toLowerCase().includes(q)) return true

      // Buscar em details (stringificado)
      if (d.details) {
        const detailsStr = JSON.stringify(d.details).toLowerCase()
        if (detailsStr.includes(q)) return true
      }

      return false
    })
  }

  // Ordenar: error > warn > info, depois por code alfabético
  return filtered.sort((a, b) => {
    const severityDiff = severityOrder(a.severity) - severityOrder(b.severity)
    if (severityDiff !== 0) return severityDiff
    return a.code.localeCompare(b.code)
  })
}

/**
 * Formata um diagnóstico para cópia na clipboard
 *
 * @param diagnostic Diagnóstico a formatar
 * @returns String JSON formatada
 */
export function formatDiagnosticForClipboard(diagnostic: DiagnosticsItem): string {
  const obj = {
    severity: diagnostic.severity,
    code: diagnostic.code,
    message: diagnostic.message,
    ...(diagnostic.details && { details: diagnostic.details }),
  }
  return JSON.stringify(obj, null, 2)
}

/**
 * Trunca um texto para exibição
 *
 * @param text Texto a truncar
 * @param maxLength Tamanho máximo (default: 80)
 * @returns Texto truncado com "..." se necessário
 */
export function truncateText(text: string, maxLength: number = 80): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Formata details de um diagnóstico para exibição resumida
 *
 * @param details Objeto de detalhes
 * @param maxLength Tamanho máximo (default: 60)
 * @returns String resumida
 */
export function formatDetailsPreview(
  details: Record<string, unknown> | undefined,
  maxLength: number = 60
): string {
  if (!details) return '—'

  // Tentar mostrar campos mais relevantes
  const keys = Object.keys(details)
  if (keys.length === 0) return '—'

  // Se tiver poucos campos, mostrar todos resumidamente
  const parts: string[] = []
  for (const key of keys.slice(0, 3)) {
    const value = details[key]
    const valueStr =
      typeof value === 'string'
        ? value
        : typeof value === 'number'
          ? String(value)
          : JSON.stringify(value)
    parts.push(`${key}: ${truncateText(valueStr, 20)}`)
  }

  const result = parts.join(', ')
  if (keys.length > 3) {
    return truncateText(result + ', ...', maxLength)
  }
  return truncateText(result, maxLength)
}
