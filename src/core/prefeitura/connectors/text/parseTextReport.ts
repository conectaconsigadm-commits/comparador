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
const CPF_REGEX = /(\d{3}\.\d{3}\.\d{3}-\d{2})/

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

    // Tentar extrair matrícula no início da linha
    const matriculaMatch = trimmedLine.match(MATRICULA_REGEX_START)
    if (!matriculaMatch) {
      // Tentar em qualquer posição (fallback)
      const anywhereMatch = trimmedLine.match(MATRICULA_REGEX_ANYWHERE)
      if (!anywhereMatch) {
        continue // Não é linha de dados
      }
    }

    const matricula = matriculaMatch ? matriculaMatch[1] : trimmedLine.match(MATRICULA_REGEX_ANYWHERE)![1]
    dataLinesDetected++

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

    // Extrair nome e CPF se disponíveis
    const { nome, cpf } = extractNomeCpf(trimmedLine)

    extractedRows++

    rows.push({
      source: 'prefeitura',
      matricula,
      valor,
      meta: {
        competencia: competenciaFound,
        evento: eventoAtual,
        confidence: valores.length === 1 ? 'high' : 'medium',
        nome,
        cpf,
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
 * 
 * Estratégia: processar por "blocos de página"
 * Cada bloco começa após "Matrícula" ou "Evento:" e alterna entre matrículas e dados
 */
function parseColumnSeparatedFormat(text: string): TextReportResult {
  const diagnostics: DiagnosticsItem[] = []
  const rows: NormalizedRow[] = []

  const lines = text.split(/\r?\n/)
  let competenciaFound: string | undefined
  let eventoAtual: string | undefined
  let eventosDetectados = 0

  // Coletar todas as matrículas e todos os dados com valores
  const allMatriculas: string[] = []
  const allDadosComValor: { nome?: string; cpf?: string; valor: number; evento?: string; raw: string }[] = []

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

    // Ignorar linhas de cabeçalho
    if (isHeaderLine(trimmedLine)) {
      continue
    }

    // Verificar se é linha de matrícula pura (matrícula no início, sem CPF, sem nome longo)
    const matriculaMatch = trimmedLine.match(MATRICULA_REGEX_START)
    const cpfMatch = trimmedLine.match(CPF_REGEX)

    if (matriculaMatch && !cpfMatch) {
      // Linha de matrícula pura se:
      // - Começa com matrícula
      // - Não tem CPF
      // - É curta (menos de 50 caracteres) ou só tem números após a matrícula
      const resto = trimmedLine.slice(matriculaMatch[0].length).trim()
      const isShortOrNumeric = trimmedLine.length < 50 || /^[\d\/\s\.]+$/.test(resto)
      
      if (isShortOrNumeric) {
        allMatriculas.push(matriculaMatch[1])
        continue
      }
    }

    // Linha com CPF = linha de dados
    if (cpfMatch) {
      const valoresMatches = trimmedLine.match(VALOR_BR_REGEX) || []
      const valores = valoresMatches
        .map((v) => parseBRL(v))
        .filter((v): v is number => v !== null)

      const valor = chooseValue(valores)
      if (valor !== null) {
        const { nome, cpf } = extractNomeCpf(trimmedLine)
        allDadosComValor.push({
          nome,
          cpf,
          valor,
          evento: eventoAtual,
          raw: trimmedLine.slice(0, 300),
        })
      }
    }
  }

  // Correlacionar matrículas com dados por ordem
  const minLen = Math.min(allMatriculas.length, allDadosComValor.length)
  
  for (let i = 0; i < minLen; i++) {
    const dado = allDadosComValor[i]
    rows.push({
      source: 'prefeitura',
      matricula: allMatriculas[i],
      valor: dado.valor,
      meta: {
        competencia: competenciaFound,
        evento: dado.evento,
        confidence: 'medium',
        nome: dado.nome,
        cpf: dado.cpf,
      },
      rawRef: {
        raw: dado.raw,
      },
    })
  }

  // Diagnósticos
  if (rows.length === 0) {
    diagnostics.push({
      severity: 'error',
      code: 'TEXT_ZERO_ROWS',
      message: 'Nenhuma linha com matrícula e valor foi extraída',
      details: {
        matriculasFound: allMatriculas.length,
        dadosComValorFound: allDadosComValor.length,
      },
    })
  } else {
    if (allMatriculas.length !== allDadosComValor.length) {
      diagnostics.push({
        severity: 'warn',
        code: 'TEXT_COLUMN_MISMATCH',
        message: `Número de matrículas (${allMatriculas.length}) diferente de valores (${allDadosComValor.length})`,
        details: {
          matriculasFound: allMatriculas.length,
          dadosComValorFound: allDadosComValor.length,
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
        matriculasFound: allMatriculas.length,
        dadosComValorFound: allDadosComValor.length,
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
 * Verifica se é uma linha de cabeçalho (não é dado)
 */
function isHeaderLine(line: string): boolean {
  const headerPatterns = [
    /^Matrícula$/i,
    /^Nome do Trabalhador/i,
    /^Relação de Trabalhadores/i,
    /^PREFEITURA MUNICIPAL/i,
    /^RUA\s+\w+/i,
    /^CNPJ:/i,
    /^Fiorilli/i,
    /^Mensal/i,
    /^Folha$/i,
    /^Página\s+\d+/i,
    /^--\s*\d+\s+of\s+\d+\s*--$/i, // Marcador de página do PDF
    /^Total:/i,
    /^Referência/i,
    /^Qtde\./i,
    /^Valor$/i,
  ]
  
  return headerPatterns.some(pattern => pattern.test(line))
}

/**
 * Extrai nome e CPF de uma linha
 */
function extractNomeCpf(line: string): { nome?: string; cpf?: string } {
  const cpfMatch = line.match(CPF_REGEX)
  const cpf = cpfMatch ? cpfMatch[1] : undefined

  // Nome: texto antes do CPF (se existir)
  let nome: string | undefined
  if (cpfMatch && cpfMatch.index !== undefined) {
    const beforeCpf = line.slice(0, cpfMatch.index).trim()
    // Remover matrícula do início se existir
    const withoutMatricula = beforeCpf.replace(/^\d{1,6}-\d{1,3}\s*/, '').trim()
    if (withoutMatricula.length > 2) {
      nome = withoutMatricula
    }
  }

  return { nome, cpf }
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
