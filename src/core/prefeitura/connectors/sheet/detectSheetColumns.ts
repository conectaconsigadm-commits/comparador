import { parseCellAsMatricula, parseCellAsMonetary } from './parseSheetValue'

/**
 * Resultado da detecção de colunas
 */
export interface ColumnDetectionResult {
  matriculaCol: number
  valorCol: number
  eventoCol?: number
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Detecta colunas de matrícula, valor e evento em uma matriz de dados
 * Heurística: coluna com maior contagem de células válidas
 */
export function detectSheetColumns(
  rows: (string | number | null)[][]
): ColumnDetectionResult | null {
  if (rows.length === 0) {
    return null
  }

  // Determinar número de colunas
  const maxCols = Math.max(...rows.map((r) => r.length))
  if (maxCols === 0) {
    return null
  }

  // Contar hits por coluna
  const matriculaHits: number[] = new Array(maxCols).fill(0)
  const valorHits: number[] = new Array(maxCols).fill(0)
  const eventoHits: number[] = new Array(maxCols).fill(0)

  for (const row of rows) {
    for (let col = 0; col < row.length; col++) {
      const cell = row[col]

      // Testar matrícula
      if (parseCellAsMatricula(cell) !== null) {
        matriculaHits[col]++
      }

      // Testar valor monetário
      const valor = parseCellAsMonetary(cell)
      if (valor !== null && valor >= 0) {
        valorHits[col]++
      }

      // Testar evento (valores curtos tipo 002, 015, 135)
      if (typeof cell === 'string' || typeof cell === 'number') {
        const str = String(cell).trim()
        if (/^\d{1,3}$/.test(str)) {
          eventoHits[col]++
        }
      }
    }
  }

  // Encontrar coluna com mais hits de matrícula
  const matriculaCol = indexOfMax(matriculaHits)
  const matriculaCount = matriculaHits[matriculaCol]

  if (matriculaCount === 0) {
    return null
  }

  // Encontrar coluna com mais hits de valor (excluindo a coluna de matrícula)
  valorHits[matriculaCol] = -1 // Excluir
  const valorCol = indexOfMax(valorHits)
  const valorCount = valorHits[valorCol]

  if (valorCount <= 0) {
    return null
  }

  // Evento é opcional - encontrar se existir
  eventoHits[matriculaCol] = -1
  eventoHits[valorCol] = -1
  const eventoCol = indexOfMax(eventoHits)
  const eventoCount = eventoHits[eventoCol]

  // Calcular confiança
  const totalRows = rows.length
  const matriculaRatio = matriculaCount / totalRows
  const valorRatio = valorCount / totalRows

  let confidence: 'high' | 'medium' | 'low'
  if (matriculaRatio >= 0.7 && valorRatio >= 0.7) {
    confidence = 'high'
  } else if (matriculaRatio >= 0.4 && valorRatio >= 0.4) {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }

  return {
    matriculaCol,
    valorCol,
    eventoCol: eventoCount > 0 ? eventoCol : undefined,
    confidence,
  }
}

/**
 * Retorna índice do maior valor no array
 */
function indexOfMax(arr: number[]): number {
  let maxIndex = 0
  let maxValue = arr[0]

  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > maxValue) {
      maxValue = arr[i]
      maxIndex = i
    }
  }

  return maxIndex
}
