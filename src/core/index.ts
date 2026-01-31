/**
 * Core Engine - Conciliação Banco × Prefeitura
 * 
 * Este módulo exporta os tipos e interfaces do domínio.
 * A implementação será adicionada incrementalmente.
 */

// Domain types
export type {
  Money,
  RowSource,
  ConfidenceLevel,
  RowMeta,
  RawRef,
  NormalizedRow,
  DiagnosticSeverity,
  DiagnosticsItem,
  ReconciliationStatus,
  ReconciliationItem,
  ExtracaoQualidade,
  ReconciliationSummary,
  ReconciliationResult,
} from './domain/types'

// Pipeline types
export type {
  PipelineStep,
  PipelineProgress,
  ProgressCallback,
} from './pipeline/progress'

// Bank parser
export { BankParser } from './bank/BankParser'
export type { BankParseResult } from './bank/BankParser'
export { parseBankLine } from './bank/parseLine'
export type { ParseLineResult } from './bank/parseLine'

// Prefeitura extractor
export { PrefeituraExtractor } from './prefeitura/PrefeituraExtractor'
export type {
  PrefeituraFormato,
  PrefeituraExtractionResult,
} from './prefeitura/PrefeituraExtractor'
export { extractFromCsvReport } from './prefeitura/extractFromCsvReport'
export type { CsvReportExtractionResult } from './prefeitura/extractFromCsvReport'
export { parseBRL } from './prefeitura/parseBRL'

// Reconciler
export { Reconciler } from './reconcile/Reconciler'
