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
 * Pode estar no início da linha (após espaços) ou em qualquer posição
 */
const MATRICULA_REGEX_START = /^\s*(\d{1,6}-\d{1,3})\b/
const MATRICULA_REGEX_ANYWHERE = /\b(\d{1,6}-\d{1,3})\b/

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
 * Regex para CPF: XXX.XXX.XXX-XX
 */
const CPF_REGEX = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/

/**
 * Engine comum de extração de texto para PDF/DOCX
 * Entrada: texto bruto
 * Saída: rows normalizadas + diagnósticos
 */
export function parseTextReport(text: string): TextReportResult {
  // Primeiro, tentar extração padrão (matrícula + valor na mesma linha)
  const standardResult = parseStandardFormat(text)

  // Se extraiu linhas suficientes, usar resultado padrão
  if (standardResult.rows.length > 0) {
    return standardResult
  }

  // Senão, tentar extração de PDF com colunas separadas
  // (matrículas em uma parte, valores em outra)
  return parseColumnSeparatedFormat(text)
}

/**
 * Extração padrão: matrícula e valor na mesma linha
 */
function parseStandardFormat(text: string): TextReportResult {
  const diagnostics: DiagnosticsItem[] = []
  const rows: NormalizedRow[] = []

  const lines = text.split(/\r?\n/)
  let competenciaFound: string | undefined
  let eventoAtual: string | undefined
  let eventosDetectados = 0

  let dataLinesDetected = 0
  let extractedRows = 0
  let discardedNoValue = 0

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue

    // Detectar competência (primeira ocorrência)
    if (!competenciaFound) {
      competenciaFound = detectCompetencia(trimmedLine)
    }

    // Detectar evento atual
    const eventoMatch = trimmedLine.match(EVENTO_REGEX)
    if (eventoMatch) {
      eventoAtual = eventoMatch[1].padStart(3, '0')
      eventosDetectados++
      continue
    }

    // Tentar extrair matrícula (preferencialmente no início, senão em qualquer posição)
    let matriculaMatch = trimmedLine.match(MATRICULA_REGEX_START)
    if (!matriculaMatch) {
      matriculaMatch = trimmedLine.match(MATRICULA_REGEX_ANYWHERE)
    }
    if (!matriculaMatch) {
      continue // Não é linha de dados
    }

    dataLinesDetected++
    const matricula = matriculaMatch[1]

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
  addDiagnostics(diagnostics, competenciaFound, eventosDetectados, extractedRows, dataLinesDetected, discardedNoValue, lines.length)

  return {
    rows,
    diagnostics,
    competencia: competenciaFound,
    eventosDetectados,
  }
}

/**
 * Extração de PDF com colunas separadas
 * Em alguns PDFs, as matrículas estão em uma coluna e os valores em outra
 * O pdfjs extrai primeiro todas as matrículas, depois todos os valores
 */
function parseColumnSeparatedFormat(text: string): TextReportResult {
  const diagnostics: DiagnosticsItem[] = []
  const rows: NormalizedRow[] = []

  const lines = text.split(/\r?\n/)
  let competenciaFound: string | undefined
  let eventoAtual: string | undefined
  let eventosDetectados = 0

  // Coletar matrículas (linhas que começam com matrícula e não têm CPF)
  const matriculas: string[] = []
  // Coletar valores (linhas que têm CPF + valores monetários)
  const valoresData: { valor: number; raw: string; evento?: string }[] = []

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue

    // Detectar competência
    if (!competenciaFound) {
      competenciaFound = detectCompetencia(trimmedLine)
    }

    // Detectar evento
    const eventoMatch = trimmedLine.match(EVENTO_REGEX)
    if (eventoMatch) {
      eventoAtual = eventoMatch[1].padStart(3, '0')
      eventosDetectados++
      continue
    }

    // Linha com matrícula no início (sem CPF) = linha de matrícula
    const matriculaMatch = trimmedLine.match(MATRICULA_REGEX_START)
    const hasCPF = CPF_REGEX.test(trimmedLine)

    if (matriculaMatch && !hasCPF) {
      // Linha de matrícula pura (ex: "9-1 1/0")
      matriculas.push(matriculaMatch[1])
      continue
    }

    // Linha com CPF e valores = linha de dados
    if (hasCPF) {
      const valoresMatches = trimmedLine.match(VALOR_BR_REGEX) || []
      const valores = valoresMatches
        .map((v) => parseBRL(v))
        .filter((v): v is number => v !== null)

      const valor = chooseValue(valores)
      if (valor !== null) {
        valoresData.push({
          valor,
          raw: trimmedLine.slice(0, 300),
          evento: eventoAtual,
        })
      }
    }
  }

  // Correlacionar matrículas com valores por ordem
  const minLen = Math.min(matriculas.length, valoresData.length)
  for (let i = 0; i < minLen; i++) {
    rows.push({
      source: 'prefeitura',
      matricula: matriculas[i],
      valor: valoresData[i].valor,
      meta: {
        competencia: competenciaFound,
        evento: valoresData[i].evento,
        confidence: 'medium', // Confiança média porque é correlação por ordem
      },
      rawRef: {
        raw: valoresData[i].raw,
      },
    })
  }

  // Se não encontrou nada, ainda reportar como falha
  if (rows.length === 0) {
    diagnostics.push({
      severity: 'error',
      code: 'TEXT_ZERO_ROWS',
      message: 'Nenhuma linha com matrícula e valor foi extraída',
      details: {
        matriculasFound: matriculas.length,
        valoresFound: valoresData.length,
      },
    })
  } else {
    // Aviso se houver discrepância entre matrículas e valores
    if (matriculas.length !== valoresData.length) {
      diagnostics.push({
        severity: 'warn',
        code: 'TEXT_COLUMN_MISMATCH',
        message: `Número de matrículas (${matriculas.length}) diferente de valores (${valoresData.length})`,
        details: {
          matriculasFound: matriculas.length,
          valoresFound: valoresData.length,
          matched: rows.length,
        },
      })
    }

    diagnostics.push({
      severity: 'info',
      code: 'TEXT_PARSE_SUMMARY',
      message: `Extraídas ${rows.length} linhas (formato colunas separadas)`,
      details: {
        totalLines: lines.length,
        matriculasFound: matriculas.length,
        valoresFound: valoresData.length,
        extractedRows: rows.length,
        competenciaFound,
        eventosDetectados,
        extractionMethod: 'column_separated',
      },
    })
  }

  if (!competenciaFound) {
    diagnostics.push({
      severity: 'warn',
      code: 'TEXT_COMPETENCIA_NOT_FOUND',
      message: 'Competência não detectada no texto',
    })
  }

  if (eventosDetectados === 0 && rows.length > 0) {
    diagnostics.push({
      severity: 'warn',
      code: 'TEXT_EVENT_NOT_FOUND',
      message: 'Nenhum evento detectado no texto',
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
 * Detecta competência em uma linha
 */
function detectCompetencia(line: string): string | undefined {
  const matchSlash = line.match(COMPETENCIA_REGEX_SLASH)
  if (matchSlash) {
    return `${matchSlash[1]}/${matchSlash[2]}`
  }
  const matchCompact = line.match(COMPETENCIA_REGEX_COMPACT)
  if (matchCompact) {
    return `${matchCompact[1]}/${matchCompact[2]}`
  }
  return undefined
}

/**
 * Adiciona diagnósticos padrão
 */
function addDiagnostics(
  diagnostics: DiagnosticsItem[],
  competenciaFound: string | undefined,
  eventosDetectados: number,
  extractedRows: number,
  dataLinesDetected: number,
  discardedNoValue: number,
  totalLines: number
): void {
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
      details: { dataLinesDetected, discardedNoValue },
    })
  } else {
    diagnostics.push({
      severity: 'info',
      code: 'TEXT_PARSE_SUMMARY',
      message: `Extraídas ${extractedRows} linhas de ${dataLinesDetected} detectadas`,
      details: {
        totalLines,
        dataLinesDetected,
        extractedRows,
        discardedNoValue,
        competenciaFound,
        eventosDetectados,
      },
    })
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
