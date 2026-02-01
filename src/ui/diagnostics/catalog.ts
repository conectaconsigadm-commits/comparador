/**
 * Catálogo de mensagens humanizadas para diagnósticos
 * Traduz códigos técnicos em linguagem acessível
 */

export interface DiagnosticUiCopy {
  /** Título curto e direto */
  title: string
  /** Explicação em uma frase */
  message: string
  /** O que o usuário pode fazer (opcional) */
  action?: string
  /** Link ou referência para mais informações (opcional) */
  learnMore?: string
}

/**
 * Mapeamento de códigos de diagnóstico para mensagens humanizadas
 */
const DIAGNOSTIC_CATALOG: Record<string, DiagnosticUiCopy> = {
  // ─────────────────────────────────────────────────────────────
  // PREFEITURA - Formatos e extração
  // ─────────────────────────────────────────────────────────────
  prefeitura_unsupported_format: {
    title: 'Formato não suportado',
    message: 'Este tipo de arquivo ainda não é compatível com o sistema.',
    action: 'Exporte o relatório do município como CSV ou XLSX e tente novamente.',
  },
  prefeitura_extraction_failed: {
    title: 'Falha na extração',
    message: 'Não foi possível ler os dados do arquivo da prefeitura.',
    action: 'Verifique se o arquivo está correto ou converta para CSV/XLSX.',
  },
  PDF_SCAN_DETECTED: {
    title: 'PDF escaneado',
    message: 'O arquivo parece ser uma imagem digitalizada, sem texto selecionável.',
    action: 'Use a versão digital do relatório ou converta para CSV/XLSX.',
  },
  PDF_TEXT_SPARSE: {
    title: 'Pouco texto no PDF',
    message: 'O PDF contém muito pouco texto legível.',
    action: 'Verifique se o arquivo é o correto ou exporte como CSV.',
  },
  DOCX_EMPTY: {
    title: 'Documento vazio',
    message: 'O arquivo DOCX não contém dados legíveis.',
    action: 'Verifique se o documento correto foi selecionado.',
  },
  COLUMNS_NOT_DETECTED: {
    title: 'Colunas não identificadas',
    message: 'Não foi possível identificar as colunas de matrícula e valor.',
    action: 'Verifique se o arquivo segue o padrão esperado.',
  },

  // ─────────────────────────────────────────────────────────────
  // CSV
  // ─────────────────────────────────────────────────────────────
  CSV_NO_ROWS: {
    title: 'Arquivo vazio',
    message: 'O arquivo CSV está vazio ou não tem dados válidos.',
    action: 'Confira se exportou o relatório correto do sistema.',
  },
  CSV_COMPETENCIA_NOT_FOUND: {
    title: 'Competência não encontrada',
    message: 'O mês/ano de referência não foi identificado.',
    action: 'Isso não impede o processamento, mas a competência ficará em branco.',
  },
  CSV_EVENT_NOT_FOUND: {
    title: 'Evento não identificado',
    message: 'O código do evento/rubrica não foi encontrado em algumas linhas.',
    action: 'Os valores serão processados, mas sem o código do evento.',
  },
  CSV_DELIMITER_DETECTED: {
    title: 'Separador detectado',
    message: 'O sistema identificou o formato do CSV automaticamente.',
  },

  // ─────────────────────────────────────────────────────────────
  // XLSX / XLS
  // ─────────────────────────────────────────────────────────────
  XLSX_ZERO_ROWS: {
    title: 'Planilha vazia',
    message: 'Nenhuma linha com dados foi encontrada na planilha.',
    action: 'Verifique se a aba correta contém os dados.',
  },
  XLSX_COMPETENCIA_NOT_FOUND: {
    title: 'Competência não encontrada',
    message: 'O mês/ano de referência não foi identificado na planilha.',
    action: 'Isso não impede o processamento, mas a competência ficará em branco.',
  },
  XLSX_EVENT_NOT_FOUND: {
    title: 'Evento não identificado',
    message: 'O código do evento não foi encontrado em algumas linhas.',
  },
  XLSX_SHEET_FALLBACK: {
    title: 'Aba alternativa usada',
    message: 'A primeira aba estava vazia. Dados extraídos de outra aba.',
  },
  XLSX_HEADER_ROW_SKIPPED: {
    title: 'Cabeçalho identificado',
    message: 'Linhas de cabeçalho foram identificadas e puladas.',
  },

  // ─────────────────────────────────────────────────────────────
  // BANCO
  // ─────────────────────────────────────────────────────────────
  bank_parse_error: {
    title: 'Erro no arquivo do banco',
    message: 'O arquivo do banco não pôde ser interpretado corretamente.',
    action: 'Verifique se é o arquivo correto de débito.',
  },
  ENCODING_FALLBACK: {
    title: 'Codificação ajustada',
    message: 'O arquivo usa uma codificação diferente do padrão.',
  },
  BANK_COMPETENCIA_NOT_FOUND: {
    title: 'Competência não detectada',
    message: 'O mês/ano não foi identificado no arquivo do banco.',
  },

  // ─────────────────────────────────────────────────────────────
  // RECONCILIAÇÃO
  // ─────────────────────────────────────────────────────────────
  RECONCILE_ERROR: {
    title: 'Erro na comparação',
    message: 'Ocorreu um problema ao comparar os arquivos.',
    action: 'Verifique se ambos os arquivos estão corretos.',
  },
  EXPORT_ERROR: {
    title: 'Erro ao gerar Excel',
    message: 'Não foi possível criar o arquivo Excel para download.',
    action: 'Tente novamente ou entre em contato com o suporte.',
  },
  MATCH_FOUND: {
    title: 'Registro encontrado',
    message: 'O registro foi encontrado em ambos os arquivos com valores iguais.',
  },
  VALUE_DIVERGENT: {
    title: 'Valor divergente',
    message: 'O registro foi encontrado, mas os valores são diferentes.',
    action: 'Confira manualmente os valores no banco e na prefeitura.',
  },
  ONLY_IN_BANK: {
    title: 'Apenas no banco',
    message: 'Este registro existe no arquivo do banco, mas não na prefeitura.',
    action: 'Verifique se o servidor foi incluído no relatório da prefeitura.',
  },
  ONLY_IN_PREFEITURA: {
    title: 'Apenas na prefeitura',
    message: 'Este registro existe na prefeitura, mas não no arquivo do banco.',
    action: 'Verifique se o desconto foi enviado ao banco.',
  },

  // ─────────────────────────────────────────────────────────────
  // GENÉRICOS
  // ─────────────────────────────────────────────────────────────
  MATRICULA_REGEX_FAIL: {
    title: 'Matrícula inválida',
    message: 'Uma ou mais matrículas não seguem o padrão esperado.',
    action: 'Verifique se o formato das matrículas está correto.',
  },
  VALUE_MISSING: {
    title: 'Valor ausente',
    message: 'Não foi possível identificar o valor monetário.',
  },
  TEXT_ZERO_ROWS: {
    title: 'Nenhum dado extraído',
    message: 'O arquivo não contém linhas com matrícula e valor identificáveis.',
    action: 'Converta o relatório para CSV ou XLSX.',
  },
  PARSE_ERROR: {
    title: 'Erro de leitura',
    message: 'Ocorreu um problema ao interpretar parte do arquivo.',
  },
  ROW_SKIPPED: {
    title: 'Linha ignorada',
    message: 'Uma linha foi ignorada por não conter dados válidos.',
  },
  DUPLICATE_MATRICULA: {
    title: 'Matrícula duplicada',
    message: 'A mesma matrícula aparece mais de uma vez no arquivo.',
    action: 'Verifique se há registros duplicados.',
  },

  // ─────────────────────────────────────────────────────────────
  // INFO
  // ─────────────────────────────────────────────────────────────
  CSV_EXTRACTION_COMPLETE: {
    title: 'Extração completa',
    message: 'Todos os dados do CSV foram lidos com sucesso.',
  },
  XLSX_EXTRACTION_COMPLETE: {
    title: 'Extração completa',
    message: 'Todos os dados da planilha foram lidos com sucesso.',
  },
  BANK_EXTRACTION_COMPLETE: {
    title: 'Leitura completa',
    message: 'Todos os dados do arquivo do banco foram lidos.',
  },
}

/**
 * Converte um código técnico em texto legível
 * Ex: "CSV_COMPETENCIA_NOT_FOUND" -> "Competência não encontrada"
 */
export function humanizeCode(code: string): string {
  return code
    .replace(/_/g, ' ')
    .replace(/CSV|XLSX|PDF|DOCX|XLS/gi, '')
    .trim()
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim() || code
}

/**
 * Obtém a copy humanizada para um código de diagnóstico
 * Retorna null se não houver mapeamento (usar fallback)
 */
export function getDiagnosticCopy(code: string): DiagnosticUiCopy | null {
  return DIAGNOSTIC_CATALOG[code] ?? null
}

/**
 * Obtém a copy humanizada ou gera um fallback
 */
export function getDiagnosticCopyWithFallback(code: string): DiagnosticUiCopy {
  const copy = getDiagnosticCopy(code)
  if (copy) return copy

  return {
    title: humanizeCode(code),
    message: 'Não foi possível interpretar uma parte do arquivo. Veja os detalhes técnicos.',
  }
}
