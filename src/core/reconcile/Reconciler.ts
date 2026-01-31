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

/** Dados agrupados por matrícula */
interface RowData {
  valor: Money
  nome?: string
  cpf?: string
}

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

    // Agrupar por matrícula (com metadados)
    const bankByMatricula = this.groupByMatricula(bankRows)
    const prefByMatricula = this.groupByMatricula(prefRows)

    // Coletar todas as matrículas únicas
    const todasMatriculas = new Set([
      ...bankByMatricula.keys(),
      ...prefByMatricula.keys(),
    ])

    // Processar cada matrícula
    for (const matricula of todasMatriculas) {
      const dadosBanco = bankByMatricula.get(matricula) || []
      const dadosPref = prefByMatricula.get(matricula) || []

      // Clonar arrays para manipulação (multiconjunto)
      const bancoPendente = [...dadosBanco]
      const prefPendente = [...dadosPref]

      // Fase 1: Match exato (com tolerância)
      for (let i = bancoPendente.length - 1; i >= 0; i--) {
        const dadoBanco = bancoPendente[i]

        // Buscar match na prefeitura
        const matchIndex = prefPendente.findIndex((d) => {
          const diff = Math.abs(d.valor - dadoBanco.valor)
          return Math.round(diff * 100) / 100 <= TOLERANCE
        })

        if (matchIndex !== -1) {
          const dadoPref = prefPendente[matchIndex]

          items.push({
            matricula,
            valorBanco: dadoBanco.valor,
            valorPrefeitura: dadoPref.valor,
            status: 'bateu',
            nome: dadoPref.nome,
            cpf: dadoPref.cpf,
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
        bancoPendente.sort((a, b) => a.valor - b.valor)
        prefPendente.sort((a, b) => a.valor - b.valor)

        // Parear por índice (divergentes)
        const pairsCount = Math.min(bancoPendente.length, prefPendente.length)

        for (let i = 0; i < pairsCount; i++) {
          const dadoBanco = bancoPendente[i]
          const dadoPref = prefPendente[i]
          const diff = dadoBanco.valor - dadoPref.valor

          items.push({
            matricula,
            valorBanco: dadoBanco.valor,
            valorPrefeitura: dadoPref.valor,
            status: 'divergente',
            obs: `Diferença: R$ ${diff >= 0 ? '+' : ''}${diff.toFixed(2)}`,
            nome: dadoPref.nome,
            cpf: dadoPref.cpf,
          })
          divergenteCount++
        }

        // Remover os pareados
        bancoPendente.splice(0, pairsCount)
        prefPendente.splice(0, pairsCount)
      }

      // Fase 3: Sobras finais do banco
      for (const dado of bancoPendente) {
        items.push({
          matricula,
          valorBanco: dado.valor,
          status: 'so_no_banco',
        })
        soNoBancoCount++
      }

      // Fase 4: Sobras finais da prefeitura
      for (const dado of prefPendente) {
        items.push({
          matricula,
          valorPrefeitura: dado.valor,
          status: 'so_na_prefeitura',
          nome: dado.nome,
          cpf: dado.cpf,
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
   * Agrupa rows por matrícula, mantendo valor e metadados
   */
  private groupByMatricula(rows: NormalizedRow[]): Map<string, RowData[]> {
    const map = new Map<string, RowData[]>()

    for (const row of rows) {
      const existing = map.get(row.matricula) || []
      existing.push({
        valor: row.valor,
        nome: row.meta?.nome,
        cpf: row.meta?.cpf,
      })
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
