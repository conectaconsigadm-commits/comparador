import { describe, it, expect } from 'vitest'
import { parseTextReport } from './parseTextReport'

describe('parseTextReport', () => {
  describe('extração de matrícula e valor', () => {
    it('deve extrair matrícula e valor simples', () => {
      const text = '85-1  João da Silva  400,49'
      const result = parseTextReport(text)

      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].matricula).toBe('85-1')
      expect(result.rows[0].valor).toBe(400.49)
    })

    it('deve extrair matrícula com espaços no início da linha', () => {
      const text = '   9-1 EDIMAR FERREIRA SANTOS  0,00'
      const result = parseTextReport(text)

      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].matricula).toBe('9-1')
      expect(result.rows[0].valor).toBe(0)
    })

    it('deve extrair matrícula em qualquer posição da linha', () => {
      const text = 'Nome: João Matrícula 85-1 Valor 400,49'
      const result = parseTextReport(text)

      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].matricula).toBe('85-1')
    })

    it('deve escolher último valor não-zero quando há múltiplos', () => {
      const text = '85-1  Consignado  0,00  400,49'
      const result = parseTextReport(text)

      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].valor).toBe(400.49)
    })

    it('deve escolher último valor quando todos são zero', () => {
      const text = '85-1  Consignado  0,00  0,00'
      const result = parseTextReport(text)

      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].valor).toBe(0)
    })

    it('deve extrair múltiplas linhas', () => {
      const text = `
        85-1  João  400,49
        99-2  Maria  250,00
        123-1  Pedro  1.234,56
      `
      const result = parseTextReport(text)

      expect(result.rows).toHaveLength(3)
      expect(result.rows[0].matricula).toBe('85-1')
      expect(result.rows[1].matricula).toBe('99-2')
      expect(result.rows[2].matricula).toBe('123-1')
      expect(result.rows[2].valor).toBe(1234.56)
    })
  })

  describe('detecção de evento', () => {
    it('deve detectar evento e aplicar às linhas seguintes', () => {
      const text = `
        Evento: 002 - CONSIGNADO BB
        85-1  João  400,49
        99-1  Maria  250,00
        Evento: 003 - OUTRO
        123-1  Pedro  100,00
      `
      const result = parseTextReport(text)

      expect(result.rows).toHaveLength(3)
      expect(result.rows[0].meta?.evento).toBe('002')
      expect(result.rows[1].meta?.evento).toBe('002')
      expect(result.rows[2].meta?.evento).toBe('003')
      expect(result.eventosDetectados).toBe(2)
    })

    it('deve gerar warn se não encontrar evento', () => {
      const text = `
        85-1  João  400,49
      `
      const result = parseTextReport(text)

      const warn = result.diagnostics.find(
        (d) => d.code === 'TEXT_EVENT_NOT_FOUND'
      )
      expect(warn).toBeDefined()
      expect(warn?.severity).toBe('warn')
    })
  })

  describe('detecção de competência', () => {
    it('deve detectar competência no formato MM/AAAA', () => {
      const text = `
        Período: 01/2026
        85-1  João  400,49
      `
      const result = parseTextReport(text)

      expect(result.competencia).toBe('01/2026')
      expect(result.rows[0].meta?.competencia).toBe('01/2026')
    })

    it('deve detectar competência no formato compacto MMAAAA', () => {
      const text = `
        Competência: 012026
        85-1  João  400,49
      `
      const result = parseTextReport(text)

      expect(result.competencia).toBe('01/2026')
    })

    it('deve gerar warn se não encontrar competência', () => {
      const text = `
        85-1  João  400,49
      `
      const result = parseTextReport(text)

      const warn = result.diagnostics.find(
        (d) => d.code === 'TEXT_COMPETENCIA_NOT_FOUND'
      )
      expect(warn).toBeDefined()
      expect(warn?.severity).toBe('warn')
    })
  })

  describe('casos de erro', () => {
    it('deve retornar erro se não encontrar nenhuma linha válida', () => {
      const text = 'Texto sem matrículas ou valores'
      const result = parseTextReport(text)

      expect(result.rows).toHaveLength(0)
      const error = result.diagnostics.find(
        (d) => d.code === 'TEXT_ZERO_ROWS'
      )
      expect(error).toBeDefined()
      expect(error?.severity).toBe('error')
    })

    it('deve ignorar linhas com matrícula mas sem valor', () => {
      const text = `
        85-1  João sem valor
        99-1  Maria  400,49
      `
      const result = parseTextReport(text)

      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].matricula).toBe('99-1')
    })
  })

  describe('confidence', () => {
    it('deve marcar confidence high quando há apenas um valor', () => {
      const text = '85-1  João  400,49'
      const result = parseTextReport(text)

      expect(result.rows[0].meta?.confidence).toBe('high')
    })

    it('deve marcar confidence medium quando há múltiplos valores', () => {
      const text = '85-1  João  0,00  400,49'
      const result = parseTextReport(text)

      expect(result.rows[0].meta?.confidence).toBe('medium')
    })
  })

  describe('diagnóstico summary', () => {
    it('deve incluir summary com contagens', () => {
      const text = `
        01/2026
        Evento: 002
        85-1  João  400,49
        99-1  Maria  250,00
      `
      const result = parseTextReport(text)

      const summary = result.diagnostics.find(
        (d) => d.code === 'TEXT_PARSE_SUMMARY'
      )
      expect(summary).toBeDefined()
      expect(summary?.severity).toBe('info')
      expect(summary?.details?.extractedRows).toBe(2)
    })
  })
})
