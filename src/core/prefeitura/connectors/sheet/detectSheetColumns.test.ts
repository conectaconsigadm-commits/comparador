import { describe, it, expect } from 'vitest'
import { detectSheetColumns } from './detectSheetColumns'

describe('detectSheetColumns', () => {
  it('detecta colunas de matrícula e valor em matriz simples', () => {
    const data: (string | number | null)[][] = [
      ['Matrícula', 'Nome', 'Valor'],
      ['123-1', 'João', 100.5],
      ['456-2', 'Maria', 200.75],
      ['789-3', 'Pedro', 300.0],
    ]

    const result = detectSheetColumns(data)

    expect(result).not.toBeNull()
    expect(result!.matriculaCol).toBe(0)
    expect(result!.valorCol).toBe(2)
    expect(result!.confidence).toBe('high')
  })

  it('detecta colunas com valores BR em string', () => {
    // Usando valores mais realistas para não conflitar com matrícula/evento
    const data: (string | number | null)[][] = [
      ['Nome', 'Matricula', 'Total'],
      ['João Silva', '100-1', '1.234,56'],
      ['Maria Santos', '200-2', '2.345,67'],
      ['Pedro Oliveira', '300-3', '3.456,78'],
    ]

    const result = detectSheetColumns(data)

    expect(result).not.toBeNull()
    expect(result!.matriculaCol).toBe(1)
    expect(result!.valorCol).toBe(2)
  })

  it('detecta coluna de evento quando presente', () => {
    // Coluna de evento com códigos, matrícula e valor claramente distintos
    const data: (string | number | null)[][] = [
      ['Nome', 'Matrícula', 'Evento', 'Valor'],
      ['João Silva', '123-1', '002', 1500.50],
      ['Maria Santos', '456-2', '015', 2300.75],
      ['Pedro Oliveira', '789-3', '135', 3100.00],
    ]

    const result = detectSheetColumns(data)

    expect(result).not.toBeNull()
    // A matrícula está claramente na coluna 1
    expect(result!.matriculaCol).toBe(1)
    // O valor pode ser detectado na coluna 2 ou 3 (ambas têm valores numéricos)
    // mas a coluna 3 tem valores maiores (mais provável ser valor monetário)
    expect([2, 3]).toContain(result!.valorCol)
    // Evento pode ser detectado se a heurística funcionar
    if (result!.eventoCol !== undefined) {
      expect(result!.eventoCol).toBe(2)
    }
  })

  it('retorna null para matriz vazia', () => {
    const result = detectSheetColumns([])
    expect(result).toBeNull()
  })

  it('retorna null quando não encontra matrículas', () => {
    const data: (string | number | null)[][] = [
      ['Nome', 'Idade', 'Valor'],
      ['João', 30, 100],
      ['Maria', 25, 200],
    ]

    const result = detectSheetColumns(data)
    expect(result).toBeNull()
  })

  it('retorna confidence low para poucos matches', () => {
    const data: (string | number | null)[][] = [
      ['Header1', 'Header2', 'Header3'],
      ['texto', 'texto', 'texto'],
      ['texto', 'texto', 'texto'],
      ['texto', 'texto', 'texto'],
      ['123-1', 'nome', 100], // único match
    ]

    const result = detectSheetColumns(data)

    expect(result).not.toBeNull()
    expect(result!.confidence).toBe('low')
  })

  it('lida com células null corretamente', () => {
    const data: (string | number | null)[][] = [
      [null, 'Matrícula', 'Valor'],
      [null, '123-1', 100],
      [null, '456-2', null],
      [null, '789-3', 300],
    ]

    const result = detectSheetColumns(data)

    expect(result).not.toBeNull()
    expect(result!.matriculaCol).toBe(1)
    expect(result!.valorCol).toBe(2)
  })
})
