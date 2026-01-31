/**
 * Utilitário para download de Blob no navegador
 */

/**
 * Dispara download de um Blob como arquivo
 * @param blob Conteúdo do arquivo
 * @param filename Nome do arquivo para download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  // Criar URL temporária
  const url = URL.createObjectURL(blob)

  // Criar elemento <a> para download
  const link = document.createElement('a')
  link.href = url
  link.download = filename

  // Adicionar ao DOM, clicar e remover
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Revogar URL após pequeno delay (para garantir que o download iniciou)
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 100)
}
