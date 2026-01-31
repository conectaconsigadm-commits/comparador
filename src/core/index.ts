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
