import type { WorkBook, WorkSheet } from 'xlsx'
import * as XLSX from 'xlsx'

/**
 * Seleciona a melhor aba de um workbook
 * Heurística: maior número de células não vazias
 */
export function selectBestSheet(workbook: WorkBook): string {
  const sheetNames = workbook.SheetNames

  if (sheetNames.length === 0) {
    throw new Error('Workbook sem abas')
  }

  if (sheetNames.length === 1) {
    return sheetNames[0]
  }

  let bestSheet = sheetNames[0]
  let bestScore = 0

  for (const name of sheetNames) {
    const sheet = workbook.Sheets[name]
    const score = countNonEmptyCells(sheet)

    if (score > bestScore) {
      bestScore = score
      bestSheet = name
    }
  }

  return bestSheet
}

/**
 * Conta células não vazias em uma sheet
 */
function countNonEmptyCells(sheet: WorkSheet): number {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
  let count = 0

  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const addr = XLSX.utils.encode_cell({ r: row, c: col })
      const cell = sheet[addr]
      if (cell && cell.v !== null && cell.v !== undefined && cell.v !== '') {
        count++
      }
    }
  }

  return count
}
