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
 * Regex para detectar CPF (XXX.XXX.XXX-XX)
 */
const CPF_REGEX = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/

/**
 * Verifica se célula parece ser um CPF
 */
export function cellLooksCpf(cell: unknown): boolean {
  if (cell === null || cell === undefined) {
    return false
  }
  const str = String(cell).trim()
  return CPF_REGEX.test(str)
}

/**
 * Valor máximo razoável para consignado (R$ 50.000)
 * Valores acima disso provavelmente são CPFs parseados errado
 */
const MAX_REASONABLE_VALUE = 50000

/**
 * Tenta parsear célula como valor monetário
 * Aceita number ou string BR "1.234,56"
 * Exclui valores que parecem ser CPF ou são muito grandes
 */
export function parseCellAsMonetary(cell: unknown): number | null {
  if (cell === null || cell === undefined) {
    return null
  }

  // Se parecer CPF, não é valor monetário
  if (cellLooksCpf(cell)) {
    return null
  }

  let value: number | null = null

  if (typeof cell === 'number') {
    // Se for número, assumir que já está em formato correto
    value = isFinite(cell) ? cell : null
  } else if (typeof cell === 'string') {
    value = parseBRL(cell)
  }

  // Validar que o valor é razoável (não é CPF parseado errado)
  if (value !== null && value > MAX_REASONABLE_VALUE) {
    return null
  }

  return value
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
