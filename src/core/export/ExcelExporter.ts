import ExcelJS from 'exceljs'
import type {
  ReconciliationResult,
  ReconciliationItem,
  DiagnosticsItem,
} from '../domain/types'

/**
 * Exportador de relatório de reconciliação para Excel (.xlsx)
 * 100% client-side, sem backend
 */
export class ExcelExporter {
  /**
   * Gera arquivo Excel com resultado da reconciliação
   * @param result Resultado da reconciliação
   * @returns Blob do arquivo .xlsx
   */
  async export(result: ReconciliationResult): Promise<Blob> {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Conecta Consig'
    workbook.created = new Date()

    // Criar abas
    this.createResumoSheet(workbook, result)
    this.createItemsSheet(workbook, 'Bateu', result.items, 'bateu')
    this.createItemsSheet(workbook, 'Só no banco', result.items, 'so_no_banco')
    this.createItemsSheet(
      workbook,
      'Só na prefeitura',
      result.items,
      'so_na_prefeitura'
    )
    this.createItemsSheet(workbook, 'Divergências', result.items, 'divergente')
    this.createDiagnosticsSheet(workbook, result.diagnostics)

    // Gerar buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Converter para Blob
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
  }

  /**
   * Cria aba de Resumo
   */
  private createResumoSheet(
    workbook: ExcelJS.Workbook,
    result: ReconciliationResult
  ): void {
    const sheet = workbook.addWorksheet('Resumo')

    // Configurar largura das colunas
    sheet.columns = [
      { width: 25 },
      { width: 40 },
    ]

    // Dados do resumo
    const rows: [string, string | number][] = [
      ['Competência', result.summary.competencia || 'Não identificada'],
      ['Extração', result.summary.extracao],
      ['', ''],
      ['Bateu', result.summary.counts.bateu],
      ['Só no banco', result.summary.counts.so_no_banco],
      ['Só na prefeitura', result.summary.counts.so_na_prefeitura],
      ['Divergências', result.summary.counts.divergente],
      ['Diagnósticos', result.summary.counts.diagnostico],
      ['', ''],
      ['Taxa de match', `${result.summary.taxaMatch?.toFixed(2) || 0}%`],
      ['', ''],
      [
        'Observação',
        'Processamento local no navegador. Nada é enviado para servidor.',
      ],
    ]

    // Adicionar cabeçalho
    const headerRow = sheet.addRow(['Campo', 'Valor'])
    headerRow.font = { bold: true }
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      }
    })

    // Adicionar dados
    for (const [campo, valor] of rows) {
      sheet.addRow([campo, valor])
    }

    // Freeze pane
    sheet.views = [{ state: 'frozen', ySplit: 1 }]
  }

  /**
   * Cria aba de itens filtrados por status
   */
  private createItemsSheet(
    workbook: ExcelJS.Workbook,
    sheetName: string,
    allItems: ReconciliationItem[],
    status: ReconciliationItem['status']
  ): void {
    const sheet = workbook.addWorksheet(sheetName)

    // Filtrar itens pelo status
    const items = allItems
      .filter((item) => item.status === status)
      .sort((a, b) => {
        // Ordenar por matrícula (numérica)
        const [aBase] = a.matricula.split('-').map(Number)
        const [bBase] = b.matricula.split('-').map(Number)
        if (aBase !== bBase) return aBase - bBase
        // Depois por valor do banco ou prefeitura
        const aVal = a.valorBanco ?? a.valorPrefeitura ?? 0
        const bVal = b.valorBanco ?? b.valorPrefeitura ?? 0
        return aVal - bVal
      })

    // Configurar colunas
    sheet.columns = [
      { header: 'Status', key: 'status', width: 18 },
      { header: 'Matrícula', key: 'matricula', width: 12 },
      { header: 'Nome', key: 'nome', width: 35 },
      { header: 'CPF', key: 'cpf', width: 16 },
      { header: 'Banco (R$)', key: 'banco', width: 15 },
      { header: 'Prefeitura (R$)', key: 'prefeitura', width: 15 },
      { header: 'Diferença (R$)', key: 'diferenca', width: 15 },
      { header: 'Observação', key: 'obs', width: 40 },
    ]

    // Estilizar cabeçalho
    const headerRow = sheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      }
    })

    // Adicionar dados
    for (const item of items) {
      const diferenca =
        item.valorBanco !== undefined && item.valorPrefeitura !== undefined
          ? item.valorBanco - item.valorPrefeitura
          : null

      const row = sheet.addRow({
        status: this.formatStatus(item.status),
        matricula: item.matricula,
        nome: item.nome || '',
        cpf: item.cpf || '',
        banco: item.valorBanco,
        prefeitura: item.valorPrefeitura,
        diferenca: diferenca,
        obs: item.obs || '',
      })

      // Formatar células monetárias
      const bancoCell = row.getCell('banco')
      const prefeituraCell = row.getCell('prefeitura')
      const diferencaCell = row.getCell('diferenca')

      if (item.valorBanco !== undefined) {
        bancoCell.numFmt = '#,##0.00'
      }
      if (item.valorPrefeitura !== undefined) {
        prefeituraCell.numFmt = '#,##0.00'
      }
      if (diferenca !== null) {
        diferencaCell.numFmt = '#,##0.00'
      }
    }

    // Freeze pane
    sheet.views = [{ state: 'frozen', ySplit: 1 }]
  }

  /**
   * Cria aba de diagnósticos
   */
  private createDiagnosticsSheet(
    workbook: ExcelJS.Workbook,
    diagnostics: DiagnosticsItem[]
  ): void {
    const sheet = workbook.addWorksheet('Diagnósticos')

    // Configurar colunas
    sheet.columns = [
      { header: 'Severidade', key: 'severity', width: 12 },
      { header: 'Código', key: 'code', width: 30 },
      { header: 'Mensagem', key: 'message', width: 60 },
      { header: 'Detalhes', key: 'details', width: 50 },
    ]

    // Estilizar cabeçalho
    const headerRow = sheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      }
    })

    // Adicionar dados
    for (const diag of diagnostics) {
      // Limitar detalhes a 500 caracteres
      let detailsStr = ''
      if (diag.details) {
        try {
          detailsStr = JSON.stringify(diag.details)
          if (detailsStr.length > 500) {
            detailsStr = detailsStr.slice(0, 497) + '...'
          }
        } catch {
          detailsStr = '[erro ao serializar]'
        }
      }

      sheet.addRow({
        severity: diag.severity.toUpperCase(),
        code: diag.code,
        message: diag.message,
        details: detailsStr,
      })
    }

    // Freeze pane
    sheet.views = [{ state: 'frozen', ySplit: 1 }]
  }

  /**
   * Formata status para exibição
   */
  private formatStatus(status: ReconciliationItem['status']): string {
    const map: Record<ReconciliationItem['status'], string> = {
      bateu: 'Bateu',
      so_no_banco: 'Só no banco',
      so_na_prefeitura: 'Só na prefeitura',
      divergente: 'Divergente',
      diagnostico: 'Diagnóstico',
    }
    return map[status] || status
  }
}
