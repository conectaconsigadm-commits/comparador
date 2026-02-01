# Bateria de Fixtures - PrefeituraExtractor

Esta pasta contém fixtures de teste para validar o `PrefeituraExtractor` e todo o pipeline de extração de dados da prefeitura.

## Estrutura

```
testdata/prefeitura/
├── manifest.json              # Lista de casos de teste + expected results
├── types.ts                   # Tipos TypeScript para o manifest
├── fixturesRunner.test.ts     # Runner de testes (vitest)
├── README.md                  # Este arquivo
├── csv/                       # Arquivos CSV de teste
│   ├── 01-separador-virgula.csv
│   ├── 02-separador-ponto-virgula.csv
│   ├── 03-matricula-irregular.csv
│   └── 04-valores-rs.csv
├── text/                      # Textos de referência (simulando PDF/DOCX)
│   ├── pdf-01-text-ok.txt
│   ├── pdf-02-mixed-lowtext.txt
│   ├── pdf-03-scan-empty.txt
│   ├── docx-01-table-ok.txt
│   ├── docx-02-text-ok.txt
│   ├── docx-03-table-broken.txt
│   ├── mixed-01-multiplos-valores.txt
│   ├── mixed-02-sem-competencia.txt
│   └── mixed-03-sem-evento.txt
├── xlsx/                      # Arquivos XLSX (gerados em memória)
│   └── (gerados pelo XlsxGenerator.ts)
└── generator/                 # Geradores de arquivos
    ├── index.ts
    ├── XlsxGenerator.ts       # Gera XLSX em memória
    └── DocxGenerator.ts       # Gera DOCX em memória
```

## Executando os Testes

### Todos os testes (incluindo fixtures)

```bash
npm test
```

### Apenas as fixtures

```bash
npm test -- testdata/prefeitura/fixturesRunner.test.ts
```

### Modo watch (desenvolvimento)

```bash
npm run test:watch -- testdata/prefeitura/fixturesRunner.test.ts
```

### Testes binários opcionais (PDF/DOCX reais)

```bash
RUN_BINARY_FIXTURES=1 npm test
```

## Relatório de Execução

Ao final da execução, é exibido um relatório no console:

```
==============================================================================================================
RELATÓRIO DE FIXTURES - PrefeituraExtractor
==============================================================================================================
Timestamp: 2026-01-31T22:09:58.554Z
Total: 16 | Passou: 16 | Falhou: 0 | Pulado: 0 | Erros: 0
Tempo total: 190ms
--------------------------------------------------------------------------------------------------------------
Arquivo                                 Kind    Formato             Rows  Yield   Comp      Sev     Status
--------------------------------------------------------------------------------------------------------------
csv/01-separador-virgula.csv            csv     csv_report_v1       5     100%    01/2026   info    ✓ PASSED
csv/02-separador-ponto-virgula.csv      csv     csv_report_v1       5     100%    02/2026   info    ✓ PASSED
...
==============================================================================================================
```

## Casos de Teste (16 total)

### CSV (4 casos)

| ID | Arquivo | Descrição | Expected Rows |
|---|---|---|---|
| csv-01 | 01-separador-virgula.csv | CSV padrão com valores 1.234,56 | 5 |
| csv-02 | 02-separador-ponto-virgula.csv | CSV com separador ; | 5 |
| csv-03 | 03-matricula-irregular.csv | Matrículas com formatos variados | 4 |
| csv-04 | 04-valores-rs.csv | Valores com prefixo R$ | 4 |

### XLSX (3 casos)

| ID | Arquivo | Descrição | Expected Rows |
|---|---|---|---|
| xlsx-01 | 01-cabecalho-variado.xlsx | Headers variados (MAT, VALOR) | 5 |
| xlsx-02 | 02-planilha-errada-primeiro.xlsx | Dados na segunda aba | 3 |
| xlsx-03 | 03-valor-texto-numero.xlsx | Valores como texto e número | 4 |

### Text/PDF (3 casos)

| ID | Arquivo | Descrição | Expected Rows |
|---|---|---|---|
| text-pdf-01 | pdf-01-text-ok.txt | Texto bem estruturado | 5 |
| text-pdf-02 | pdf-02-mixed-lowtext.txt | Colunas separadas | 3 |
| text-pdf-03 | pdf-03-scan-empty.txt | PDF escaneado (falha) | 0 |

### Text/DOCX (3 casos)

| ID | Arquivo | Descrição | Expected Rows |
|---|---|---|---|
| text-docx-01 | docx-01-table-ok.txt | Tabela bem estruturada | 5 |
| text-docx-02 | docx-02-text-ok.txt | Texto corrido | 4 |
| text-docx-03 | docx-03-table-broken.txt | Tabela quebrada | 2 |

### Text/Mixed (3 casos)

| ID | Arquivo | Descrição | Expected |
|---|---|---|---|
| text-mixed-01 | mixed-01-multiplos-valores.txt | Múltiplos valores por linha | 3+ rows |
| text-mixed-02 | mixed-02-sem-competencia.txt | Sem competência detectável | Warning |
| text-mixed-03 | mixed-03-sem-evento.txt | Sem evento detectável | Warning |

## Campos do Expected Result

| Campo | Tipo | Descrição |
|---|---|---|
| `success` | boolean | Se a extração deve ser bem sucedida |
| `minRows` | number | Número mínimo de linhas esperadas |
| `minYield` | number | Taxa mínima de aproveitamento (0-1) |
| `competencia` | string | Competência esperada (MM/AAAA) |
| `sampleMatriculas` | string[] | Matrículas que devem estar presentes |
| `sampleValores` | number[] | Valores que devem estar presentes |
| `mustHaveDiagnostics` | string[] | Diagnósticos que DEVEM aparecer |
| `mustNotHaveErrors` | boolean | Se não deve ter erros |

## Adicionando Novos Casos de Teste

1. Crie o arquivo de teste na pasta apropriada (`csv/`, `text/`)
2. Para XLSX, adicione os dados no `generator/XlsxGenerator.ts`
3. Adicione uma entrada no `manifest.json`:

```json
{
  "id": "novo-caso",
  "file": "csv/novo-arquivo.csv",
  "kind": "csv",
  "format": "csv_report_v1",
  "description": "Descrição do caso de teste",
  "expected": {
    "success": true,
    "minRows": 5,
    "minYield": 0.9,
    "competencia": "01/2026",
    "mustNotHaveErrors": true
  }
}
```

## Notas Técnicas

### Por que arquivos .txt para PDF e DOCX?

Os testes usam arquivos `.txt` simulando o texto extraído de PDFs e DOCXs para evitar:
1. Dependência do `pdfjs-dist` que precisa de DOM (não disponível em testes Node.js)
2. Complexidade de gerar PDFs reais
3. Arquivos binários grandes no repositório

Isso permite testar a lógica de parsing de texto (`parseTextReport`) de forma isolada e rápida.

### Arquivos XLSX são gerados em memória

Os arquivos XLSX são gerados dinamicamente pelo `XlsxGenerator.ts` usando a biblioteca `xlsx`. Isso permite:
1. Controle preciso sobre o conteúdo
2. Variações fáceis de criar
3. Sem arquivos binários no repositório

## Diagnósticos Validados

| Código | Severidade | Significado |
|---|---|---|
| `TEXT_ZERO_ROWS` | error | Nenhuma linha extraída |
| `TEXT_COLUMN_MISMATCH` | warn | Número de matrículas ≠ valores |
| `TEXT_COMPETENCIA_NOT_FOUND` | warn | Competência não detectada |
| `TEXT_EVENT_NOT_FOUND` | warn | Nenhum evento detectado |
| `CSV_DELIMITER_DETECTED` | info | Delimitador detectado |
| `CSV_PARSE_SUMMARY` | info | Resumo da extração CSV |
| `CSV_NO_ROWS` | error | Nenhuma linha extraída do CSV |
