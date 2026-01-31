/**
 * Regex para competência: MM/AAAA
 */
const COMPETENCIA_REGEX_SLASH = /\b(\d{2})\/(\d{4})\b/

/**
 * Regex para competência compacta: MMAAAA (mês válido 01-12)
 */
const COMPETENCIA_REGEX_COMPACT = /\b(0[1-9]|1[0-2])(\d{4})\b/

/**
 * Extrai competência das primeiras N linhas de uma matriz
 * Procura por padrões MM/AAAA, Mês/Ano: 01/2026, 012026
 */
export function extractCompetenciaFromCells(
  rows: (string | number | null)[][],
  maxRows = 30
): string | undefined {
  const linesToCheck = Math.min(rows.length, maxRows)

  for (let i = 0; i < linesToCheck; i++) {
    const row = rows[i]
    for (const cell of row) {
      if (cell === null) continue

      const str = String(cell)

      // Tentar formato MM/AAAA
      const matchSlash = str.match(COMPETENCIA_REGEX_SLASH)
      if (matchSlash) {
        return `${matchSlash[1]}/${matchSlash[2]}`
      }

      // Tentar formato compacto MMAAAA
      const matchCompact = str.match(COMPETENCIA_REGEX_COMPACT)
      if (matchCompact) {
        return `${matchCompact[1]}/${matchCompact[2]}`
      }
    }
  }

  return undefined
}
