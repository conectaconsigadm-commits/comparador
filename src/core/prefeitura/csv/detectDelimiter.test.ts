import { describe, it, expect } from 'vitest'
import { detectDelimiter, detectDelimiterFromText } from './detectDelimiter'

describe('detectDelimiter', () => {
  describe('detecta vírgula', () => {
    it('deve detectar vírgula em CSV padrão', () => {
      const lines = [
        'Nome,Idade,Cidade',
        'João,30,São Paulo',
        'Maria,25,Rio de Janeiro',
      ]
      const result = detectDelimiter(lines)
      expect(result.delimiter).toBe(',')
      // 2 vírgulas por linha = medium (high requer >3)
      expect(result.confidence).toBe('medium')
    })

    it('deve ignorar vírgulas dentro de aspas', () => {
      const lines = [
        'Nome,Endereço,Valor',
        'João,"Rua A, 123",100',
        'Maria,"Av B, 456",200',
      ]
      const result = detectDelimiter(lines)
      expect(result.delimiter).toBe(',')
      // Deve contar apenas as vírgulas fora das aspas
      expect(result.avgCount).toBeCloseTo(2, 0) // 2 vírgulas por linha em média
    })
  })

  describe('detecta ponto-e-vírgula', () => {
    it('deve detectar ponto-e-vírgula', () => {
      const lines = [
        'Nome;Idade;Cidade',
        'João;30;São Paulo',
        'Maria;25;Rio de Janeiro',
      ]
      const result = detectDelimiter(lines)
      expect(result.delimiter).toBe(';')
      // 2 ponto-e-vírgula por linha = medium (high requer >3)
      expect(result.confidence).toBe('medium')
    })

    it('deve preferir ponto-e-vírgula quando há mais ocorrências', () => {
      const lines = [
        ';;PREFEITURA;;;;;;',
        'Mat;Nome;CPF;Valor',
        '100-1;João;111.222.333-44;"500,00"',
      ]
      const result = detectDelimiter(lines)
      expect(result.delimiter).toBe(';')
    })
  })

  describe('detecta tab', () => {
    it('deve detectar tab', () => {
      const lines = [
        'Nome\tIdade\tCidade',
        'João\t30\tSão Paulo',
        'Maria\t25\tRio',
      ]
      const result = detectDelimiter(lines)
      expect(result.delimiter).toBe('\t')
    })
  })

  describe('detecta pipe', () => {
    it('deve detectar pipe', () => {
      const lines = [
        'Nome|Idade|Cidade',
        'João|30|São Paulo',
        'Maria|25|Rio',
      ]
      const result = detectDelimiter(lines)
      expect(result.delimiter).toBe('|')
    })
  })

  describe('fallback', () => {
    it('deve retornar vírgula como fallback para linhas vazias', () => {
      const result = detectDelimiter([])
      expect(result.delimiter).toBe(',')
      expect(result.confidence).toBe('low')
    })

    it('deve retornar vírgula como fallback para texto sem delimitador', () => {
      const lines = [
        'Apenas texto sem delimitador',
        'Outra linha de texto',
      ]
      const result = detectDelimiter(lines)
      expect(result.delimiter).toBe(',')
      expect(result.confidence).toBe('low')
    })
  })

  describe('detectDelimiterFromText', () => {
    it('deve funcionar com texto completo', () => {
      const text = 'Nome;Idade;Cidade\nJoão;30;SP\nMaria;25;RJ'
      const result = detectDelimiterFromText(text)
      expect(result.delimiter).toBe(';')
    })

    it('deve lidar com quebras de linha Windows (CRLF)', () => {
      const text = 'Nome;Idade;Cidade\r\nJoão;30;SP\r\nMaria;25;RJ'
      const result = detectDelimiterFromText(text)
      expect(result.delimiter).toBe(';')
    })
  })
})
