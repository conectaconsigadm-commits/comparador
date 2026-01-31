import JSZip from 'jszip'
import type { NormalizedRow, DiagnosticsItem } from '../../../domain/types'
import { parseTextReport } from '../text/parseTextReport'

/**
 * Resultado da extração de DOCX
 */
export interface DocxExtractionResult {
  rows: NormalizedRow[]
  diagnostics: DiagnosticsItem[]
  competencia?: string
  formato: 'docx_text_report_v1'
  extracao: 'completa' | 'parcial' | 'falhou'
}

/**
 * Extrai texto de DOCX e processa como relatório
 */
export async function extractFromDocx(file: File): Promise<DocxExtractionResult> {
  const diagnostics: DiagnosticsItem[] = []

  try {
    const zip = await JSZip.loadAsync(file)
    const documentXml = await zip.file('word/document.xml')?.async('string')

    if (!documentXml) {
      diagnostics.push({
        severity: 'error',
        code: 'DOCX_EMPTY',
        message: 'Documento DOCX vazio ou corrompido',
      })

      return {
        rows: [],
        diagnostics,
        formato: 'docx_text_report_v1',
        extracao: 'falhou',
      }
    }

    // Detectar se tem tabela
    const hasTable = documentXml.includes('<w:tbl')
    let extractedText = ''

    if (hasTable) {
      diagnostics.push({
        severity: 'info',
        code: 'DOCX_TABLE_DETECTED',
        message: 'Tabela detectada no documento',
      })

      // Tentar extrair tabela
      const tableText = extractTableText(documentXml)

      if (tableText) {
        extractedText = tableText
      } else {
        diagnostics.push({
          severity: 'warn',
          code: 'DOCX_TABLE_EXTRACT_FALLBACK_TEXT',
          message: 'Falha ao extrair tabela, usando texto corrido',
        })
        extractedText = extractPlainText(documentXml)
      }
    } else {
      diagnostics.push({
        severity: 'warn',
        code: 'DOCX_NO_TABLE',
        message: 'Documento sem tabela, usando texto corrido',
      })
      extractedText = extractPlainText(documentXml)
    }

    if (!extractedText.trim()) {
      diagnostics.push({
        severity: 'error',
        code: 'DOCX_EMPTY',
        message: 'Nenhum texto extraído do documento',
      })

      return {
        rows: [],
        diagnostics,
        formato: 'docx_text_report_v1',
        extracao: 'falhou',
      }
    }

    // Processar texto
    const result = parseTextReport(extractedText)

    diagnostics.push({
      severity: 'info',
      code: 'DOCX_TEXT_EXTRACTED',
      message: `Texto extraído: ${extractedText.length} caracteres`,
      details: { hasTable, textLength: extractedText.length },
    })

    // Combinar diagnósticos
    const allDiagnostics = [...diagnostics, ...result.diagnostics]

    // Determinar extração
    const extracao = determineExtracao(result.rows.length, allDiagnostics)

    return {
      rows: result.rows,
      diagnostics: allDiagnostics,
      competencia: result.competencia,
      formato: 'docx_text_report_v1',
      extracao,
    }
  } catch (error) {
    diagnostics.push({
      severity: 'error',
      code: 'DOCX_READ_ERROR',
      message: `Erro ao ler DOCX: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    })

    return {
      rows: [],
      diagnostics,
      formato: 'docx_text_report_v1',
      extracao: 'falhou',
    }
  }
}

/**
 * Extrai texto de tabelas DOCX
 * Divide por <w:tr> (rows) e <w:tc> (cells)
 */
function extractTableText(xml: string): string | null {
  try {
    const lines: string[] = []

    // Encontrar todas as tabelas
    const tableMatches = xml.match(/<w:tbl[^>]*>[\s\S]*?<\/w:tbl>/g) || []

    for (const table of tableMatches) {
      // Encontrar todas as linhas
      const rowMatches = table.match(/<w:tr[^>]*>[\s\S]*?<\/w:tr>/g) || []

      for (const row of rowMatches) {
        // Encontrar todas as células
        const cellMatches = row.match(/<w:tc[^>]*>[\s\S]*?<\/w:tc>/g) || []
        const cellTexts: string[] = []

        for (const cell of cellMatches) {
          // Extrair texto da célula
          const textMatches = cell.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []
          const cellText = textMatches
            .map((t) => t.replace(/<[^>]+>/g, ''))
            .join('')
            .trim()
          cellTexts.push(cellText)
        }

        if (cellTexts.some((t) => t.length > 0)) {
          lines.push(cellTexts.join(' | '))
        }
      }
    }

    return lines.length > 0 ? lines.join('\n') : null
  } catch {
    return null
  }
}

/**
 * Extrai texto corrido do DOCX
 */
function extractPlainText(xml: string): string {
  const textMatches = xml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []

  // Agrupar por parágrafos (<w:p>)
  const paragraphs: string[] = []

  // Dividir por parágrafos
  const paragraphMatches = xml.match(/<w:p[^>]*>[\s\S]*?<\/w:p>/g) || []

  for (const para of paragraphMatches) {
    const paraTexts = para.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []
    const text = paraTexts
      .map((t) => t.replace(/<[^>]+>/g, ''))
      .join('')
      .trim()

    if (text) {
      paragraphs.push(text)
    }
  }

  // Se não encontrou parágrafos, usar método simples
  if (paragraphs.length === 0) {
    return textMatches
      .map((t) => t.replace(/<[^>]+>/g, ''))
      .join(' ')
  }

  return paragraphs.join('\n')
}

/**
 * Determina qualidade da extração
 */
function determineExtracao(
  extractedRows: number,
  diagnostics: DiagnosticsItem[]
): 'completa' | 'parcial' | 'falhou' {
  const hasError = diagnostics.some(
    (d) =>
      d.severity === 'error' &&
      ['DOCX_EMPTY', 'DOCX_READ_ERROR', 'TEXT_ZERO_ROWS'].includes(d.code)
  )

  if (hasError || extractedRows === 0) {
    return 'falhou'
  }

  const hasWarning = diagnostics.some(
    (d) =>
      d.severity === 'warn' &&
      ['DOCX_NO_TABLE', 'DOCX_TABLE_EXTRACT_FALLBACK_TEXT'].includes(d.code)
  )

  if (hasWarning) {
    return 'parcial'
  }

  return 'completa'
}
