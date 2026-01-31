import { describe, it, expect } from 'vitest'
import { Reconciler } from './Reconciler'
import type { NormalizedRow } from '../domain/types'

// Helper para criar rows de teste
function createRow(
  source: 'banco' | 'prefeitura',
  matricula: string,
  valor: number,
  competencia?: string
): NormalizedRow {
  return {
    source,
    matricula,
    valor,
    meta: { competencia, confidence: 'high' },
  }
}

describe('Reconciler', () => {
  const reconciler = new Reconciler()

  describe('caso simples 1x1 (bateu)', () => {
    it('deve marcar como bateu quando valores são iguais', () => {
      const bank = [createRow('banco', '85-1', 400.49)]
      const pref = [createRow('prefeitura', '85-1', 400.49)]

      const result = reconciler.reconcile(bank, pref)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].status).toBe('bateu')
      expect(result.items[0].valorBanco).toBe(400.49)
      expect(result.items[0].valorPrefeitura).toBe(400.49)
      expect(result.summary.counts.bateu).toBe(1)
    })

    it('deve ter taxaMatch de 100% quando tudo bate', () => {
      const bank = [createRow('banco', '85-1', 100)]
      const pref = [createRow('prefeitura', '85-1', 100)]

      const result = reconciler.reconcile(bank, pref)

      expect(result.summary.taxaMatch).toBe(100)
    })
  })

  describe('tolerância de 0.01', () => {
    it('deve aceitar diferença de 0.01 como bateu', () => {
      const bank = [createRow('banco', '85-1', 100.00)]
      const pref = [createRow('prefeitura', '85-1', 100.01)]

      const result = reconciler.reconcile(bank, pref)

      expect(result.items[0].status).toBe('bateu')
    })

    it('deve aceitar diferença de -0.01 como bateu', () => {
      const bank = [createRow('banco', '85-1', 100.01)]
      const pref = [createRow('prefeitura', '85-1', 100.00)]

      const result = reconciler.reconcile(bank, pref)

      expect(result.items[0].status).toBe('bateu')
    })

    it('deve marcar como divergente se diferença > 0.01', () => {
      const bank = [createRow('banco', '85-1', 100.00)]
      const pref = [createRow('prefeitura', '85-1', 100.02)]

      const result = reconciler.reconcile(bank, pref)

      expect(result.items[0].status).toBe('divergente')
    })
  })

  describe('duplicidade (2 valores iguais)', () => {
    it('deve parear corretamente 2 valores iguais', () => {
      const bank = [
        createRow('banco', '85-1', 100),
        createRow('banco', '85-1', 100),
      ]
      const pref = [
        createRow('prefeitura', '85-1', 100),
        createRow('prefeitura', '85-1', 100),
      ]

      const result = reconciler.reconcile(bank, pref)

      expect(result.items.filter((i) => i.status === 'bateu')).toHaveLength(2)
      expect(result.summary.counts.bateu).toBe(2)
    })

    it('deve lidar com duplicidade parcial (2 banco, 1 pref)', () => {
      const bank = [
        createRow('banco', '85-1', 100),
        createRow('banco', '85-1', 100),
      ]
      const pref = [createRow('prefeitura', '85-1', 100)]

      const result = reconciler.reconcile(bank, pref)

      expect(result.items.filter((i) => i.status === 'bateu')).toHaveLength(1)
      expect(result.items.filter((i) => i.status === 'so_no_banco')).toHaveLength(1)
    })

    it('deve lidar com valores diferentes na mesma matrícula', () => {
      const bank = [
        createRow('banco', '85-1', 100),
        createRow('banco', '85-1', 200),
      ]
      const pref = [
        createRow('prefeitura', '85-1', 100),
        createRow('prefeitura', '85-1', 200),
      ]

      const result = reconciler.reconcile(bank, pref)

      expect(result.items.filter((i) => i.status === 'bateu')).toHaveLength(2)
    })
  })

  describe('sobras só no banco', () => {
    it('deve marcar como so_no_banco quando não existe na prefeitura', () => {
      const bank = [createRow('banco', '85-1', 100)]
      const pref: NormalizedRow[] = []

      const result = reconciler.reconcile(bank, pref)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].status).toBe('so_no_banco')
      expect(result.items[0].valorBanco).toBe(100)
      expect(result.items[0].valorPrefeitura).toBeUndefined()
    })

    it('deve marcar múltiplas sobras corretamente', () => {
      const bank = [
        createRow('banco', '85-1', 100),
        createRow('banco', '85-1', 200),
        createRow('banco', '99-1', 300),
      ]
      const pref: NormalizedRow[] = []

      const result = reconciler.reconcile(bank, pref)

      expect(result.summary.counts.so_no_banco).toBe(3)
    })
  })

  describe('sobras só na prefeitura', () => {
    it('deve marcar como so_na_prefeitura quando não existe no banco', () => {
      const bank: NormalizedRow[] = []
      const pref = [createRow('prefeitura', '85-1', 100)]

      const result = reconciler.reconcile(bank, pref)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].status).toBe('so_na_prefeitura')
      expect(result.items[0].valorPrefeitura).toBe(100)
      expect(result.items[0].valorBanco).toBeUndefined()
    })
  })

  describe('divergência', () => {
    it('deve marcar como divergente quando valores não casam', () => {
      const bank = [createRow('banco', '85-1', 100)]
      const pref = [createRow('prefeitura', '85-1', 150)]

      const result = reconciler.reconcile(bank, pref)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].status).toBe('divergente')
      expect(result.items[0].valorBanco).toBe(100)
      expect(result.items[0].valorPrefeitura).toBe(150)
      expect(result.items[0].obs).toContain('-50')
    })

    it('deve parear divergências por proximidade', () => {
      const bank = [
        createRow('banco', '85-1', 100),
        createRow('banco', '85-1', 200),
      ]
      const pref = [
        createRow('prefeitura', '85-1', 105),
        createRow('prefeitura', '85-1', 210),
      ]

      const result = reconciler.reconcile(bank, pref)

      // Deve parear 100 com 105 e 200 com 210
      const divergentes = result.items.filter((i) => i.status === 'divergente')
      expect(divergentes).toHaveLength(2)
    })

    it('deve ter taxaMatch de 0% quando nada bate', () => {
      const bank = [createRow('banco', '85-1', 100)]
      const pref = [createRow('prefeitura', '85-1', 200)]

      const result = reconciler.reconcile(bank, pref)

      expect(result.summary.taxaMatch).toBe(0)
    })
  })

  describe('múltiplas matrículas', () => {
    it('deve processar múltiplas matrículas corretamente', () => {
      const bank = [
        createRow('banco', '85-1', 100),
        createRow('banco', '99-1', 200),
        createRow('banco', '100-1', 300),
      ]
      const pref = [
        createRow('prefeitura', '85-1', 100),
        createRow('prefeitura', '99-1', 200),
      ]

      const result = reconciler.reconcile(bank, pref)

      expect(result.summary.counts.bateu).toBe(2)
      expect(result.summary.counts.so_no_banco).toBe(1)
    })
  })

  describe('competência', () => {
    it('deve detectar competência mais frequente', () => {
      const bank = [
        createRow('banco', '85-1', 100, '01/2026'),
        createRow('banco', '99-1', 200, '01/2026'),
      ]
      const pref = [
        createRow('prefeitura', '85-1', 100, '01/2026'),
      ]

      const result = reconciler.reconcile(bank, pref)

      expect(result.summary.competencia).toBe('01/2026')
    })
  })

  describe('qualidade da extração', () => {
    it('deve retornar falhou quando prefeitura está vazia', () => {
      const bank = [createRow('banco', '85-1', 100)]
      const pref: NormalizedRow[] = []

      const result = reconciler.reconcile(bank, pref)

      expect(result.summary.extracao).toBe('falhou')
    })

    it('deve retornar completa quando tem dados', () => {
      const bank = [createRow('banco', '85-1', 100)]
      const pref = [createRow('prefeitura', '85-1', 100)]

      const result = reconciler.reconcile(bank, pref)

      expect(result.summary.extracao).toBe('completa')
    })
  })

  describe('diagnósticos', () => {
    it('deve incluir diagnóstico de resumo', () => {
      const bank = [createRow('banco', '85-1', 100)]
      const pref = [createRow('prefeitura', '85-1', 100)]

      const result = reconciler.reconcile(bank, pref)

      const summary = result.diagnostics.find(
        (d) => d.code === 'reconcile_summary'
      )
      expect(summary).toBeDefined()
      expect(summary?.severity).toBe('info')
    })
  })

  describe('cenário complexo', () => {
    it('deve lidar com mix de bateu, divergente e sobras', () => {
      const bank = [
        createRow('banco', '85-1', 100),   // bateu
        createRow('banco', '85-1', 200),   // bateu
        createRow('banco', '99-1', 300),   // divergente
        createRow('banco', '100-1', 400),  // so_no_banco
      ]
      const pref = [
        createRow('prefeitura', '85-1', 100),   // bateu
        createRow('prefeitura', '85-1', 200),   // bateu
        createRow('prefeitura', '99-1', 350),   // divergente
        createRow('prefeitura', '101-1', 500),  // so_na_prefeitura
      ]

      const result = reconciler.reconcile(bank, pref)

      expect(result.summary.counts.bateu).toBe(2)
      expect(result.summary.counts.divergente).toBe(1)
      expect(result.summary.counts.so_no_banco).toBe(1)
      expect(result.summary.counts.so_na_prefeitura).toBe(1)
      expect(result.items).toHaveLength(5)
    })
  })
})
