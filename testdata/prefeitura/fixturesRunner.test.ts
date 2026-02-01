/**
 * Runner de testes para fixtures do PrefeituraExtractor
 *
 * Este arquivo carrega as massas de teste do manifest.json e executa
 * cada uma através dos parsers específicos, validando os resultados
 * contra os valores esperados.
 *
 * Para testes binários opcionais (XLSX/PDF/DOCX reais):
 *   RUN_BINARY_FIXTURES=1 npm test
 *
 * Uso:
 *   npm test -- testdata/prefeitura/fixturesRunner.test.ts
 */

import { describe, it, expect, afterAll } from 'vitest'
import { extractFromCsvReport } from '../../src/core/prefeitura/extractFromCsvReport'
import { parseTextReport } from '../../src/core/prefeitura/connectors/text/parseTextReport'
import { extractFromXlsx } from '../../src/core/prefeitura/connectors/xlsx/xlsxTableV1'
import { generateAllXlsxTestFiles } from './generator/XlsxGenerator'
import type { TestManifest, TestCase, TestRunResult, TestRunReport, TestFileKind } from './types'
import * as fs from 'fs'
import * as path from 'path'

// Caminho base para os arquivos de teste
const TESTDATA_BASE = path.join(__dirname)

// Carregar manifest
const manifestPath = path.join(TESTDATA_BASE, 'manifest.json')
const manifest: TestManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))

// Flag para testes binários opcionais
const RUN_BINARY_FIXTURES = process.env.RUN_BINARY_FIXTURES === '1'

// Armazenar resultados para relatório final
const testResults: TestRunResult[] = []

/**
 * Determina severidade máxima de uma lista de diagnósticos
 */
function getTopSeverity(
  diagnostics: Array<{ severity: string }>
): 'error' | 'warn' | 'info' | 'none' {
  if (diagnostics.some((d) => d.severity === 'error')) return 'error'
  if (diagnostics.some((d) => d.severity === 'warn')) return 'warn'
  if (diagnostics.some((d) => d.severity === 'info')) return 'info'
  return 'none'
}

/**
 * Executa um caso de teste de texto (parseTextReport)
 */
async function runTextTestCase(testCase: TestCase): Promise<TestRunResult> {
  const startTime = Date.now()
  const failures: string[] = []

  try {
    const filePath = path.join(TESTDATA_BASE, testCase.file)
    const text = fs.readFileSync(filePath, 'utf-8')
    const result = parseTextReport(text)

    const rowsExtracted = result.rows.length
    const yield_ = testCase.expected.minRows > 0 ? rowsExtracted / testCase.expected.minRows : 1

    // Validar minRows
    if (rowsExtracted < testCase.expected.minRows) {
      failures.push(
        `Linhas extraídas (${rowsExtracted}) < esperado (${testCase.expected.minRows})`
      )
    }

    // Validar competência
    if (testCase.expected.competencia && result.competencia !== testCase.expected.competencia) {
      failures.push(
        `Competência detectada (${result.competencia}) != esperada (${testCase.expected.competencia})`
      )
    }

    // Validar mustHaveDiagnostics
    if (testCase.expected.mustHaveDiagnostics) {
      for (const expectedCode of testCase.expected.mustHaveDiagnostics) {
        const found = result.diagnostics.some((d) => d.code === expectedCode)
        if (!found) {
          failures.push(`Diagnóstico esperado não encontrado: ${expectedCode}`)
        }
      }
    }

    // Validar mustNotHaveErrors
    if (testCase.expected.mustNotHaveErrors) {
      const hasError = result.diagnostics.some((d) => d.severity === 'error')
      if (hasError) {
        const errorCodes = result.diagnostics
          .filter((d) => d.severity === 'error')
          .map((d) => d.code)
        failures.push(`Não deveria ter erros, mas encontrou: ${errorCodes.join(', ')}`)
      }
    }

    // Validar matrículas de amostra
    if (testCase.expected.sampleMatriculas) {
      const matriculasExtraidas = new Set(result.rows.map((r) => r.matricula))
      for (const expectedMat of testCase.expected.sampleMatriculas) {
        if (!matriculasExtraidas.has(expectedMat)) {
          failures.push(`Matrícula esperada não encontrada: ${expectedMat}`)
        }
      }
    }

    // Validar valores de amostra
    if (testCase.expected.sampleValores) {
      for (const expectedVal of testCase.expected.sampleValores) {
        const found = result.rows.some((r) => Math.abs(r.valor - expectedVal) < 0.01)
        if (!found) {
          failures.push(`Valor esperado não encontrado: ${expectedVal}`)
        }
      }
    }

    // Validar success
    if (testCase.expected.success && rowsExtracted === 0) {
      failures.push('Esperado sucesso, mas nenhuma linha extraída')
    }
    if (!testCase.expected.success && rowsExtracted > 0) {
      failures.push(`Esperado falha, mas ${rowsExtracted} linhas extraídas`)
    }

    return {
      testId: testCase.id,
      file: testCase.file,
      kind: testCase.kind,
      status: failures.length === 0 ? 'passed' : 'failed',
      formatoDetectado: testCase.format,
      rowsExtracted,
      yield: yield_,
      competenciaDetectada: result.competencia,
      topSeverity: getTopSeverity(result.diagnostics),
      failures,
      durationMs: Date.now() - startTime,
    }
  } catch (error) {
    return {
      testId: testCase.id,
      file: testCase.file,
      kind: testCase.kind,
      status: 'error',
      rowsExtracted: 0,
      yield: 0,
      topSeverity: 'error',
      failures: [`Erro na execução: ${error instanceof Error ? error.message : String(error)}`],
      durationMs: Date.now() - startTime,
    }
  }
}

/**
 * Executa um caso de teste CSV
 */
async function runCsvTestCase(testCase: TestCase): Promise<TestRunResult> {
  const startTime = Date.now()
  const failures: string[] = []

  try {
    const filePath = path.join(TESTDATA_BASE, testCase.file)
    const text = fs.readFileSync(filePath, 'utf-8')
    const result = extractFromCsvReport(text)

    const rowsExtracted = result.rows.length
    const yield_ = testCase.expected.minRows > 0 ? rowsExtracted / testCase.expected.minRows : 1

    // Validar minRows
    if (rowsExtracted < testCase.expected.minRows) {
      failures.push(
        `Linhas extraídas (${rowsExtracted}) < esperado (${testCase.expected.minRows})`
      )
    }

    // Validar yield
    if (yield_ < testCase.expected.minYield) {
      failures.push(
        `Yield (${(yield_ * 100).toFixed(1)}%) < esperado (${(testCase.expected.minYield * 100).toFixed(1)}%)`
      )
    }

    // Validar competência
    if (testCase.expected.competencia && result.competencia !== testCase.expected.competencia) {
      failures.push(
        `Competência detectada (${result.competencia}) != esperada (${testCase.expected.competencia})`
      )
    }

    // Validar mustNotHaveErrors
    if (testCase.expected.mustNotHaveErrors) {
      const hasError = result.diagnostics.some((d) => d.severity === 'error')
      if (hasError) {
        const errorCodes = result.diagnostics
          .filter((d) => d.severity === 'error')
          .map((d) => d.code)
        failures.push(`Não deveria ter erros, mas encontrou: ${errorCodes.join(', ')}`)
      }
    }

    // Validar matrículas de amostra
    if (testCase.expected.sampleMatriculas) {
      const matriculasExtraidas = new Set(result.rows.map((r) => r.matricula))
      for (const expectedMat of testCase.expected.sampleMatriculas) {
        if (!matriculasExtraidas.has(expectedMat)) {
          failures.push(`Matrícula esperada não encontrada: ${expectedMat}`)
        }
      }
    }

    // Validar valores de amostra
    if (testCase.expected.sampleValores) {
      for (const expectedVal of testCase.expected.sampleValores) {
        const found = result.rows.some((r) => Math.abs(r.valor - expectedVal) < 0.01)
        if (!found) {
          failures.push(`Valor esperado não encontrado: ${expectedVal}`)
        }
      }
    }

    return {
      testId: testCase.id,
      file: testCase.file,
      kind: testCase.kind,
      status: failures.length === 0 ? 'passed' : 'failed',
      formatoDetectado: 'csv_report_v1',
      rowsExtracted,
      yield: yield_,
      competenciaDetectada: result.competencia,
      topSeverity: getTopSeverity(result.diagnostics),
      failures,
      durationMs: Date.now() - startTime,
    }
  } catch (error) {
    return {
      testId: testCase.id,
      file: testCase.file,
      kind: testCase.kind,
      status: 'error',
      rowsExtracted: 0,
      yield: 0,
      topSeverity: 'error',
      failures: [`Erro na execução: ${error instanceof Error ? error.message : String(error)}`],
      durationMs: Date.now() - startTime,
    }
  }
}

/**
 * Executa um caso de teste XLSX
 */
async function runXlsxTestCase(testCase: TestCase): Promise<TestRunResult> {
  const startTime = Date.now()
  const failures: string[] = []

  try {
    // Gerar arquivo XLSX em memória
    const xlsxFiles = generateAllXlsxTestFiles()
    const buffer = xlsxFiles.get(testCase.file)
    
    if (!buffer) {
      // Se não encontrou no gerador, pular
      return {
        testId: testCase.id,
        file: testCase.file,
        kind: testCase.kind,
        status: 'skipped',
        rowsExtracted: 0,
        yield: 0,
        topSeverity: 'none',
        failures: [`Arquivo XLSX não encontrado no gerador: ${testCase.file}`],
        durationMs: Date.now() - startTime,
      }
    }

    // Criar File object
    const file = new File([buffer], path.basename(testCase.file), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const result = await extractFromXlsx(file)

    const rowsExtracted = result.rows.length
    const yield_ = testCase.expected.minRows > 0 ? rowsExtracted / testCase.expected.minRows : 1

    // Validar minRows
    if (rowsExtracted < testCase.expected.minRows) {
      failures.push(
        `Linhas extraídas (${rowsExtracted}) < esperado (${testCase.expected.minRows})`
      )
    }

    // Validar competência
    if (testCase.expected.competencia && result.competencia !== testCase.expected.competencia) {
      failures.push(
        `Competência detectada (${result.competencia}) != esperada (${testCase.expected.competencia})`
      )
    }

    // Validar mustNotHaveErrors
    if (testCase.expected.mustNotHaveErrors) {
      const hasError = result.diagnostics.some((d) => d.severity === 'error')
      if (hasError) {
        const errorCodes = result.diagnostics
          .filter((d) => d.severity === 'error')
          .map((d) => d.code)
        failures.push(`Não deveria ter erros, mas encontrou: ${errorCodes.join(', ')}`)
      }
    }

    // Validar matrículas de amostra
    if (testCase.expected.sampleMatriculas) {
      const matriculasExtraidas = new Set(result.rows.map((r) => r.matricula))
      for (const expectedMat of testCase.expected.sampleMatriculas) {
        if (!matriculasExtraidas.has(expectedMat)) {
          failures.push(`Matrícula esperada não encontrada: ${expectedMat}`)
        }
      }
    }

    return {
      testId: testCase.id,
      file: testCase.file,
      kind: testCase.kind,
      status: failures.length === 0 ? 'passed' : 'failed',
      formatoDetectado: 'xlsx_table_v1',
      rowsExtracted,
      yield: yield_,
      competenciaDetectada: result.competencia,
      topSeverity: getTopSeverity(result.diagnostics),
      failures,
      durationMs: Date.now() - startTime,
    }
  } catch (error) {
    return {
      testId: testCase.id,
      file: testCase.file,
      kind: testCase.kind,
      status: 'error',
      rowsExtracted: 0,
      yield: 0,
      topSeverity: 'error',
      failures: [`Erro na execução: ${error instanceof Error ? error.message : String(error)}`],
      durationMs: Date.now() - startTime,
    }
  }
}

/**
 * Executa um caso de teste baseado no kind
 */
async function runTestCase(testCase: TestCase): Promise<TestRunResult> {
  // Verificar se é opcional e se deve pular
  if (testCase.optional && !RUN_BINARY_FIXTURES) {
    return {
      testId: testCase.id,
      file: testCase.file,
      kind: testCase.kind,
      status: 'skipped',
      rowsExtracted: 0,
      yield: 0,
      topSeverity: 'none',
      failures: ['Teste opcional - use RUN_BINARY_FIXTURES=1 para executar'],
      durationMs: 0,
    }
  }

  switch (testCase.kind) {
    case 'csv':
      return runCsvTestCase(testCase)
    case 'text':
      return runTextTestCase(testCase)
    case 'xlsx':
      return runXlsxTestCase(testCase)
    case 'pdf':
    case 'docx':
      // Para PDF/DOCX binários, usar textMirror se disponível
      if (testCase.textMirror) {
        const mirrorCase = { ...testCase, file: testCase.textMirror, kind: 'text' as TestFileKind }
        return runTextTestCase(mirrorCase)
      }
      return {
        testId: testCase.id,
        file: testCase.file,
        kind: testCase.kind,
        status: 'skipped',
        rowsExtracted: 0,
        yield: 0,
        topSeverity: 'none',
        failures: ['Binário sem textMirror - pulado'],
        durationMs: 0,
      }
    default:
      return {
        testId: testCase.id,
        file: testCase.file,
        kind: testCase.kind,
        status: 'error',
        rowsExtracted: 0,
        yield: 0,
        topSeverity: 'error',
        failures: [`Kind não suportado: ${testCase.kind}`],
        durationMs: 0,
      }
  }
}

/**
 * Gera relatório em formato de tabela
 */
function generateReport(results: TestRunResult[]): TestRunReport {
  const passed = results.filter((r) => r.status === 'passed').length
  const failed = results.filter((r) => r.status === 'failed').length
  const skipped = results.filter((r) => r.status === 'skipped').length
  const errors = results.filter((r) => r.status === 'error').length
  const totalDuration = results.reduce((sum, r) => sum + r.durationMs, 0)

  return {
    timestamp: new Date().toISOString(),
    total: results.length,
    passed,
    failed,
    skipped,
    errors,
    totalDurationMs: totalDuration,
    results,
  }
}

/**
 * Imprime relatório no console
 */
function printReport(report: TestRunReport): void {
  console.log('\n' + '='.repeat(110))
  console.log('RELATÓRIO DE FIXTURES - PrefeituraExtractor')
  console.log('='.repeat(110))
  console.log(`Timestamp: ${report.timestamp}`)
  console.log(
    `Total: ${report.total} | Passou: ${report.passed} | Falhou: ${report.failed} | Pulado: ${report.skipped} | Erros: ${report.errors}`
  )
  console.log(`Tempo total: ${report.totalDurationMs}ms`)
  console.log('-'.repeat(110))

  // Tabela de resultados
  console.log(
    'Arquivo'.padEnd(40) +
      'Kind'.padEnd(8) +
      'Formato'.padEnd(20) +
      'Rows'.padEnd(6) +
      'Yield'.padEnd(8) +
      'Comp'.padEnd(10) +
      'Sev'.padEnd(8) +
      'Status'
  )
  console.log('-'.repeat(110))

  for (const result of report.results) {
    const statusIcon =
      result.status === 'passed'
        ? '✓'
        : result.status === 'failed'
          ? '✗'
          : result.status === 'skipped'
            ? '○'
            : '⚠'
    const status = `${statusIcon} ${result.status.toUpperCase()}`

    console.log(
      result.file.padEnd(40) +
        result.kind.padEnd(8) +
        (result.formatoDetectado || 'N/A').slice(0, 18).padEnd(20) +
        String(result.rowsExtracted).padEnd(6) +
        `${(result.yield * 100).toFixed(0)}%`.padEnd(8) +
        (result.competenciaDetectada || 'N/A').padEnd(10) +
        result.topSeverity.padEnd(8) +
        status
    )

    // Mostrar falhas
    if (result.failures.length > 0 && result.status !== 'skipped') {
      for (const failure of result.failures) {
        console.log(`    → ${failure}`)
      }
    }
  }

  console.log('='.repeat(110) + '\n')
}

// =============================================================================
// TESTES VITEST
// =============================================================================

describe('PrefeituraExtractor - Fixtures Runner', () => {
  // Agrupar por kind
  const csvTests = manifest.testCases.filter((tc) => tc.kind === 'csv')
  const textTests = manifest.testCases.filter((tc) => tc.kind === 'text')
  const xlsxTests = manifest.testCases.filter((tc) => tc.kind === 'xlsx')
  const pdfTests = manifest.testCases.filter((tc) => tc.kind === 'pdf')
  const docxTests = manifest.testCases.filter((tc) => tc.kind === 'docx')

  describe('CSV', () => {
    for (const testCase of csvTests) {
      it(testCase.description, async () => {
        const result = await runTestCase(testCase)
        testResults.push(result)

        if (result.status === 'skipped') {
          return // Test pulado é OK
        }

        expect(result.failures, `Falhas: ${result.failures.join(', ')}`).toHaveLength(0)
        expect(result.status).toBe('passed')
      })
    }
  })

  describe('Text (PDF/DOCX simulados)', () => {
    for (const testCase of textTests) {
      it(testCase.description, async () => {
        const result = await runTestCase(testCase)
        testResults.push(result)

        if (result.status === 'skipped') {
          return
        }

        expect(result.failures, `Falhas: ${result.failures.join(', ')}`).toHaveLength(0)
        expect(result.status).toBe('passed')
      })
    }
  })

  describe('XLSX', () => {
    for (const testCase of xlsxTests) {
      it(testCase.description, async () => {
        const result = await runTestCase(testCase)
        testResults.push(result)

        if (result.status === 'skipped') {
          return
        }

        expect(result.failures, `Falhas: ${result.failures.join(', ')}`).toHaveLength(0)
        expect(result.status).toBe('passed')
      })
    }
  })

  if (pdfTests.length > 0) {
    describe('PDF (binários)', () => {
      for (const testCase of pdfTests) {
        it(testCase.description, async () => {
          const result = await runTestCase(testCase)
          testResults.push(result)

          if (result.status === 'skipped') {
            return
          }

          expect(result.failures, `Falhas: ${result.failures.join(', ')}`).toHaveLength(0)
          expect(result.status).toBe('passed')
        })
      }
    })
  }

  if (docxTests.length > 0) {
    describe('DOCX (binários)', () => {
      for (const testCase of docxTests) {
        it(testCase.description, async () => {
          const result = await runTestCase(testCase)
          testResults.push(result)

          if (result.status === 'skipped') {
            return
          }

          expect(result.failures, `Falhas: ${result.failures.join(', ')}`).toHaveLength(0)
          expect(result.status).toBe('passed')
        })
      }
    })
  }

  // Relatório final
  afterAll(() => {
    if (testResults.length > 0) {
      const report = generateReport(testResults)
      printReport(report)
    }
  })
})
