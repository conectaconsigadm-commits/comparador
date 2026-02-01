import { describe, it, expect } from 'vitest'
import {
  groupDiagnostics,
  getTopSeverity,
  hasCriticalErrors,
  filterDiagnostics,
  formatDiagnosticForClipboard,
  truncateText,
  formatDetailsPreview,
  severityOrder,
} from './groupDiagnostics'
import type { DiagnosticsItem } from '../../core/domain/types'

// ─────────────────────────────────────────────────────────────
// FIXTURES
// ─────────────────────────────────────────────────────────────

const sampleDiagnostics: DiagnosticsItem[] = [
  { severity: 'info', code: 'INFO_CODE_1', message: 'Informational message' },
  { severity: 'warn', code: 'WARN_CODE_1', message: 'Warning message' },
  { severity: 'error', code: 'ERROR_CODE_1', message: 'Error message' },
  { severity: 'warn', code: 'WARN_CODE_1', message: 'Another warning' },
  { severity: 'info', code: 'INFO_CODE_2', message: 'Another info', details: { lineNo: 5 } },
  {
    severity: 'error',
    code: 'PARSE_ERROR',
    message: 'Parse error critical',
    details: { line: 10, raw: 'some raw data' },
  },
]

// ─────────────────────────────────────────────────────────────
// TESTES: severityOrder
// ─────────────────────────────────────────────────────────────

describe('severityOrder', () => {
  it('ordena error como 0', () => {
    expect(severityOrder('error')).toBe(0)
  })

  it('ordena warn como 1', () => {
    expect(severityOrder('warn')).toBe(1)
  })

  it('ordena info como 2', () => {
    expect(severityOrder('info')).toBe(2)
  })
})

// ─────────────────────────────────────────────────────────────
// TESTES: groupDiagnostics
// ─────────────────────────────────────────────────────────────

describe('groupDiagnostics', () => {
  it('agrupa por code e severity', () => {
    const result = groupDiagnostics(sampleDiagnostics)
    const warnGroup = result.find((g) => g.code === 'WARN_CODE_1')
    expect(warnGroup).toBeDefined()
    expect(warnGroup?.count).toBe(2)
  })

  it('ordena error > warn > info', () => {
    const result = groupDiagnostics(sampleDiagnostics)
    expect(result[0].severity).toBe('error')
    expect(result[result.length - 1].severity).toBe('info')
  })

  it('respeita o limite', () => {
    const result = groupDiagnostics(sampleDiagnostics, 2)
    expect(result.length).toBe(2)
  })
})

// ─────────────────────────────────────────────────────────────
// TESTES: getTopSeverity
// ─────────────────────────────────────────────────────────────

describe('getTopSeverity', () => {
  it('retorna error se existir', () => {
    expect(getTopSeverity(sampleDiagnostics)).toBe('error')
  })

  it('retorna warn se não houver error', () => {
    const diags = sampleDiagnostics.filter((d) => d.severity !== 'error')
    expect(getTopSeverity(diags)).toBe('warn')
  })

  it('retorna info se não houver error/warn', () => {
    const diags = sampleDiagnostics.filter((d) => d.severity === 'info')
    expect(getTopSeverity(diags)).toBe('info')
  })

  it('retorna null para lista vazia', () => {
    expect(getTopSeverity([])).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────
// TESTES: hasCriticalErrors
// ─────────────────────────────────────────────────────────────

describe('hasCriticalErrors', () => {
  it('retorna true se houver erro crítico', () => {
    expect(hasCriticalErrors(sampleDiagnostics)).toBe(true) // PARSE_ERROR
  })

  it('retorna false se não houver erro crítico', () => {
    const diags = sampleDiagnostics.filter((d) => d.code !== 'PARSE_ERROR')
    expect(hasCriticalErrors(diags)).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────
// TESTES: filterDiagnostics
// ─────────────────────────────────────────────────────────────

describe('filterDiagnostics', () => {
  it('filtra por severity', () => {
    const result = filterDiagnostics(sampleDiagnostics, 'error')
    expect(result.length).toBe(2)
    expect(result.every((d) => d.severity === 'error')).toBe(true)
  })

  it('retorna todos com severity=all', () => {
    const result = filterDiagnostics(sampleDiagnostics, 'all')
    expect(result.length).toBe(sampleDiagnostics.length)
  })

  it('filtra por busca no code', () => {
    const result = filterDiagnostics(sampleDiagnostics, 'all', 'WARN_CODE')
    expect(result.length).toBe(2)
  })

  it('filtra por busca na message', () => {
    const result = filterDiagnostics(sampleDiagnostics, 'all', 'critical')
    expect(result.length).toBe(1)
    expect(result[0].code).toBe('PARSE_ERROR')
  })

  it('filtra por busca nos details', () => {
    const result = filterDiagnostics(sampleDiagnostics, 'all', 'lineNo')
    expect(result.length).toBe(1)
    expect(result[0].code).toBe('INFO_CODE_2')
  })

  it('combina severity e busca', () => {
    const result = filterDiagnostics(sampleDiagnostics, 'warn', 'Another')
    expect(result.length).toBe(1)
    expect(result[0].message).toBe('Another warning')
  })

  it('ordena resultado: error > warn > info, depois por code', () => {
    const result = filterDiagnostics(sampleDiagnostics, 'all')
    // Primeiro deve ser error
    expect(result[0].severity).toBe('error')
    // Último deve ser info
    expect(result[result.length - 1].severity).toBe('info')
  })

  it('busca é case-insensitive', () => {
    const result = filterDiagnostics(sampleDiagnostics, 'all', 'INFORMATIONAL')
    expect(result.length).toBe(1)
  })
})

// ─────────────────────────────────────────────────────────────
// TESTES: formatDiagnosticForClipboard
// ─────────────────────────────────────────────────────────────

describe('formatDiagnosticForClipboard', () => {
  it('formata diagnóstico simples como JSON', () => {
    const diag: DiagnosticsItem = {
      severity: 'warn',
      code: 'TEST_CODE',
      message: 'Test message',
    }
    const result = formatDiagnosticForClipboard(diag)
    const parsed = JSON.parse(result)
    expect(parsed.severity).toBe('warn')
    expect(parsed.code).toBe('TEST_CODE')
    expect(parsed.message).toBe('Test message')
    expect(parsed.details).toBeUndefined()
  })

  it('inclui details quando presente', () => {
    const diag: DiagnosticsItem = {
      severity: 'error',
      code: 'ERROR_CODE',
      message: 'Error message',
      details: { line: 10, value: 'test' },
    }
    const result = formatDiagnosticForClipboard(diag)
    const parsed = JSON.parse(result)
    expect(parsed.details).toEqual({ line: 10, value: 'test' })
  })

  it('retorna JSON formatado (pretty)', () => {
    const diag: DiagnosticsItem = {
      severity: 'info',
      code: 'INFO',
      message: 'Info',
    }
    const result = formatDiagnosticForClipboard(diag)
    expect(result).toContain('\n') // Multiline
  })
})

// ─────────────────────────────────────────────────────────────
// TESTES: truncateText
// ─────────────────────────────────────────────────────────────

describe('truncateText', () => {
  it('não trunca texto curto', () => {
    expect(truncateText('short', 10)).toBe('short')
  })

  it('trunca texto longo com ...', () => {
    const result = truncateText('this is a very long text', 10)
    expect(result).toBe('this is...')
    expect(result.length).toBe(10)
  })

  it('usa limite padrão de 80', () => {
    const longText = 'a'.repeat(100)
    const result = truncateText(longText)
    expect(result.length).toBe(80)
    expect(result.endsWith('...')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────
// TESTES: formatDetailsPreview
// ─────────────────────────────────────────────────────────────

describe('formatDetailsPreview', () => {
  it('retorna — para undefined', () => {
    expect(formatDetailsPreview(undefined)).toBe('—')
  })

  it('retorna — para objeto vazio', () => {
    expect(formatDetailsPreview({})).toBe('—')
  })

  it('formata objeto simples', () => {
    const result = formatDetailsPreview({ line: 10, value: 'test' })
    expect(result).toContain('line: 10')
    expect(result).toContain('value: test')
  })

  it('limita a 3 campos', () => {
    const result = formatDetailsPreview({
      a: 1,
      b: 2,
      c: 3,
      d: 4,
      e: 5,
    })
    expect(result).toContain('...')
  })

  it('trunca valores longos', () => {
    const result = formatDetailsPreview({
      longValue: 'this is a very long value that should be truncated',
    })
    expect(result.length).toBeLessThanOrEqual(60)
  })
})
