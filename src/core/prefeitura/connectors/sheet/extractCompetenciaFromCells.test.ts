import { describe, it, expect } from 'vitest'
import { extractCompetenciaFromCells } from './extractCompetenciaFromCells'

describe('extractCompetenciaFromCells', () => {
  it('detecta competência no formato MM/AAAA', () => {
    const data: (string | number | null)[][] = [
      ['Relatório de Trabalhadores'],
      ['Período: 01/2026'],
      ['Matrícula', 'Valor'],
    ]

    const result = extractCompetenciaFromCells(data)
    expect(result).toBe('01/2026')
  })

  it('detecta competência no formato "Mês/Ano: MM/AAAA"', () => {
    const data: (string | number | null)[][] = [
      ['Relatório'],
      ['Mês/Ano: 12/2025'],
      ['Dados'],
    ]

    const result = extractCompetenciaFromCells(data)
    expect(result).toBe('12/2025')
  })

  it('detecta competência no formato compacto MMAAAA', () => {
    const data: (string | number | null)[][] = [
      ['Relatório - 012026'],
      ['Matrícula', 'Valor'],
    ]

    const result = extractCompetenciaFromCells(data)
    expect(result).toBe('01/2026')
  })

  it('retorna undefined quando não encontra competência', () => {
    const data: (string | number | null)[][] = [
      ['Relatório de Trabalhadores'],
      ['Matrícula', 'Valor'],
      ['123-1', 100],
    ]

    const result = extractCompetenciaFromCells(data)
    expect(result).toBeUndefined()
  })

  it('respeita o limite de linhas', () => {
    const data: (string | number | null)[][] = [
      ['Linha 1'],
      ['Linha 2'],
      ['Linha 3'],
      ['Linha 4'],
      ['Linha 5'],
      ['01/2026'], // Esta está na linha 6
    ]

    const result = extractCompetenciaFromCells(data, 5)
    expect(result).toBeUndefined()
  })

  it('encontra competência em célula numérica', () => {
    const data: (string | number | null)[][] = [
      ['Relatório'],
      [null, '01/2026', null],
    ]

    const result = extractCompetenciaFromCells(data)
    expect(result).toBe('01/2026')
  })

  it('ignora células null', () => {
    const data: (string | number | null)[][] = [
      [null, null, null],
      [null, '01/2026', null],
    ]

    const result = extractCompetenciaFromCells(data)
    expect(result).toBe('01/2026')
  })

  it('valida mês no formato compacto (01-12)', () => {
    const data: (string | number | null)[][] = [
      ['Código: 132026'], // 13 não é mês válido
    ]

    const result = extractCompetenciaFromCells(data)
    expect(result).toBeUndefined()
  })
})
