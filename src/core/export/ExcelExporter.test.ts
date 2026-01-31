import { describe, it, expect } from 'vitest'
import { ExcelExporter } from './ExcelExporter'
import type { ReconciliationResult } from '../domain/types'

describe('ExcelExporter', () => {
  const exporter = new ExcelExporter()

  // ReconciliationResult fake mínimo para testes
  const fakeResult: ReconciliationResult = {
    summary: {
      competencia: '01/2026',
      extracao: 'completa',
      counts: {
        bateu: 2,
        so_no_banco: 1,
        so_na_prefeitura: 1,
        divergente: 1,
        diagnostico: 0,
      },
      taxaMatch: 40,
    },
    items: [
      {
        matricula: '85-1',
        valorBanco: 100,
        valorPrefeitura: 100,
        status: 'bateu',
      },
      {
        matricula: '99-1',
        valorBanco: 200,
        valorPrefeitura: 200,
        status: 'bateu',
      },
      {
        matricula: '100-1',
        valorBanco: 300,
        status: 'so_no_banco',
      },
      {
        matricula: '101-1',
        valorPrefeitura: 400,
        status: 'so_na_prefeitura',
      },
      {
        matricula: '102-1',
        valorBanco: 500,
        valorPrefeitura: 550,
        status: 'divergente',
        obs: 'Diferença: -50.00',
      },
    ],
    diagnostics: [
      {
        severity: 'info',
        code: 'test_diag',
        message: 'Diagnóstico de teste',
        details: { foo: 'bar', count: 42 },
      },
    ],
  }

  describe('export', () => {
    it('deve retornar um Blob', async () => {
      const blob = await exporter.export(fakeResult)

      expect(blob).toBeInstanceOf(Blob)
    })

    it('deve retornar Blob com tamanho > 0', async () => {
      const blob = await exporter.export(fakeResult)

      expect(blob.size).toBeGreaterThan(0)
    })

    it('deve ter o MIME type correto para xlsx', async () => {
      const blob = await exporter.export(fakeResult)

      expect(blob.type).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
    })

    it('deve funcionar com resultado vazio', async () => {
      const emptyResult: ReconciliationResult = {
        summary: {
          extracao: 'falhou',
          counts: {
            bateu: 0,
            so_no_banco: 0,
            so_na_prefeitura: 0,
            divergente: 0,
            diagnostico: 0,
          },
        },
        items: [],
        diagnostics: [],
      }

      const blob = await exporter.export(emptyResult)

      expect(blob.size).toBeGreaterThan(0)
    })

    it('deve funcionar com diagnóstico sem details', async () => {
      const resultWithSimpleDiag: ReconciliationResult = {
        ...fakeResult,
        diagnostics: [
          {
            severity: 'warn',
            code: 'simple',
            message: 'Sem detalhes',
          },
        ],
      }

      const blob = await exporter.export(resultWithSimpleDiag)

      expect(blob.size).toBeGreaterThan(0)
    })
  })

  describe('validação de conteúdo (via buffer)', () => {
    it('deve gerar arquivo xlsx válido', async () => {
      const blob = await exporter.export(fakeResult)

      // Xlsx começa com PK (zip signature)
      const buffer = await blob.arrayBuffer()
      const bytes = new Uint8Array(buffer)

      // ZIP magic number: PK (0x50, 0x4B)
      expect(bytes[0]).toBe(0x50) // 'P'
      expect(bytes[1]).toBe(0x4b) // 'K'
    })
  })
})
