/**
 * Script para gerar arquivos de amostra binários (XLSX, DOCX)
 * Executar: node testdata/prefeitura/samples/generateSamples.mjs
 */

import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Garantir que a pasta existe
if (!existsSync(__dirname)) {
  mkdirSync(__dirname, { recursive: true });
}

console.log('📁 Gerando arquivos de amostra em:', __dirname);
console.log('');

// ═══════════════════════════════════════════════════════════════
// DADOS DE EXEMPLO
// ═══════════════════════════════════════════════════════════════

const dadosBasicos = [
  { matricula: '12345-1', nome: 'João Silva', valor: 150.00, evento: '002' },
  { matricula: '12346-2', nome: 'Maria Santos', valor: 250.50, evento: '002' },
  { matricula: '12347-3', nome: 'Pedro Oliveira', valor: 89.90, evento: '015' },
  { matricula: '12348-4', nome: 'Ana Costa', valor: 320.00, evento: '002' },
  { matricula: '12349-5', nome: 'Carlos Souza', valor: 175.25, evento: '135' },
];

const dadosVariados = [
  { matricula: '98765', nome: 'Fernanda Lima', valor: 450.00, evento: '002' },
  { matricula: '98766-1', nome: 'Roberto Alves', valor: 0.00, evento: '015' },
  { matricula: '98767-2', nome: 'Juliana Pereira', valor: 1234.56, evento: '002' },
  { matricula: '98768', nome: 'Marcos Ribeiro', valor: 99.99, evento: '135' },
];

// ═══════════════════════════════════════════════════════════════
// GERADOR DE XLSX
// ═══════════════════════════════════════════════════════════════

function gerarXlsx(filename, dados, opcoes = {}) {
  const {
    competencia = '01/2026',
    colunas = ['Matrícula', 'Nome', 'Valor', 'Evento'],
    incluirResumo = false,
    abaExtra = null,
  } = opcoes;

  const wb = XLSX.utils.book_new();

  // Dados principais
  const wsData = [
    [`Relatório de Consignados - Competência: ${competencia}`],
    [],
    colunas,
    ...dados.map(d => [d.matricula, d.nome, d.valor, d.evento]),
  ];

  if (incluirResumo) {
    wsData.push([]);
    wsData.push(['Total:', '', dados.reduce((s, d) => s + d.valor, 0).toFixed(2), '']);
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Dados');

  // Aba extra (para testar multi-sheet)
  if (abaExtra) {
    const wsExtra = XLSX.utils.aoa_to_sheet(abaExtra);
    XLSX.utils.book_append_sheet(wb, wsExtra, 'Resumo');
  }

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  writeFileSync(join(__dirname, filename), buffer);
  console.log(`✅ ${filename} (${dados.length} linhas)`);
}

// ═══════════════════════════════════════════════════════════════
// GERADOR DE DOCX (usando JSZip)
// ═══════════════════════════════════════════════════════════════

async function gerarDocx(filename, dados, opcoes = {}) {
  const {
    competencia = '01/2026',
    formato = 'tabela', // 'tabela' ou 'texto'
    titulo = 'Relatório de Consignados',
  } = opcoes;

  const zip = new JSZip();

  // [Content_Types].xml
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

  // _rels/.rels
  zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  // word/_rels/document.xml.rels
  zip.folder('word').folder('_rels').file('document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`);

  // Conteúdo do documento
  let conteudo = '';
  
  if (formato === 'tabela') {
    // Formato tabela
    const linhasTabela = dados.map(d => `
      <w:tr>
        <w:tc><w:p><w:r><w:t>${d.matricula}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>${d.nome}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>${d.valor.toFixed(2)}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>${d.evento}</w:t></w:r></w:p></w:tc>
      </w:tr>`).join('');

    conteudo = `
      <w:p><w:r><w:t>${titulo} - Competência: ${competencia}</w:t></w:r></w:p>
      <w:p/>
      <w:tbl>
        <w:tblPr><w:tblW w:w="5000" w:type="pct"/></w:tblPr>
        <w:tr>
          <w:tc><w:p><w:r><w:t>Matrícula</w:t></w:r></w:p></w:tc>
          <w:tc><w:p><w:r><w:t>Nome</w:t></w:r></w:p></w:tc>
          <w:tc><w:p><w:r><w:t>Valor</w:t></w:r></w:p></w:tc>
          <w:tc><w:p><w:r><w:t>Evento</w:t></w:r></w:p></w:tc>
        </w:tr>
        ${linhasTabela}
      </w:tbl>`;
  } else {
    // Formato texto corrido
    const linhasTexto = dados.map(d => 
      `<w:p><w:r><w:t>Matrícula: ${d.matricula} | Nome: ${d.nome} | Valor: R$ ${d.valor.toFixed(2)} | Evento: ${d.evento}</w:t></w:r></w:p>`
    ).join('');

    conteudo = `
      <w:p><w:r><w:t>${titulo} - Competência: ${competencia}</w:t></w:r></w:p>
      <w:p/>
      ${linhasTexto}`;
  }

  // word/document.xml
  zip.folder('word').file('document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${conteudo}
  </w:body>
</w:document>`);

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  writeFileSync(join(__dirname, filename), buffer);
  console.log(`✅ ${filename} (${dados.length} linhas, formato: ${formato})`);
}

// ═══════════════════════════════════════════════════════════════
// GERADOR DE CSV
// ═══════════════════════════════════════════════════════════════

function gerarCsv(filename, dados, opcoes = {}) {
  const {
    competencia = '01/2026',
    delimitador = ',',
    incluirHeader = true,
  } = opcoes;

  let csv = `# Relatório de Consignados - Competência: ${competencia}\n`;
  
  if (incluirHeader) {
    csv += ['Matrícula', 'Nome', 'Valor', 'Evento'].join(delimitador) + '\n';
  }

  for (const d of dados) {
    csv += [d.matricula, d.nome, d.valor.toFixed(2), d.evento].join(delimitador) + '\n';
  }

  writeFileSync(join(__dirname, filename), csv, 'utf-8');
  console.log(`✅ ${filename} (${dados.length} linhas, delimitador: "${delimitador}")`);
}

// ═══════════════════════════════════════════════════════════════
// GERADOR DE TXT DO BANCO (formato fixed-width)
// ═══════════════════════════════════════════════════════════════

function gerarTxtBanco(filename, dados, opcoes = {}) {
  const {
    competencia = '012026', // MMAAAA
    incluirHeader = true,
  } = opcoes;

  let linhas = [];
  let seq = 1;

  // Header (tipo 1)
  if (incluirHeader) {
    const header = '1' + 
      String(seq++).padStart(9, '0') + 
      'BANCO CONSIG'.padEnd(50, ' ') +
      competencia +
      '000000000000000';
    linhas.push(header);
  }

  // Dados (tipo 2)
  for (const d of dados) {
    // Parsear matrícula (formato: base-sufixo ou só número)
    let base, sufixo;
    if (d.matricula.includes('-')) {
      [base, sufixo] = d.matricula.split('-').map(Number);
    } else {
      base = parseInt(d.matricula, 10);
      sufixo = 1;
    }

    // Matrícula base (10 dígitos) + sufixo (2 dígitos) = 12 dígitos
    const matriculaBase = String(base).padStart(12, '0');
    const matriculaCompleta = String(base).padStart(10, '0') + String(sufixo).padStart(2, '0');

    // Evento (10 dígitos)
    const evento = String(d.evento || '2').padStart(10, '0');

    // Valor em centavos (7 dígitos)
    const valorCentavos = Math.round(d.valor * 100);
    const valor = String(valorCentavos).padStart(7, '0');

    // Referência (6 dígitos)
    const referencia = '000001';

    // Sequencial final (6 dígitos)
    const seqFinal = String(seq++).padStart(6, '0');

    // Montar linha: tipo(1) + seq(9) + matBase(12) + matCompleta(12) + evento(10) + comp(6) + valor(7) + ref(6) + seqFinal(6)
    const linha = '2' +
      String(seq).padStart(9, '0') +
      matriculaBase +
      matriculaCompleta +
      evento +
      competencia +
      valor +
      referencia +
      seqFinal;

    linhas.push(linha);
  }

  writeFileSync(join(__dirname, filename), linhas.join('\n'), 'latin1');
  console.log(`✅ ${filename} (${dados.length} linhas, competência: ${competencia})`);
}

// ═══════════════════════════════════════════════════════════════
// GERAR TODOS OS ARQUIVOS
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('🏦 TXT (Banco - formato fixo)');
  console.log('─'.repeat(40));

  gerarTxtBanco('01-banco-basico.txt', dadosBasicos, {
    competencia: '012026',
  });

  gerarTxtBanco('02-banco-fevereiro.txt', dadosVariados, {
    competencia: '022026',
  });

  gerarTxtBanco('03-banco-sem-header.txt', dadosBasicos.slice(0, 3), {
    competencia: '032026',
    incluirHeader: false,
  });

  console.log('');
  console.log('📊 XLSX (Excel)');
  console.log('─'.repeat(40));
  
  gerarXlsx('01-basico.xlsx', dadosBasicos, {
    competencia: '01/2026',
  });

  gerarXlsx('02-com-resumo.xlsx', dadosBasicos, {
    competencia: '02/2026',
    incluirResumo: true,
  });

  gerarXlsx('03-cabecalho-diferente.xlsx', dadosVariados, {
    competencia: '03/2026',
    colunas: ['MAT', 'NOME_SERVIDOR', 'VLR_DESCONTO', 'COD_EVENTO'],
  });

  gerarXlsx('04-multi-aba.xlsx', dadosBasicos, {
    competencia: '04/2026',
    abaExtra: [
      ['Resumo do Período'],
      ['Total de registros:', dadosBasicos.length],
      ['Valor total:', dadosBasicos.reduce((s, d) => s + d.valor, 0).toFixed(2)],
    ],
  });

  console.log('');
  console.log('📄 DOCX (Word)');
  console.log('─'.repeat(40));

  await gerarDocx('01-tabela-simples.docx', dadosBasicos, {
    competencia: '01/2026',
    formato: 'tabela',
  });

  await gerarDocx('02-texto-corrido.docx', dadosBasicos, {
    competencia: '02/2026',
    formato: 'texto',
  });

  await gerarDocx('03-poucos-dados.docx', dadosVariados.slice(0, 2), {
    competencia: '03/2026',
    formato: 'tabela',
  });

  console.log('');
  console.log('📝 CSV');
  console.log('─'.repeat(40));

  gerarCsv('01-virgula.csv', dadosBasicos, {
    competencia: '01/2026',
    delimitador: ',',
  });

  gerarCsv('02-ponto-virgula.csv', dadosBasicos, {
    competencia: '02/2026',
    delimitador: ';',
  });

  gerarCsv('03-tab.csv', dadosVariados, {
    competencia: '03/2026',
    delimitador: '\t',
  });

  console.log('');
  console.log('═'.repeat(40));
  console.log('✨ Todos os arquivos gerados com sucesso!');
  console.log(`📂 Pasta: ${__dirname}`);
}

main().catch(console.error);
