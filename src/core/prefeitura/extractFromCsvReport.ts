import type { NormalizedRow, DiagnosticsItem } from '../domain/types'
import { parseBRL } from './parseBRL'
import { detectDelimiter, type CsvDelimiter } from './csv/detectDelimiter'

/**
 * Resultado da extração do relatório CSV da prefeitura
 */
export interface CsvReportExtractionResult {
  rows: NormalizedRow[]
  diagnostics: DiagnosticsItem[]
  competencia?: string
}

/**
 * Regex para matrícula: 1-6 dígitos, hífen, 1-3 dígitos
 * Preferimos no início da linha, mas também procuramos em qualquer lugar
 */
const MATRICULA_REGEX_START = /^\s*(\d{1,6}-\d{1,3})\s*[,;\t|]/
const MATRICULA_REGEX_ANYWHERE = /\b(\d{1,6}-\d{1,3})\b/

/**
 * Regex para valores monetários BR:
 * a) entre aspas: "1.234,56"
 * b) sem aspas: 1.234,56 ou 1234,56
 * c) com prefixo R$: R$ 1.234,56
 */
const VALOR_ENTRE_ASPAS_REGEX = /"([\d.,]+)"/g
const VALOR_BR_REGEX = /\b(\d{1,3}(?:\.\d{3})*,\d{2})\b/g
const VALOR_RS_REGEX = /R\$\s*([\d.,]+)/gi

/**
 * Regex para competência: MM/AAAA ou MMAAAA
 */
const COMPETENCIA_REGEX_FULL = /\b(\d{2})\/(\d{4})\b/
const COMPETENCIA_REGEX_COMPACT = /\b(0[1-9]|1[0-2])(\d{4})\b/

/**
 * Regex para evento: "Evento: 002" ou "Evento: 2"
 */
const EVENTO_REGEX = /Evento:\s*(\d{1,3})/i

/**
 * Extrai todos os valores monetários BR de uma linha
 * Combina os 3 padrões: entre aspas, sem aspas, com R$
 */
function extractAllValores(line: string): number[] {
  const valores: number[] = []
  const seen = new Set<string>()

  // 1. Valores entre aspas
  for (const match of line.matchAll(VALOR_ENTRE_ASPAS_REGEX)) {
    const raw = match[1]
    if (!seen.has(raw)) {
      seen.add(raw)
      const valor = parseBRL(raw)
      if (valor !== null) {
        valores.push(valor)
      }
    }
  }

  // 2. Valores com prefixo R$
  for (const match of line.matchAll(VALOR_RS_REGEX)) {
    const raw = match[1]
    if (!seen.has(raw)) {
      seen.add(raw)
      const valor = parseBRL(raw)
      if (valor !== null) {
        valores.push(valor)
      }
    }
  }

  // 3. Valores BR sem aspas (cuidado para não duplicar)
  for (const match of line.matchAll(VALOR_BR_REGEX)) {
    const raw = match[1]
    if (!seen.has(raw)) {
      seen.add(raw)
      const valor = parseBRL(raw)
      if (valor !== null) {
        valores.push(valor)
      }
    }
  }

  return valores
}

/**
 * Escolhe o valor correto quando há múltiplos
 * Regra: último valor não-zero; se todos são zero, retorna 0
 */
function chooseValue(valores: number[]): number | null {
  if (valores.length === 0) return null
  if (valores.length === 1) return valores[0]

  // Filtrar zeros
  const nonZero = valores.filter((v) => v > 0)

  if (nonZero.length === 0) {
    // Todos são zero, retornar 0 (não null, pois zero é valor válido)
    return 0
  }

  // Retornar o último não-zero
  return nonZero[nonZero.length - 1]
}

/**
 * Tenta extrair matrícula de uma linha
 * Primeiro tenta no início, depois em qualquer lugar
 */
function extractMatricula(line: string, delimiter: CsvDelimiter): string | null {
  // Tentar no início da linha (formato padrão CSV)
  const startMatch = line.match(MATRICULA_REGEX_START)
  if (startMatch) {
    return startMatch[1]
  }

  // Criar regex dinâmico para início com o delimitador detectado
  const dynamicStartRegex = new RegExp(`^\\s*(\\d{1,6}-\\d{1,3})\\s*[${escapeRegex(delimiter)}]`)
  const dynamicMatch = line.match(dynamicStartRegex)
  if (dynamicMatch) {
    return dynamicMatch[1]
  }

  // Fallback: procurar em qualquer lugar
  const anywhereMatch = line.match(MATRICULA_REGEX_ANYWHERE)
  if (anywhereMatch) {
    return anywhereMatch[1]
  }

  return null
}

/**
 * Escapa caracteres especiais de regex
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Extrai dados do relatório CSV "Relação de Trabalhadores por Evento"
 *
 * Formato esperado:
 * - Cabeçalho com competência (ex: "Mês/Ano: 01/2026")
 * - Seções por evento (ex: "Evento: 002 - CONSIGNADO BB")
 * - Linhas de dados começando com matrícula (ex: "85-1,NOME,...")
 * - Valores monetários no formato pt-BR
 *
 * Suporta delimitadores: , ; \t |
 *
 * @param text Conteúdo do arquivo CSV
 * @returns Linhas normalizadas + diagnósticos
 */
export function extractFromCsvReport(text: string): CsvReportExtractionResult {
  const rows: NormalizedRow[] = []
  const diagnostics: DiagnosticsItem[] = []

  // Dividir em linhas
  const lines = text.split(/\r?\n/)

  // Detectar delimitador
  const delimiterResult = detectDelimiter(lines)
  const delimiter = delimiterResult.delimiter

  // Diagnóstico de delimitador detectado
  diagnostics.push({
    severity: 'info',
    code: 'CSV_DELIMITER_DETECTED',
    message: `Delimitador detectado: "${delimiter === '\t' ? 'TAB' : delimiter}" (confiança: ${delimiterResult.confidence})`,
    details: {
      delimiter,
      avgCount: delimiterResult.avgCount,
      confidence: delimiterResult.confidence,
      counts: delimiterResult.counts,
    },
  })

  // Contadores para diagnóstico
  let totalLines = 0
  let dataLinesDetected = 0
  let extractedRows = 0
  let discardedNoValue = 0
  let discardedNoMatricula = 0
  const eventosVistos = new Set<string>()

  // Estado do parser
  let competenciaFound: string | undefined
  let eventoAtual: string | undefined

  for (const line of lines) {
    totalLines++
    const trimmedLine = line.trim()

    // Ignorar linhas vazias
    if (trimmedLine === '') {
      continue
    }

    // Detectar competência (apenas primeira ocorrência)
    if (!competenciaFound) {
      const matchFull = trimmedLine.match(COMPETENCIA_REGEX_FULL)
      if (matchFull) {
        competenciaFound = `${matchFull[1]}/${matchFull[2]}`
      } else {
        const matchCompact = trimmedLine.match(COMPETENCIA_REGEX_COMPACT)
        if (matchCompact) {
          competenciaFound = `${matchCompact[1]}/${matchCompact[2]}`
        }
      }
    }

    // Detectar mudança de evento
    const eventoMatch = trimmedLine.match(EVENTO_REGEX)
    if (eventoMatch) {
      const eventoNum = parseInt(eventoMatch[1], 10)
      eventoAtual = eventoNum.toString().padStart(3, '0')
      eventosVistos.add(eventoAtual)
      continue
    }

    // Tentar extrair matrícula
    const matricula = extractMatricula(trimmedLine, delimiter)

    if (!matricula) {
      // Não é linha de dados
      continue
    }

    // Validar matrícula mínima
    if (matricula.length < 3) {
      discardedNoMatricula++
      continue
    }

    dataLinesDetected++

    // Extrair todos os valores da linha
    const valores = extractAllValores(trimmedLine)

    if (valores.length === 0) {
      discardedNoValue++
      continue
    }

    // Escolher o valor correto
    const valor = chooseValue(valores)

    if (valor === null) {
      discardedNoValue++
      continue
    }

    // Criar NormalizedRow
    const row: NormalizedRow = {
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
    }

    rows.push(row)
    extractedRows++
  }

  // Diagnóstico de resumo
  diagnostics.push({
    severity: extractedRows > 0 ? 'info' : 'error',
    code: 'CSV_PARSE_SUMMARY',
    message: `Extração CSV: ${extractedRows} linhas extraídas de ${dataLinesDetected} detectadas`,
    details: {
      totalLines,
      dataLinesDetected,
      extractedRows,
      discardedNoValue,
      discardedNoMatricula,
      competenciaFound,
      eventosVistosCount: eventosVistos.size,
      eventosVistos: Array.from(eventosVistos),
      delimiter,
    },
  })

  // Se não extraiu nada, adicionar erro específico
  if (extractedRows === 0) {
    diagnostics.push({
      severity: 'error',
      code: 'CSV_NO_ROWS',
      message: 'Nenhuma linha de dados extraída do arquivo CSV',
      details: {
        totalLines,
        dataLinesDetected,
        discardedNoValue,
        discardedNoMatricula,
      },
    })
  }

  // Warning se não achou competência
  if (!competenciaFound && extractedRows > 0) {
    diagnostics.push({
      severity: 'warn',
      code: 'CSV_COMPETENCIA_NOT_FOUND',
      message: 'Competência não detectada no arquivo CSV',
    })
  }

  // Warning se não achou evento (mas tinha linhas de dados)
  if (eventosVistos.size === 0 && extractedRows > 0) {
    diagnostics.push({
      severity: 'warn',
      code: 'CSV_EVENT_NOT_FOUND',
      message: 'Nenhum evento detectado no arquivo CSV',
    })
  }

  return { rows, diagnostics, competencia: competenciaFound }
}
