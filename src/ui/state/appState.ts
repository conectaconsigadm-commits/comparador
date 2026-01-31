import type { NormalizedRow, DiagnosticsItem, ReconciliationResult } from '../../core/domain/types'

/**
 * Estado de dados do banco parseados
 */
export interface BankParsedData {
  rows: NormalizedRow[]
  diagnostics: DiagnosticsItem[]
  competencia?: string
  lines: number
}

/**
 * Estado de dados da prefeitura parseados
 */
export interface PrefeituraParsedData {
  rows: NormalizedRow[]
  diagnostics: DiagnosticsItem[]
  competencia?: string
  formato: string
  extracted: number
  extracao: 'completa' | 'parcial' | 'falhou'
}

/**
 * Dados completos do upload
 */
export interface UploadState {
  bankFile?: File
  prefFile?: File
  bankParsed?: BankParsedData
  prefParsed?: PrefeituraParsedData
}

/**
 * Dados do resultado
 */
export interface ResultState {
  result?: ReconciliationResult
  excelBlob?: Blob
}

/**
 * Estado global da aplicação
 */
export interface AppState {
  screen: 'upload' | 'processing' | 'result'
  upload: UploadState
  result: ResultState
  processing: {
    percent: number
    currentStep: number
    error?: string
  }
}

/**
 * Estado inicial
 */
export const initialAppState: AppState = {
  screen: 'upload',
  upload: {},
  result: {},
  processing: {
    percent: 0,
    currentStep: 0,
  },
}

/**
 * Gera filename para o Excel
 */
export function generateExcelFilename(competencia?: string): string {
  const comp = competencia
    ? competencia.replace(/\//g, '-')
    : 'sem-competencia'
  return `conecta-consig_${comp}.xlsx`
}
