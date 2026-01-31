import * as pdfjsLib from 'pdfjs-dist'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import type { NormalizedRow, DiagnosticsItem } from '../../../domain/types'
import { parseTextReport } from '../text/parseTextReport'

// Configurar worker para Vite
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Vite URL import
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

/**
 * Tipo de PDF detectado
 */
type PdfType = 'text' | 'mixed' | 'scan'

/**
 * Resultado da extração de PDF
 */
export interface PdfExtractionResult {
  rows: NormalizedRow[]
  diagnostics: DiagnosticsItem[]
  competencia?: string
  formato: 'pdf_text_report_v1'
  extracao: 'completa' | 'parcial' | 'falhou'
}

/**
 * Extrai texto de PDF e processa como relatório
 */
export async function extractFromPdf(file: File): Promise<PdfExtractionResult> {
  const diagnostics: DiagnosticsItem[] = []

  try {
    const buffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
    const totalPages = pdf.numPages

    // Classificar tipo de PDF (primeiras 3 páginas)
    const { type, avgCharsPerPage } = await classifyPdf(pdf)

    if (type === 'scan') {
      diagnostics.push({
        severity: 'error',
        code: 'PDF_SCAN_DETECTED',
        message: 'PDF parece ser um scan/imagem. Não é possível extrair texto sem OCR.',
        details: { avgCharsPerPage, totalPages },
      })

      return {
        rows: [],
        diagnostics,
        formato: 'pdf_text_report_v1',
        extracao: 'falhou',
      }
    }

    if (type === 'mixed') {
      diagnostics.push({
        severity: 'warn',
        code: 'PDF_TEXT_SPARSE',
        message: 'PDF tem pouco texto. Pode ser parcialmente scan ou ter conteúdo limitado.',
        details: { avgCharsPerPage, totalPages },
      })
    }

    // Extrair texto de todas as páginas preservando quebras de linha
    let fullText = ''
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      
      // Extrair texto preservando quebras de linha baseado na posição Y
      const pageText = extractTextWithLineBreaks(textContent.items)
      fullText += pageText + '\n\n'
    }

    // Processar texto
    const result = parseTextReport(fullText)

    diagnostics.push({
      severity: 'info',
      code: 'PDF_TEXT_EXTRACTED',
      message: `Texto extraído de ${totalPages} páginas`,
      details: { totalPages, avgCharsPerPage, textLength: fullText.length },
    })

    // Combinar diagnósticos
    const allDiagnostics = [...diagnostics, ...result.diagnostics]

    // Determinar extração
    const extracao = determineExtracao(result.rows.length, type, allDiagnostics)

    return {
      rows: result.rows,
      diagnostics: allDiagnostics,
      competencia: result.competencia,
      formato: 'pdf_text_report_v1',
      extracao,
    }
  } catch (error) {
    diagnostics.push({
      severity: 'error',
      code: 'PDF_READ_ERROR',
      message: `Erro ao ler PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    })

    return {
      rows: [],
      diagnostics,
      formato: 'pdf_text_report_v1',
      extracao: 'falhou',
    }
  }
}

/**
 * Extrai texto de itens do PDF preservando quebras de linha
 * Detecta nova linha quando a posição Y muda significativamente
 */
function extractTextWithLineBreaks(items: (TextItem | { type: string })[]): string {
  const textItems = items.filter((item): item is TextItem => 'str' in item)
  
  if (textItems.length === 0) return ''
  
  const lines: string[] = []
  let currentLine = ''
  let lastY: number | null = null
  
  for (const item of textItems) {
    // transform[5] é a posição Y (transform é [scaleX, skewX, skewY, scaleY, translateX, translateY])
    const y = item.transform ? item.transform[5] : null
    
    // Se Y mudou significativamente (mais de 5 unidades), é uma nova linha
    if (lastY !== null && y !== null && Math.abs(y - lastY) > 5) {
      if (currentLine.trim()) {
        lines.push(currentLine.trim())
      }
      currentLine = item.str
    } else {
      // Mesma linha - adicionar com espaço se necessário
      if (currentLine && !currentLine.endsWith(' ') && !item.str.startsWith(' ')) {
        currentLine += ' '
      }
      currentLine += item.str
    }
    
    if (y !== null) {
      lastY = y
    }
  }
  
  // Adicionar última linha
  if (currentLine.trim()) {
    lines.push(currentLine.trim())
  }
  
  return lines.join('\n')
}

/**
 * Classifica PDF como text, mixed ou scan
 */
async function classifyPdf(
  pdf: pdfjsLib.PDFDocumentProxy
): Promise<{ type: PdfType; avgCharsPerPage: number }> {
  const totalPages = pdf.numPages
  const pagesToCheck = Math.min(totalPages, 3)

  let totalChars = 0

  for (let i = 1; i <= pagesToCheck; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .filter((item): item is TextItem => 'str' in item)
      .map((item) => item.str)
      .join('')
    // Contar caracteres sem espaços
    totalChars += pageText.replace(/\s/g, '').length
  }

  const avgCharsPerPage = totalChars / pagesToCheck

  let type: PdfType
  if (avgCharsPerPage < 50) {
    type = 'scan'
  } else if (avgCharsPerPage < 200) {
    type = 'mixed'
  } else {
    type = 'text'
  }

  return { type, avgCharsPerPage }
}

/**
 * Determina qualidade da extração
 */
function determineExtracao(
  extractedRows: number,
  pdfType: PdfType,
  diagnostics: DiagnosticsItem[]
): 'completa' | 'parcial' | 'falhou' {
  const hasError = diagnostics.some(
    (d) =>
      d.severity === 'error' &&
      ['PDF_SCAN_DETECTED', 'PDF_READ_ERROR', 'TEXT_ZERO_ROWS'].includes(d.code)
  )

  if (hasError || extractedRows === 0) {
    return 'falhou'
  }

  if (pdfType === 'mixed') {
    return 'parcial'
  }

  return 'completa'
}
