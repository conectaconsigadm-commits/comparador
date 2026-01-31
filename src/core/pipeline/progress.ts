/**
 * Tipos para controle de progresso do pipeline de conciliação
 */

/** Etapas do pipeline */
export type PipelineStep =
  | 'read_bank'       // Leitura do arquivo do banco
  | 'read_prefeitura' // Leitura do arquivo da prefeitura
  | 'normalize'       // Normalização dos dados
  | 'reconcile'       // Conciliação (match + diff)
  | 'export'          // Exportação do resultado

/** Estado de progresso do pipeline */
export interface PipelineProgress {
  /** Etapa atual */
  step: PipelineStep
  /** Percentual de conclusão da etapa (0-100) */
  percent: number
  /** Mensagem principal de status */
  message: string
  /** Detalhe adicional (ex: "Linha 150 de 762") */
  detail?: string
}

/** Callback para notificação de progresso */
export type ProgressCallback = (progress: PipelineProgress) => void
