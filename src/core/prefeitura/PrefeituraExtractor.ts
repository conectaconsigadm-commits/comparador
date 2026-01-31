import type { NormalizedRow, DiagnosticsItem } from '../domain/types'
import { extractFromCsvReport } from './extractFromCsvReport'
import { extractFromPdf } from './connectors/pdf/pdfTextReportV1'
import { extractFromDocx } from './connectors/docx/docxTextReportV1'
import { extractFromXlsx } from './connectors/xlsx/xlsxTableV1'
import { extractFromXls } from './connectors/xls/xlsTableV1'

/**
 * Formato detectado do arquivo da prefeitura
 */
export type PrefeituraFormato =
  | 'csv_report_v1'
  | 'pdf_text_report_v1'
  | 'docx_text_report_v1'
  | 'xlsx_table_v1'
  | 'xls_table_v1'
  | 'unknown'

/**
 * Resultado da extração da prefeitura
 */
export interface PrefeituraExtractionResult {
  rows: NormalizedRow[]
  diagnostics: DiagnosticsItem[]
  competencia?: string
  formato: PrefeituraFormato
  extracao?: 'completa' | 'parcial' | 'falhou'
}

/**
 * Extrator de dados da prefeitura
 * Suporta diferentes formatos de arquivo (CSV, PDF, DOCX)
 */
export class PrefeituraExtractor {
  /**
   * Extrai dados do arquivo da prefeitura
   * @param file Arquivo selecionado pelo usuário
   * @returns Linhas normalizadas + diagnósticos + formato detectado
   */
  async extract(file: File): Promise<PrefeituraExtractionResult> {
    const extension = this.getExtension(file.name)

    // CSV: usar extrator de relatório CSV v1
    if (extension === 'csv') {
      const text = await file.text()
      const result = extractFromCsvReport(text)

      // Determinar extracao
      const hasError = result.diagnostics.some((d) => d.severity === 'error')
      const extracao: 'completa' | 'parcial' | 'falhou' =
        result.rows.length === 0
          ? 'falhou'
          : hasError
          ? 'parcial'
          : 'completa'

      return {
        ...result,
        formato: 'csv_report_v1',
        extracao,
      }
    }

    // PDF: usar extrator de texto PDF
    if (extension === 'pdf') {
      return extractFromPdf(file)
    }

    // DOCX: usar extrator de texto DOCX
    if (extension === 'docx') {
      return extractFromDocx(file)
    }

    // XLSX: usar extrator de planilha XLSX
    if (extension === 'xlsx') {
      return extractFromXlsx(file)
    }

    // XLS: usar extrator de planilha XLS (formato legado)
    if (extension === 'xls') {
      return extractFromXls(file)
    }

    // Formato não suportado
    return {
      rows: [],
      diagnostics: [
        {
          severity: 'error',
          code: 'prefeitura_unsupported_format',
          message: `Formato de arquivo não suportado: .${extension || '(sem extensão)'}`,
          details: {
            fileName: file.name,
            extension,
            supportedFormats: ['csv', 'pdf', 'docx', 'xlsx', 'xls'],
          },
        },
      ],
      competencia: undefined,
      formato: 'unknown',
      extracao: 'falhou',
    }
  }

  /**
   * Extrai extensão do nome do arquivo (lowercase)
   */
  private getExtension(fileName: string): string {
    const parts = fileName.split('.')
    if (parts.length < 2) {
      return ''
    }
    return parts[parts.length - 1].toLowerCase()
  }
}
