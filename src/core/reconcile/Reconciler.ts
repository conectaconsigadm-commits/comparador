import type {
  NormalizedRow,
  ReconciliationResult,
  ReconciliationItem,
  ReconciliationSummary,
  DiagnosticsItem,
  Money,
} from '../domain/types'

/** Tolerância para comparação de valores (1 centavo) */
const TOLERANCE = 0.01

/**
 * Reconciliador de dados Banco × Prefeitura
 *
 * Estratégia:
 * - Agrupa por matrícula
 * - Match por valor com tolerância de 0.01
 * - Suporta duplicidades (multiconjunto)
 * - Não usa evento para match (apenas para diagnóstico)
 */
export class Reconciler {
  /**
   * Reconcilia dados do banco com dados da prefeitura
   * @param bankRows Linhas normalizadas do banco
   * @param prefRows Linhas normalizadas da prefeitura
   * @returns Resultado da reconciliação com summary, items e diagnostics
   */
  reconcile(
    bankRows: NormalizedRow[],
    prefRows: NormalizedRow[]
  ): ReconciliationResult {
    const diagnostics: DiagnosticsItem[] = []
    const items: ReconciliationItem[] = []

    // Contadores
    let bateuCount = 0
    let soNoBancoCount = 0
    let soNaPrefeituraCount = 0
    let divergenteCount = 0

    // Agrupar por matrícula
    const bankByMatricula = this.groupByMatricula(bankRows)
    const prefByMatricula = this.groupByMatricula(prefRows)

    // Coletar todas as matrículas únicas
    const todasMatriculas = new Set([
      ...bankByMatricula.keys(),
      ...prefByMatricula.keys(),
    ])

    // Processar cada matrícula
    for (const matricula of todasMatriculas) {
      const valoresBanco = bankByMatricula.get(matricula) || []
      const valoresPref = prefByMatricula.get(matricula) || []

      // Clonar arrays para manipulação (multiconjunto)
      const bancoPendente = [...valoresBanco]
      const prefPendente = [...valoresPref]

      // Fase 1: Match exato (com tolerância)
      for (let i = bancoPendente.length - 1; i >= 0; i--) {
        const valorBanco = bancoPendente[i]

        // Buscar match na prefeitura
        // Usar arredondamento para evitar problemas de ponto flutuante
        const matchIndex = prefPendente.findIndex((v) => {
          const diff = Math.abs(v - valorBanco)
          // Arredondar para 2 casas decimais antes de comparar
          return Math.round(diff * 100) / 100 <= TOLERANCE
        })

        if (matchIndex !== -1) {
          const valorPref = prefPendente[matchIndex]

          items.push({
            matricula,
            valorBanco,
            valorPrefeitura: valorPref,
            status: 'bateu',
          })
          bateuCount++

          // Consumir dos pendentes
          bancoPendente.splice(i, 1)
          prefPendente.splice(matchIndex, 1)
        }
      }

      // Fase 2: Sobras - tentar parear divergências
      if (bancoPendente.length > 0 && prefPendente.length > 0) {
        // Ordenar por valor para parear por proximidade
        bancoPendente.sort((a, b) => a - b)
        prefPendente.sort((a, b) => a - b)

        // Parear por índice (divergentes)
        const pairsCount = Math.min(bancoPendente.length, prefPendente.length)

        for (let i = 0; i < pairsCount; i++) {
          const valorBanco = bancoPendente[i]
          const valorPref = prefPendente[i]
          const diff = valorBanco - valorPref

          items.push({
            matricula,
            valorBanco,
            valorPrefeitura: valorPref,
            status: 'divergente',
            obs: `Diferença: R$ ${diff >= 0 ? '+' : ''}${diff.toFixed(2)}`,
          })
          divergenteCount++
        }

        // Remover os pareados
        bancoPendente.splice(0, pairsCount)
        prefPendente.splice(0, pairsCount)
      }

      // Fase 3: Sobras finais do banco
      for (const valor of bancoPendente) {
        items.push({
          matricula,
          valorBanco: valor,
          status: 'so_no_banco',
        })
        soNoBancoCount++
      }

      // Fase 4: Sobras finais da prefeitura
      for (const valor of prefPendente) {
        items.push({
          matricula,
          valorPrefeitura: valor,
          status: 'so_na_prefeitura',
        })
        soNaPrefeituraCount++
      }
    }

    // Ordenar items por matrícula (numérica) e status
    items.sort((a, b) => {
      const [aBase] = a.matricula.split('-').map(Number)
      const [bBase] = b.matricula.split('-').map(Number)
      if (aBase !== bBase) return aBase - bBase
      return a.status.localeCompare(b.status)
    })

    // Determinar competência mais frequente
    const competencia = this.detectCompetencia([...bankRows, ...prefRows])

    // Determinar qualidade da extração
    const extracao = this.detectExtracaoQualidade(prefRows, diagnostics)

    // Calcular taxa de match
    // taxaMatch = bateu / totalItems (excluindo diagnostico)
    const totalItems =
      bateuCount + divergenteCount + soNoBancoCount + soNaPrefeituraCount
    const taxaMatch = totalItems > 0 ? (bateuCount / totalItems) * 100 : 0

    // Criar summary
    const summary: ReconciliationSummary = {
      competencia,
      extracao,
      counts: {
        bateu: bateuCount,
        so_no_banco: soNoBancoCount,
        so_na_prefeitura: soNaPrefeituraCount,
        divergente: divergenteCount,
        diagnostico: 0, // Não temos itens de diagnóstico nesta implementação
      },
      taxaMatch: Math.round(taxaMatch * 100) / 100,
    }

    // Diagnóstico de resumo
    diagnostics.push({
      severity: 'info',
      code: 'reconcile_summary',
      message: `Reconciliação: ${bateuCount} bateram, ${divergenteCount} divergentes, ${soNoBancoCount} só banco, ${soNaPrefeituraCount} só prefeitura`,
      details: {
        totalMatriculas: todasMatriculas.size,
        totalBankRows: bankRows.length,
        totalPrefRows: prefRows.length,
        totalItems,
        taxaMatch: summary.taxaMatch,
      },
    })

    return { summary, items, diagnostics }
  }

  /**
   * Agrupa rows por matrícula, extraindo apenas os valores
   */
  private groupByMatricula(rows: NormalizedRow[]): Map<string, Money[]> {
    const map = new Map<string, Money[]>()

    for (const row of rows) {
      const existing = map.get(row.matricula) || []
      existing.push(row.valor)
      map.set(row.matricula, existing)
    }

    return map
  }

  /**
   * Detecta competência mais frequente
   */
  private detectCompetencia(rows: NormalizedRow[]): string | undefined {
    const counts: Record<string, number> = {}

    for (const row of rows) {
      if (row.meta?.competencia) {
        counts[row.meta.competencia] = (counts[row.meta.competencia] || 0) + 1
      }
    }

    let maxCount = 0
    let competencia: string | undefined

    for (const [comp, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count
        competencia = comp
      }
    }

    return competencia
  }

  /**
   * Detecta qualidade da extração
   */
  private detectExtracaoQualidade(
    prefRows: NormalizedRow[],
    diagnostics: DiagnosticsItem[]
  ): 'completa' | 'parcial' | 'falhou' {
    // Se não tem rows da prefeitura, falhou
    if (prefRows.length === 0) {
      return 'falhou'
    }

    // Se tem diagnóstico de erro, parcial
    const hasError = diagnostics.some((d) => d.severity === 'error')
    if (hasError) {
      return 'parcial'
    }

    return 'completa'
  }
}
