/**
 * Tipos para o manifest de massas de teste do PrefeituraExtractor
 */

import type { PrefeituraFormato } from '../../src/core/prefeitura/PrefeituraExtractor'

/** Tipo de arquivo de teste */
export type TestFileKind = 'csv' | 'xlsx' | 'pdf' | 'docx' | 'text'

/**
 * Resultado esperado de um caso de teste
 */
export interface ExpectedResult {
  /** Se a extração deve ser bem sucedida (rows > 0, sem erros críticos) */
  success: boolean
  /** Número mínimo de linhas esperadas */
  minRows: number
  /** Taxa mínima de aproveitamento (0-1) */
  minYield: number
  /** Competência esperada (MM/AAAA) */
  competencia?: string
  /** Amostra de matrículas que devem estar presentes */
  sampleMatriculas?: string[]
  /** Amostra de valores que devem estar presentes */
  sampleValores?: number[]
  /** Diagnósticos que DEVEM estar presentes (códigos) */
  mustHaveDiagnostics?: string[]
  /** Se não deve ter erros (severity: 'error') */
  mustNotHaveErrors?: boolean
}

/**
 * Caso de teste individual
 */
export interface TestCase {
  /** ID único do caso de teste */
  id: string
  /** Caminho relativo do arquivo (a partir de testdata/prefeitura/) */
  file: string
  /** Tipo de arquivo */
  kind: TestFileKind
  /** Formato esperado */
  format: PrefeituraFormato | 'text_report'
  /** Descrição do caso de teste */
  description: string
  /** Resultado esperado */
  expected: ExpectedResult
  /** Caminho do arquivo .txt espelho (para binários) */
  textMirror?: string
  /** Se o teste é opcional (só roda com env var) */
  optional?: boolean
  /** Notas adicionais (para documentação) */
  notes?: string
}

/**
 * Manifest completo de casos de teste
 */
export interface TestManifest {
  /** Versão do schema */
  $schema?: string
  /** Versão do manifest */
  version: string
  /** Descrição */
  description: string
  /** Lista de casos de teste */
  testCases: TestCase[]
}

/**
 * Resultado da execução de um caso de teste
 */
export interface TestRunResult {
  /** ID do caso de teste */
  testId: string
  /** Arquivo testado */
  file: string
  /** Tipo de arquivo */
  kind: TestFileKind
  /** Status: passou, falhou, pulado, ou erro */
  status: 'passed' | 'failed' | 'skipped' | 'error'
  /** Formato detectado */
  formatoDetectado?: string
  /** Linhas extraídas */
  rowsExtracted: number
  /** Taxa de aproveitamento */
  yield: number
  /** Competência detectada */
  competenciaDetectada?: string
  /** Severidade máxima nos diagnósticos */
  topSeverity: 'info' | 'warn' | 'error' | 'none'
  /** Mensagens de erro/falha */
  failures: string[]
  /** Tempo de execução em ms */
  durationMs: number
}

/**
 * Relatório completo de execução dos testes
 */
export interface TestRunReport {
  /** Timestamp de execução */
  timestamp: string
  /** Total de testes */
  total: number
  /** Testes que passaram */
  passed: number
  /** Testes que falharam */
  failed: number
  /** Testes pulados */
  skipped: number
  /** Testes com erro */
  errors: number
  /** Tempo total em ms */
  totalDurationMs: number
  /** Resultados individuais */
  results: TestRunResult[]
}
