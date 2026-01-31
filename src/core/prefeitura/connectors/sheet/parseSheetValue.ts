import { parseBRL } from '../../parseBRL'

/**
 * Tipo de célula normalizada
 */
export type CellValue = string | number | null

/**
 * Normaliza valor de célula para string, number ou null
 */
export function parseSheetValue(cell: unknown): CellValue {
  if (cell === null || cell === undefined) {
    return null
  }

  if (typeof cell === 'number') {
    return cell
  }

  if (typeof cell === 'string') {
    const trimmed = cell.trim()
    if (trimmed === '') {
      return null
    }
    return trimmed
  }

  // Para outros tipos, tentar converter para string
  return String(cell)
}

/**
 * Tenta parsear célula como valor monetário
 * Aceita number ou string BR "1.234,56"
 */
export function parseCellAsMonetary(cell: unknown): number | null {
  if (cell === null || cell === undefined) {
    return null
  }

  if (typeof cell === 'number') {
    // Se for número, assumir que já está em formato correto
    return isFinite(cell) ? cell : null
  }

  if (typeof cell === 'string') {
    return parseBRL(cell)
  }

  return null
}

/**
 * Regex para matrícula
 */
export const MATRICULA_REGEX = /\b(\d{1,6}-\d{1,3})\b/

/**
 * Tenta extrair matrícula de uma célula
 */
export function parseCellAsMatricula(cell: unknown): string | null {
  if (cell === null || cell === undefined) {
    return null
  }

  const str = String(cell).trim()
  const match = str.match(MATRICULA_REGEX)
  return match ? match[1] : null
}
