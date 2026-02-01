/**
 * Divide uma linha CSV em campos, respeitando aspas duplas
 *
 * Regras:
 * - Campos podem estar entre aspas duplas: "valor com , dentro"
 * - Aspas dentro de campos são escapadas como "" (duas aspas)
 * - Se a linha estiver "suja" (não parseável), retorna [line] como fallback
 */

import type { CsvDelimiter } from './detectDelimiter'

/**
 * Divide uma linha CSV em campos
 *
 * @param line Linha do CSV
 * @param delimiter Delimitador a usar
 * @returns Array de campos (strings)
 */
export function splitCsvLine(line: string, delimiter: CsvDelimiter): string[] {
  const fields: string[] = []
  let currentField = ''
  let insideQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]

    if (char === '"') {
      if (!insideQuotes) {
        // Início de campo com aspas
        insideQuotes = true
      } else if (i + 1 < line.length && line[i + 1] === '"') {
        // Aspas escapadas ("") dentro de campo
        currentField += '"'
        i++ // Pula a próxima aspa
      } else {
        // Fim de campo com aspas
        insideQuotes = false
      }
    } else if (char === delimiter && !insideQuotes) {
      // Fim do campo
      fields.push(currentField.trim())
      currentField = ''
    } else {
      currentField += char
    }

    i++
  }

  // Adicionar último campo
  fields.push(currentField.trim())

  return fields
}

/**
 * Tenta dividir uma linha CSV, com fallback para a linha inteira
 *
 * @param line Linha do CSV
 * @param delimiter Delimitador a usar
 * @returns Array de campos ou [line] se não conseguir parsear
 */
export function splitCsvLineSafe(line: string, delimiter: CsvDelimiter): string[] {
  try {
    const fields = splitCsvLine(line, delimiter)

    // Se só retornou 1 campo e a linha tem o delimitador, algo deu errado
    // Mas isso pode ser válido (linha sem delimitador), então aceita
    return fields
  } catch {
    // Fallback: retorna a linha inteira
    return [line]
  }
}

/**
 * Extrai um campo específico de uma linha CSV
 *
 * @param line Linha do CSV
 * @param delimiter Delimitador
 * @param index Índice do campo (0-based)
 * @returns O campo ou undefined se não existir
 */
export function getCsvField(
  line: string,
  delimiter: CsvDelimiter,
  index: number
): string | undefined {
  const fields = splitCsvLine(line, delimiter)
  return index >= 0 && index < fields.length ? fields[index] : undefined
}
