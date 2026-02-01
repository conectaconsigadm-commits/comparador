/**
 * Gerador de arquivos XLSX para testes
 * Usa a biblioteca xlsx para criar arquivos em memória
 */

import * as XLSX from 'xlsx'

export interface XlsxRow {
  matricula: string
  nome?: string
  cpf?: string
  valor: number | string
  evento?: string
}

export interface XlsxGeneratorOptions {
  /** Nome da planilha principal */
  sheetName?: string
  /** Se deve adicionar uma planilha de resumo antes */
  addSummarySheetFirst?: boolean
  /** Variação nos nomes das colunas */
  columnVariant?: 'default' | 'uppercase' | 'abbreviated' | 'mixed'
  /** Competência a incluir no cabeçalho */
  competencia?: string
  /** Título do relatório */
  title?: string
}

/**
 * Gera um arquivo XLSX em memória
 */
export function generateXlsx(
  rows: XlsxRow[],
  options: XlsxGeneratorOptions = {}
): ArrayBuffer {
  const {
    sheetName = 'Dados',
    addSummarySheetFirst = false,
    columnVariant = 'default',
    competencia = '01/2026',
    title = 'PREFEITURA MUNICIPAL DE TESTE',
  } = options

  const workbook = XLSX.utils.book_new()

  // Adicionar planilha de resumo se solicitado
  if (addSummarySheetFirst) {
    const summaryData = [
      ['RESUMO'],
      ['Total de registros:', rows.length],
      ['Competência:', competencia],
      [''],
      ['Esta planilha é apenas um resumo.'],
      ['Os dados completos estão na próxima aba.'],
    ]
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo')
  }

  // Definir nomes das colunas baseado na variante
  const columnNames = getColumnNames(columnVariant)

  // Criar dados da planilha principal
  const sheetData: (string | number)[][] = [
    [title, '', '', '', ''],
    [`Competência: ${competencia}`, '', '', '', ''],
    ['', '', '', '', ''],
    columnNames,
  ]

  // Adicionar linhas de dados
  for (const row of rows) {
    sheetData.push([
      row.matricula,
      row.nome || '',
      row.cpf || '',
      row.valor,
      row.evento || '',
    ])
  }

  // Adicionar linha de total
  const total = rows.reduce((sum, row) => {
    const valor = typeof row.valor === 'number' ? row.valor : parseFloat(row.valor.toString().replace('.', '').replace(',', '.'))
    return sum + (isNaN(valor) ? 0 : valor)
  }, 0)
  sheetData.push(['', '', 'Total:', total, ''])

  const dataSheet = XLSX.utils.aoa_to_sheet(sheetData)
  XLSX.utils.book_append_sheet(workbook, dataSheet, sheetName)

  // Gerar buffer
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  return buffer
}

/**
 * Retorna nomes de colunas baseado na variante
 */
function getColumnNames(variant: XlsxGeneratorOptions['columnVariant']): string[] {
  switch (variant) {
    case 'uppercase':
      return ['MATRICULA', 'NOME', 'CPF', 'VALOR', 'EVENTO']
    case 'abbreviated':
      return ['MAT', 'NM', 'CPF', 'VLR', 'EVT']
    case 'mixed':
      return ['Matricula', 'Nome do Trabalhador', 'cpf', 'Valor Total', 'Cod.Evento']
    default:
      return ['Matrícula', 'Nome', 'CPF', 'Valor', 'Evento']
  }
}

/**
 * Gera os 3 arquivos XLSX de teste
 */
export function generateAllXlsxTestFiles(): Map<string, ArrayBuffer> {
  const files = new Map<string, ArrayBuffer>()

  // 01 - Cabeçalho variado
  files.set(
    'xlsx/01-cabecalho-variado.xlsx',
    generateXlsx(
      [
        { matricula: '10-1', nome: 'JOAO SILVA', cpf: '123.456.789-00', valor: 100.0 },
        { matricula: '20-2', nome: 'MARIA SANTOS', cpf: '234.567.890-11', valor: 200.0 },
        { matricula: '30-3', nome: 'PEDRO SOUZA', cpf: '345.678.901-22', valor: 300.0 },
        { matricula: '40-4', nome: 'ANA COSTA', cpf: '456.789.012-33', valor: 400.0 },
        { matricula: '50-5', nome: 'CARLOS LIMA', cpf: '567.890.123-44', valor: 500.0 },
      ],
      {
        columnVariant: 'mixed',
        competencia: '01/2026',
      }
    )
  )

  // 02 - Planilha errada primeiro
  files.set(
    'xlsx/02-planilha-errada-primeiro.xlsx',
    generateXlsx(
      [
        { matricula: '111-1', nome: 'TESTE UM', cpf: '111.111.111-11', valor: 1111.11 },
        { matricula: '222-2', nome: 'TESTE DOIS', cpf: '222.222.222-22', valor: 2222.22 },
        { matricula: '333-3', nome: 'TESTE TRES', cpf: '333.333.333-33', valor: 3333.33 },
      ],
      {
        addSummarySheetFirst: true,
        competencia: '02/2026',
      }
    )
  )

  // 03 - Valor como texto e número
  const mixedValueRows: XlsxRow[] = [
    { matricula: '50-1', nome: 'TESTE UM', cpf: '111.111.111-11', valor: 500.0 }, // número
    { matricula: '60-2', nome: 'TESTE DOIS', cpf: '222.222.222-22', valor: '600,00' }, // texto
    { matricula: '70-3', nome: 'TESTE TRES', cpf: '333.333.333-33', valor: 700.0 }, // número
    { matricula: '80-4', nome: 'TESTE QUATRO', cpf: '444.444.444-44', valor: '800,00' }, // texto
  ]
  files.set(
    'xlsx/03-valor-texto-numero.xlsx',
    generateXlsx(mixedValueRows, {
      competencia: '03/2026',
      columnVariant: 'uppercase',
    })
  )

  return files
}

/**
 * Salva um arquivo XLSX gerado (para uso em scripts Node.js)
 */
export function xlsxBufferToBlob(buffer: ArrayBuffer): Blob {
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
