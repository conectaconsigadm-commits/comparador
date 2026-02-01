import { describe, it, expect } from 'vitest'
import { splitCsvLine, splitCsvLineSafe, getCsvField } from './splitCsvLine'

describe('splitCsvLine', () => {
  describe('delimitador vírgula', () => {
    it('deve dividir linha simples', () => {
      const result = splitCsvLine('a,b,c', ',')
      expect(result).toEqual(['a', 'b', 'c'])
    })

    it('deve tratar campos vazios', () => {
      const result = splitCsvLine('a,,c', ',')
      expect(result).toEqual(['a', '', 'c'])
    })

    it('deve tratar campos com espaços', () => {
      const result = splitCsvLine(' a , b , c ', ',')
      expect(result).toEqual(['a', 'b', 'c'])
    })

    it('deve respeitar aspas duplas', () => {
      const result = splitCsvLine('a,"b,c",d', ',')
      expect(result).toEqual(['a', 'b,c', 'd'])
    })

    it('deve tratar aspas escapadas', () => {
      const result = splitCsvLine('a,"b""c",d', ',')
      expect(result).toEqual(['a', 'b"c', 'd'])
    })

    it('deve tratar valor monetário entre aspas', () => {
      const result = splitCsvLine('85-1,João,"1.234,56"', ',')
      expect(result).toEqual(['85-1', 'João', '1.234,56'])
    })
  })

  describe('delimitador ponto-e-vírgula', () => {
    it('deve dividir linha com ponto-e-vírgula', () => {
      const result = splitCsvLine('a;b;c', ';')
      expect(result).toEqual(['a', 'b', 'c'])
    })

    it('deve respeitar aspas com ponto-e-vírgula', () => {
      const result = splitCsvLine('a;"b;c";d', ';')
      expect(result).toEqual(['a', 'b;c', 'd'])
    })

    it('deve tratar valor monetário entre aspas com ponto-e-vírgula', () => {
      const result = splitCsvLine('100-1;FERNANDA;"500,00"', ';')
      expect(result).toEqual(['100-1', 'FERNANDA', '500,00'])
    })
  })

  describe('delimitador tab', () => {
    it('deve dividir linha com tab', () => {
      const result = splitCsvLine('a\tb\tc', '\t')
      expect(result).toEqual(['a', 'b', 'c'])
    })
  })

  describe('delimitador pipe', () => {
    it('deve dividir linha com pipe', () => {
      const result = splitCsvLine('a|b|c', '|')
      expect(result).toEqual(['a', 'b', 'c'])
    })
  })
})

describe('splitCsvLineSafe', () => {
  it('deve funcionar como splitCsvLine para casos normais', () => {
    const result = splitCsvLineSafe('a,b,c', ',')
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('deve retornar linha única se não tiver delimitador', () => {
    const result = splitCsvLineSafe('texto sem delimitador', ',')
    expect(result).toEqual(['texto sem delimitador'])
  })
})

describe('getCsvField', () => {
  it('deve retornar campo pelo índice', () => {
    expect(getCsvField('a,b,c', ',', 0)).toBe('a')
    expect(getCsvField('a,b,c', ',', 1)).toBe('b')
    expect(getCsvField('a,b,c', ',', 2)).toBe('c')
  })

  it('deve retornar undefined para índice inválido', () => {
    expect(getCsvField('a,b,c', ',', 3)).toBeUndefined()
    expect(getCsvField('a,b,c', ',', -1)).toBeUndefined()
  })

  it('deve funcionar com ponto-e-vírgula', () => {
    expect(getCsvField('x;y;z', ';', 1)).toBe('y')
  })
})
