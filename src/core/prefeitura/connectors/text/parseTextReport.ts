import type { NormalizedRow, DiagnosticsItem } from '../../../domain/types'
import { parseBRL } from '../../parseBRL'

/**
 * Resultado da extração de texto
 */
export interface TextReportResult {
  rows: NormalizedRow[]
  diagnostics: DiagnosticsItem[]
  competencia?: string
  eventosDetectados: number
}

/**
 * Regex para matrícula: 1-6 dígitos, hífen, 1-3 dígitos
 */
const MATRICULA_REGEX = /^(\d{1,6})-(\d{1,3})\b/

/**
 * Regex para valores monetários BR: 1.234,56 ou 400,49
 */
const VALOR_BR_REGEX = /\b(\d{1,3}(?:\.\d{3})*,\d{2})\b/g

/**
 * Regex para evento: "Evento: 002" ou "Evento: 2"
 */
const EVENTO_REGEX = /Evento:\s*(\d{1,4})/i

/**
 * Regex para competência: MM/AAAA ou "Mês/Ano: 01/2026"
 */
const COMPETENCIA_REGEX_SLASH = /\b(\d{2})\/(\d{4})\b/
const COMPETENCIA_REGEX_COMPACT = /\b(0[1-9]|1[0-2])(\d{4})\b/

/**
 * Engine comum de extração de texto para PDF/DOCX
 * Entrada: texto bruto
 * Saída: rows normalizadas + diagnósticos
 */
export function parseTextReport(text: string): TextReportResult {
  const diagnostics: DiagnosticsItem[] = []
  const rows: NormalizedRow[] = []

  const lines = text.split(/\r?\n/)
  let competenciaFound: string | undefined
  let eventoAtual: string | undefined
  let eventosDetectados = 0

  let dataLinesDetected = 0
  let extractedRows = 0
  let discardedNoMatricula = 0
  let discardedNoValue = 0

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue

    // Detectar competência (primeira ocorrência)
    if (!competenciaFound) {
      const matchSlash = trimmedLine.match(COMPETENCIA_REGEX_SLASH)
      if (matchSlash) {
        competenciaFound = `${matchSlash[1]}/${matchSlash[2]}`
      } else {
        const matchCompact = trimmedLine.match(COMPETENCIA_REGEX_COMPACT)
        if (matchCompact) {
          competenciaFound = `${matchCompact[1]}/${matchCompact[2]}`
        }
      }
    }

    // Detectar evento atual
    const eventoMatch = trimmedLine.match(EVENTO_REGEX)
    if (eventoMatch) {
      eventoAtual = eventoMatch[1].padStart(3, '0')
      eventosDetectados++
      continue
    }

    // Tentar extrair matrícula
    const matriculaMatch = trimmedLine.match(MATRICULA_REGEX)
    if (!matriculaMatch) {
      continue // Não é linha de dados
    }

    dataLinesDetected++
    const matricula = trimmedLine.match(MATRICULA_REGEX)![0]

    // Extrair todos os valores monetários da linha
    const valoresMatches = trimmedLine.match(VALOR_BR_REGEX) || []
    const valores = valoresMatches
      .map((v) => parseBRL(v))
      .filter((v): v is number => v !== null)

    // Escolher valor: último não-zero, ou último se todos são zero
    const valor = chooseValue(valores)

    if (valor === null) {
      discardedNoValue++
      continue
    }

    extractedRows++

    rows.push({
      source: 'prefeitura',
      matricula,
      valor,
      meta: {
        competencia: competenciaFound,
        evento: eventoAtual,
        confidence: valores.length === 1 ? 'high' : 'medium',
      },
      rawRef: {
        raw: trimmedLine.slice(0, 300),
      },
    })
  }

  // Diagnósticos
  if (!competenciaFound) {
    diagnostics.push({
      severity: 'warn',
      code: 'TEXT_COMPETENCIA_NOT_FOUND',
      message: 'Competência não detectada no texto',
    })
  }

  if (eventosDetectados === 0 && extractedRows > 0) {
    diagnostics.push({
      severity: 'warn',
      code: 'TEXT_EVENT_NOT_FOUND',
      message: 'Nenhum evento detectado no texto',
    })
  }

  if (extractedRows === 0) {
    diagnostics.push({
      severity: 'error',
      code: 'TEXT_ZERO_ROWS',
      message: 'Nenhuma linha com matrícula e valor foi extraída',
      details: { dataLinesDetected, discardedNoMatricula, discardedNoValue },
    })
  } else {
    diagnostics.push({
      severity: 'info',
      code: 'TEXT_PARSE_SUMMARY',
      message: `Extraídas ${extractedRows} linhas de ${dataLinesDetected} detectadas`,
      details: {
        totalLines: lines.length,
        dataLinesDetected,
        extractedRows,
        discardedNoValue,
        competenciaFound,
        eventosDetectados,
      },
    })
  }

  return {
    rows,
    diagnostics,
    competencia: competenciaFound,
    eventosDetectados,
  }
}

/**
 * Escolhe o valor correto quando há múltiplos
 * Prioriza: último valor não-zero, ou último valor se todos são zero
 */
function chooseValue(valores: number[]): number | null {
  if (valores.length === 0) return null
  if (valores.length === 1) return valores[0]

  // Filtrar zeros
  const nonZero = valores.filter((v) => v > 0)

  if (nonZero.length === 0) {
    // Todos são zero, retornar o último
    return valores[valores.length - 1]
  }

  // Retornar o último não-zero
  return nonZero[nonZero.length - 1]
}
