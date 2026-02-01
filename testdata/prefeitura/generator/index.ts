/**
 * Geradores de arquivos de teste para PrefeituraExtractor
 */

export {
  generateXlsx,
  generateAllXlsxTestFiles,
  xlsxBufferToBlob,
  type XlsxRow,
  type XlsxGeneratorOptions,
} from './XlsxGenerator'

export {
  generateDocx,
  generateAllDocxTestFiles,
  docxBufferToBlob,
  type DocxRow,
  type DocxGeneratorOptions,
} from './DocxGenerator'
