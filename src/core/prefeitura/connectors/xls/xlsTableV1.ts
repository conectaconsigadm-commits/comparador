import * as XLSX from 'xlsx'
import type { NormalizedRow, DiagnosticsItem } from '../../../domain/types'
import { selectBestSheet } from '../sheet/selectBestSheet'
import { detectSheetColumns } from '../sheet/detectSheetColumns'
import { extractCompetenciaFromCells } from '../sheet/extractCompetenciaFromCells'
import {
  parseSheetValue,
  parseCellAsMatricula,
  parseCellAsMonetary,
} from '../sheet/parseSheetValue'

/**
 * Resultado da extração de XLS
 */
export interface XlsExtractionResult {
  rows: NormalizedRow[]
  diagnostics: DiagnosticsItem[]
  competencia?: string
  formato: 'xls_table_v1'
  extracao: 'completa' | 'parcial' | 'falhou'
}

/**
 * Extrai dados de arquivo XLS (formato legado)
 */
export async function extractFromXls(file: File): Promise<XlsExtractionResult> {
  const diagnostics: DiagnosticsItem[] = []

  try {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })

    // Selecionar melhor aba
    const sheetName = selectBestSheet(workbook)
    diagnostics.push({
      severity: 'info',
      code: 'XLS_SHEET_SELECTED',
      message: `Aba selecionada: "${sheetName}"`,
      details: { sheetName, totalSheets: workbook.SheetNames.length },
    })

    // Converter para matriz
    const sheet = workbook.Sheets[sheetName]
    const rawData = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 })
    const data: (string | number | null)[][] = rawData.map((row) =>
      (row as unknown[]).map((cell) => parseSheetValue(cell))
    )

    if (data.length === 0) {
      diagnostics.push({
        severity: 'error',
        code: 'XLS_ZERO_ROWS',
        message: 'Planilha vazia ou sem dados',
      })
      return {
        rows: [],
        diagnostics,
        formato: 'xls_table_v1',
        extracao: 'falhou',
      }
    }

    // Detectar colunas
    const columns = detectSheetColumns(data)

    if (!columns) {
      diagnostics.push({
        severity: 'error',
        code: 'XLS_ZERO_ROWS',
        message: 'Não foi possível detectar colunas de matrícula e valor',
      })
      return {
        rows: [],
        diagnostics,
        formato: 'xls_table_v1',
        extracao: 'falhou',
      }
    }

    diagnostics.push({
      severity: 'info',
      code: 'XLS_COLUMNS_DETECTED',
      message: `Colunas: matrícula=${columns.matriculaCol}, valor=${columns.valorCol}${columns.nomeCol !== undefined ? `, nome=${columns.nomeCol}` : ''}${columns.cpfCol !== undefined ? `, cpf=${columns.cpfCol}` : ''}`,
      details: {
        matriculaCol: columns.matriculaCol,
        valorCol: columns.valorCol,
        eventoCol: columns.eventoCol,
        nomeCol: columns.nomeCol,
        cpfCol: columns.cpfCol,
        confidence: columns.confidence,
      },
    })

    // Extrair competência
    const competencia = extractCompetenciaFromCells(data)
    if (!competencia) {
      diagnostics.push({
        severity: 'warn',
        code: 'XLS_COMPETENCIA_NOT_FOUND',
        message: 'Competência não detectada na planilha',
      })
    }

    // Extrair rows
    const rows: NormalizedRow[] = []
    let discarded = 0
    let eventoAtual: string | undefined

    // Regex para detectar linha de evento: "Evento: 002" ou "Evento:  002 - CONSIGNADO"
    const eventoLineRegex = /Evento:\s*(\d{1,3})/i

    for (const row of data) {
      // Verificar se alguma célula da linha contém "Evento: XXX"
      for (const cell of row) {
        if (cell !== null) {
          const cellStr = String(cell)
          const eventoMatch = cellStr.match(eventoLineRegex)
          if (eventoMatch) {
            eventoAtual = eventoMatch[1].padStart(3, '0')
            break
          }
        }
      }

      // Tentar extrair evento da coluna de evento (se existir)
      if (columns.eventoCol !== undefined && row[columns.eventoCol] !== null) {
        const evtVal = String(row[columns.eventoCol]).trim()
        if (/^\d{1,3}$/.test(evtVal)) {
          eventoAtual = evtVal.padStart(3, '0')
        }
      }

      // Extrair matrícula
      const matricula = parseCellAsMatricula(row[columns.matriculaCol])
      if (!matricula) {
        discarded++
        continue
      }

      // Extrair valor
      const valor = parseCellAsMonetary(row[columns.valorCol])
      if (valor === null) {
        discarded++
        continue
      }

      // Extrair nome (se coluna detectada)
      let nome: string | undefined
      if (columns.nomeCol !== undefined && row[columns.nomeCol] !== null) {
        const nomeVal = String(row[columns.nomeCol]).trim()
        if (nomeVal.length >= 3 && /^[A-Za-zÀ-ÿ\s]+$/.test(nomeVal)) {
          nome = nomeVal
        }
      }

      // Extrair CPF (se coluna detectada)
      let cpf: string | undefined
      if (columns.cpfCol !== undefined && row[columns.cpfCol] !== null) {
        const cpfVal = String(row[columns.cpfCol]).replace(/\D/g, '')
        if (cpfVal.length === 11) {
          cpf = cpfVal.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        }
      }

      rows.push({
        source: 'prefeitura',
        matricula,
        valor,
        nome,
        cpf,
        meta: {
          competencia,
          evento: eventoAtual,
          confidence: columns.confidence,
        },
        rawRef: {
          raw: JSON.stringify(row).slice(0, 500),
        },
      })
    }

    // Verificar se detectou evento
    if (!eventoAtual && rows.length > 0) {
      diagnostics.push({
        severity: 'warn',
        code: 'XLS_EVENT_NOT_FOUND',
        message: 'Evento não detectado na planilha',
      })
    }

    // Summary
    if (rows.length === 0) {
      diagnostics.push({
        severity: 'error',
        code: 'XLS_ZERO_ROWS',
        message: 'Nenhuma linha com matrícula e valor foi extraída',
        details: { totalRows: data.length, discarded },
      })
      return {
        rows: [],
        diagnostics,
        formato: 'xls_table_v1',
        extracao: 'falhou',
      }
    }

    diagnostics.push({
      severity: 'info',
      code: 'XLS_PARSE_SUMMARY',
      message: `Extraídas ${rows.length} linhas de ${data.length} totais`,
      details: {
        totalRows: data.length,
        extractedRows: rows.length,
        discarded,
        competencia,
      },
    })

    // Determinar qualidade da extração
    const ratio = rows.length / data.length
    const extracao = determineExtracao(rows.length, ratio, columns.confidence, competencia, diagnostics)

    return {
      rows,
      diagnostics,
      competencia,
      formato: 'xls_table_v1',
      extracao,
    }
  } catch (error) {
    diagnostics.push({
      severity: 'error',
      code: 'XLS_READ_ERROR',
      message: `Erro ao ler XLS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    })
    return {
      rows: [],
      diagnostics,
      formato: 'xls_table_v1',
      extracao: 'falhou',
    }
  }
}

/**
 * Determina qualidade da extração
 */
function determineExtracao(
  extractedRows: number,
  ratio: number,
  confidence: 'high' | 'medium' | 'low',
  competencia: string | undefined,
  diagnostics: DiagnosticsItem[]
): 'completa' | 'parcial' | 'falhou' {
  const hasError = diagnostics.some(
    (d) => d.severity === 'error' && ['XLS_ZERO_ROWS', 'XLS_READ_ERROR'].includes(d.code)
  )

  if (hasError || extractedRows === 0) {
    return 'falhou'
  }

  if (ratio < 0.5 || confidence === 'low' || !competencia) {
    return 'parcial'
  }

  return 'completa'
}
