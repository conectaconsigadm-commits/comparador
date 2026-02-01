/**
 * Gerador de arquivos DOCX para testes
 * Usa a biblioteca JSZip para criar arquivos DOCX em memória
 * (DOCX é um arquivo ZIP com XMLs específicos)
 */

import JSZip from 'jszip'

export interface DocxRow {
  matricula: string
  nome?: string
  cpf?: string
  valor: number | string
}

export interface DocxGeneratorOptions {
  /** Se deve usar tabela ou texto corrido */
  format: 'table' | 'text'
  /** Competência */
  competencia?: string
  /** Título */
  title?: string
  /** Se algumas células devem estar vazias (para simular tabela quebrada) */
  brokenCells?: boolean
}

/**
 * Gera um arquivo DOCX em memória
 */
export async function generateDocx(
  rows: DocxRow[],
  options: DocxGeneratorOptions
): Promise<ArrayBuffer> {
  const { format, competencia = '01/2026', title = 'PREFEITURA MUNICIPAL DE TESTE', brokenCells = false } = options

  const zip = new JSZip()

  // Estrutura mínima de um DOCX
  // [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  )

  // _rels/.rels
  zip.folder('_rels')?.file(
    '.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  )

  // word/document.xml
  let documentContent: string

  if (format === 'table') {
    documentContent = generateTableDocument(rows, title, competencia, brokenCells)
  } else {
    documentContent = generateTextDocument(rows, title, competencia)
  }

  zip.folder('word')?.file('document.xml', documentContent)

  // Gerar o buffer
  const buffer = await zip.generateAsync({ type: 'arraybuffer' })
  return buffer
}

/**
 * Gera documento com tabela
 */
function generateTableDocument(
  rows: DocxRow[],
  title: string,
  competencia: string,
  brokenCells: boolean
): string {
  const tableRows = rows
    .map((row, index) => {
      // Se brokenCells e índice par, omitir algumas células
      const skipSomeCells = brokenCells && index % 2 === 1

      return `<w:tr>
        <w:tc><w:p><w:r><w:t>${row.matricula}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>${skipSomeCells ? '' : row.nome || ''}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>${row.cpf || ''}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>${formatValor(row.valor)}</w:t></w:r></w:p></w:tc>
      </w:tr>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>${title}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Competência: ${competencia}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Evento: 002 - CONSIGNADO</w:t></w:r></w:p>
    <w:tbl>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Matrícula</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Nome</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>CPF</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Valor</w:t></w:r></w:p></w:tc>
      </w:tr>
      ${tableRows}
    </w:tbl>
  </w:body>
</w:document>`
}

/**
 * Gera documento com texto corrido
 */
function generateTextDocument(rows: DocxRow[], title: string, competencia: string): string {
  const textLines = rows
    .map(
      (row) =>
        `<w:p><w:r><w:t>${row.matricula} - ${row.nome || 'N/A'} - ${formatValor(row.valor)}</w:t></w:r></w:p>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>${title}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Competência: ${competencia}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Evento: 015 - EMPRESTIMO</w:t></w:r></w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p><w:r><w:t>Trabalhadores:</w:t></w:r></w:p>
    ${textLines}
  </w:body>
</w:document>`
}

/**
 * Formata valor para exibição BR
 */
function formatValor(valor: number | string): string {
  if (typeof valor === 'string') return valor
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Gera os 3 arquivos DOCX de teste
 */
export async function generateAllDocxTestFiles(): Promise<Map<string, ArrayBuffer>> {
  const files = new Map<string, ArrayBuffer>()

  // 01 - Tabela normal
  files.set(
    'docx/01-tabela-normal.docx',
    await generateDocx(
      [
        { matricula: '100-1', nome: 'JOAO SILVA', cpf: '123.456.789-00', valor: 1000.0 },
        { matricula: '200-2', nome: 'MARIA SANTOS', cpf: '234.567.890-11', valor: 2000.0 },
        { matricula: '300-3', nome: 'PEDRO SOUZA', cpf: '345.678.901-22', valor: 3000.0 },
        { matricula: '400-4', nome: 'ANA COSTA', cpf: '456.789.012-33', valor: 4000.0 },
        { matricula: '500-5', nome: 'CARLOS LIMA', cpf: '567.890.123-44', valor: 5000.0 },
      ],
      {
        format: 'table',
        competencia: '01/2026',
      }
    )
  )

  // 02 - Texto corrido
  files.set(
    'docx/02-texto-corrido.docx',
    await generateDocx(
      [
        { matricula: '10-1', nome: 'JOAO SILVA', valor: 100.0 },
        { matricula: '20-2', nome: 'MARIA SANTOS', valor: 200.0 },
        { matricula: '30-3', nome: 'PEDRO SOUZA', valor: 300.0 },
        { matricula: '40-4', nome: 'ANA COSTA', valor: 400.0 },
      ],
      {
        format: 'text',
        competencia: '02/2026',
      }
    )
  )

  // 03 - Tabela quebrada
  files.set(
    'docx/03-tabela-quebrada.docx',
    await generateDocx(
      [
        { matricula: '1-1', nome: 'JOAO SILVA', cpf: '123.456.789-00', valor: 100.0 },
        { matricula: '2-1', nome: '', cpf: '234.567.890-11', valor: 200.0 },
        { matricula: '3-1', nome: 'PEDRO SOUZA', cpf: '', valor: 300.0 },
      ],
      {
        format: 'table',
        competencia: '03/2026',
        brokenCells: true,
      }
    )
  )

  return files
}

/**
 * Converte buffer para Blob
 */
export function docxBufferToBlob(buffer: ArrayBuffer): Blob {
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}
