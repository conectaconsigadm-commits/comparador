/**
 * Mapeamento de códigos de evento para nomes de bancos
 */
export const EVENTO_BANCO_MAP: Record<string, string> = {
  '002': 'Banco do Brasil',
  '015': 'Caixa Econômica',
  '135': 'Bradesco',
  '033': 'Santander',
  '104': 'Caixa Econômica',
  '237': 'Bradesco',
  '341': 'Itaú',
  '422': 'Safra',
  '623': 'Pan',
  '707': 'Daycoval',
  '739': 'BGN',
  '745': 'Citibank',
  '756': 'Sicoob',
}

/**
 * Retorna o nome do banco a partir do código do evento
 */
export function getBancoFromEvento(evento?: string): string | undefined {
  if (!evento) return undefined
  const code = evento.padStart(3, '0')
  return EVENTO_BANCO_MAP[code]
}

/**
 * Nomes amigáveis para formatos de arquivo
 */
export const FORMATO_NOME_MAP: Record<string, string> = {
  'xlsx_table_v1': 'Excel (XLSX)',
  'xls_table_v1': 'Excel (XLS)',
  'csv_report_v1': 'CSV',
  'pdf_text_v1': 'PDF',
  'docx_text_v1': 'Word (DOCX)',
  'text_report_v1': 'Texto',
  'unknown': 'Desconhecido',
}

/**
 * Retorna nome amigável do formato
 */
export function getFormatoNome(formato?: string): string {
  if (!formato) return 'Desconhecido'
  return FORMATO_NOME_MAP[formato] || formato.toUpperCase()
}
