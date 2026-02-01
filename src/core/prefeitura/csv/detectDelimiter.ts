/**
 * Detecta o delimitador de um arquivo CSV analisando as primeiras linhas
 *
 * Heurística:
 * - Conta ocorrências de cada delimitador candidato FORA de aspas duplas
 * - Escolhe o delimitador com maior contagem média por linha
 * - Fallback: vírgula (',')
 */

/** Delimitadores suportados */
export const SUPPORTED_DELIMITERS = [',', ';', '\t', '|'] as const
export type CsvDelimiter = (typeof SUPPORTED_DELIMITERS)[number]

/** Resultado da detecção */
export interface DelimiterDetectionResult {
  /** Delimitador detectado */
  delimiter: CsvDelimiter
  /** Contagem média por linha */
  avgCount: number
  /** Confiança na detecção (high se avgCount > 3, medium se > 1, low caso contrário) */
  confidence: 'high' | 'medium' | 'low'
  /** Contagens por delimitador para debug */
  counts: Record<CsvDelimiter, number>
}

/**
 * Conta ocorrências de um caractere fora de aspas duplas
 */
function countOutsideQuotes(line: string, char: string): number {
  let count = 0
  let insideQuotes = false

  for (let i = 0; i < line.length; i++) {
    const c = line[i]

    if (c === '"') {
      // Toggle estado de aspas (ignora aspas escapadas "")
      if (i + 1 < line.length && line[i + 1] === '"') {
        i++ // Pula aspas escapadas
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (!insideQuotes && c === char) {
      count++
    }
  }

  return count
}

/**
 * Detecta o delimitador mais provável do CSV
 *
 * @param lines Primeiras linhas do arquivo (recomendado: 30 linhas não vazias)
 * @returns Resultado da detecção com delimitador e confiança
 */
export function detectDelimiter(lines: string[]): DelimiterDetectionResult {
  // Filtrar linhas vazias e pegar no máximo 30
  const sampleLines = lines
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 30)

  if (sampleLines.length === 0) {
    return {
      delimiter: ',',
      avgCount: 0,
      confidence: 'low',
      counts: { ',': 0, ';': 0, '\t': 0, '|': 0 },
    }
  }

  // Contar ocorrências de cada delimitador
  const totalCounts: Record<CsvDelimiter, number> = {
    ',': 0,
    ';': 0,
    '\t': 0,
    '|': 0,
  }

  for (const line of sampleLines) {
    for (const delim of SUPPORTED_DELIMITERS) {
      totalCounts[delim] += countOutsideQuotes(line, delim)
    }
  }

  // Calcular média por linha
  const avgCounts: Record<CsvDelimiter, number> = {
    ',': totalCounts[','] / sampleLines.length,
    ';': totalCounts[';'] / sampleLines.length,
    '\t': totalCounts['\t'] / sampleLines.length,
    '|': totalCounts['|'] / sampleLines.length,
  }

  // Encontrar o delimitador com maior média
  let bestDelimiter: CsvDelimiter = ','
  let bestAvg = avgCounts[',']

  for (const delim of SUPPORTED_DELIMITERS) {
    if (avgCounts[delim] > bestAvg) {
      bestAvg = avgCounts[delim]
      bestDelimiter = delim
    }
  }

  // Determinar confiança
  let confidence: 'high' | 'medium' | 'low'
  if (bestAvg > 3) {
    confidence = 'high'
  } else if (bestAvg > 1) {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }

  return {
    delimiter: bestDelimiter,
    avgCount: bestAvg,
    confidence,
    counts: totalCounts,
  }
}

/**
 * Detecta delimitador a partir do texto completo do CSV
 * Conveniência que quebra o texto em linhas primeiro
 */
export function detectDelimiterFromText(text: string): DelimiterDetectionResult {
  const lines = text.split(/\r?\n/)
  return detectDelimiter(lines)
}
