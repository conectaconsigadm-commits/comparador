/**
 * Tipos de domínio para conciliação Banco × Prefeitura
 * Engine 100% client-side, sem backend
 */

// =============================================================================
// PRIMITIVOS
// =============================================================================

/** Valor monetário em reais (2 casas decimais implícitas) */
export type Money = number

// =============================================================================
// LINHA NORMALIZADA
// =============================================================================

/** Origem do dado */
export type RowSource = 'banco' | 'prefeitura'

/** Nível de confiança da extração */
export type ConfidenceLevel = 'high' | 'medium' | 'low'

/** Metadados opcionais da linha */
export interface RowMeta {
  /** Competência no formato MMAAAA ou MM/AAAA */
  competencia?: string
  /** Código do evento (ex: "002", "015", "135") */
  evento?: string
  /** Confiança na extração do dado */
  confidence?: ConfidenceLevel
  /** Nome do trabalhador (quando disponível) */
  nome?: string
  /** CPF do trabalhador (quando disponível) */
  cpf?: string
}

/** Referência ao dado bruto original (para debug/auditoria) */
export interface RawRef {
  /** Número da linha no arquivo original */
  lineNo?: number
  /** Nome da aba (para XLS/XLSX) */
  sheet?: string
  /** Número da página (para PDFs) */
  page?: number
  /** Conteúdo bruto original */
  raw?: string
}

/** Linha normalizada de qualquer fonte */
export interface NormalizedRow {
  /** Origem do dado */
  source: RowSource
  /** Matrícula normalizada no formato "base-sufixo" (ex: "85-1") */
  matricula: string
  /** Valor em reais */
  valor: Money
  /** Metadados opcionais */
  meta?: RowMeta
  /** Referência ao dado bruto */
  rawRef?: RawRef
}

// =============================================================================
// DIAGNÓSTICOS
// =============================================================================

/** Severidade do diagnóstico */
export type DiagnosticSeverity = 'info' | 'warn' | 'error'

/** Item de diagnóstico (log estruturado) */
export interface DiagnosticsItem {
  /** Severidade */
  severity: DiagnosticSeverity
  /** Código único do diagnóstico (ex: "PARSE_ERROR", "MISSING_FIELD") */
  code: string
  /** Mensagem legível */
  message: string
  /** Detalhes adicionais para debug */
  details?: Record<string, unknown>
}

// =============================================================================
// RESULTADO DA CONCILIAÇÃO
// =============================================================================

/** Status de um item na conciliação */
export type ReconciliationStatus =
  | 'bateu'           // Valores iguais (dentro da tolerância)
  | 'so_no_banco'     // Existe só no arquivo do banco
  | 'so_na_prefeitura'// Existe só no arquivo da prefeitura
  | 'divergente'      // Existe em ambos mas valores diferentes
  | 'diagnostico'     // Não foi possível processar (ver diagnostics)

/** Item individual da conciliação */
export interface ReconciliationItem {
  /** Matrícula (chave de match) */
  matricula: string
  /** Valor total no banco (soma de todas as linhas) */
  valorBanco?: Money
  /** Valor total na prefeitura (soma de todas as linhas) */
  valorPrefeitura?: Money
  /** Status da conciliação */
  status: ReconciliationStatus
  /** Observação (motivo da divergência, etc) */
  obs?: string
  /** Nome do trabalhador (da prefeitura, quando disponível) */
  nome?: string
  /** CPF do trabalhador (da prefeitura, quando disponível) */
  cpf?: string
}

/** Qualidade da extração */
export type ExtracaoQualidade = 'completa' | 'parcial' | 'falhou'

/** Resumo da conciliação */
export interface ReconciliationSummary {
  /** Competência processada (ex: "01/2026") */
  competencia?: string
  /** Qualidade geral da extração */
  extracao: ExtracaoQualidade
  /** Contadores por status */
  counts: {
    bateu: number
    so_no_banco: number
    so_na_prefeitura: number
    divergente: number
    diagnostico: number
  }
  /** Taxa de match (bateu / total) em percentual 0-100 */
  taxaMatch?: number
}

/** Resultado completo da conciliação */
export interface ReconciliationResult {
  /** Resumo executivo */
  summary: ReconciliationSummary
  /** Itens detalhados */
  items: ReconciliationItem[]
  /** Diagnósticos (erros, avisos, info) */
  diagnostics: DiagnosticsItem[]
}
