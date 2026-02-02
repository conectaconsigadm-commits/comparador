import { useState, useEffect, useRef, type DragEvent, type ChangeEvent } from 'react'
import { InlineBanner } from '../components/InlineBanner'
import { BankParser } from '../../core/bank/BankParser'
import { PrefeituraExtractor } from '../../core/prefeitura/PrefeituraExtractor'
import { getFormatoNome } from '../../core/domain/bancos'
import type { BankParsedData, PrefeituraParsedData } from '../state/appState'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface BankStats {
  lines: number
  competencia?: string
  ok: boolean
  diagnosticsCount: number
}

interface PrefStats {
  extracted: number
  competencia?: string
  formato: string
  extracao: 'completa' | 'parcial' | 'falhou'
  diagnosticsCount: number
  isUnknownFormat: boolean
}

interface UploadScreenProps {
  onGenerate?: () => void
  onBankParsed?: (data: BankParsedData | null) => void
  onPrefParsed?: (data: PrefeituraParsedData | null) => void
  canGenerate?: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
// UPLOAD SCREEN — Swiss Ledger Design
// ═══════════════════════════════════════════════════════════════════════════

export function UploadScreen({
  onGenerate,
  onBankParsed,
  onPrefParsed,
  canGenerate: canGenerateProp,
}: UploadScreenProps) {
  // Arquivos
  const [bankFile, setBankFile] = useState<File | null>(null)
  const [prefFile, setPrefFile] = useState<File | null>(null)

  // Stats após leitura
  const [bankStats, setBankStats] = useState<BankStats | null>(null)
  const [prefStats, setPrefStats] = useState<PrefStats | null>(null)

  // Loading
  const [bankLoading, setBankLoading] = useState(false)
  const [prefLoading, setPrefLoading] = useState(false)

  // Usar prop se fornecida, senão calcular localmente
  const canGenerate =
    canGenerateProp !== undefined
      ? canGenerateProp
      : bankStats?.ok && prefStats?.extracao !== 'falhou' && !prefStats?.isUnknownFormat

  // ─────────────────────────────────────────────────────────────────────────
  // LEITURA DO BANCO (TXT)
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!bankFile) {
      setBankStats(null)
      onBankParsed?.(null)
      return
    }

    const parser = new BankParser()
    setBankLoading(true)

    parser
      .parse(bankFile)
      .then((result) => {
        const stats: BankStats = {
          lines: result.rows.length,
          competencia: result.competencia,
          ok: result.rows.length > 0,
          diagnosticsCount: result.diagnostics.length,
        }
        setBankStats(stats)

        onBankParsed?.({
          rows: result.rows,
          diagnostics: result.diagnostics,
          competencia: result.competencia,
          lines: result.rows.length,
        })
      })
      .catch(() => {
        setBankStats({ lines: 0, ok: false, diagnosticsCount: 1 })
        onBankParsed?.(null)
      })
      .finally(() => {
        setBankLoading(false)
      })
  }, [bankFile, onBankParsed])

  // ─────────────────────────────────────────────────────────────────────────
  // LEITURA DA PREFEITURA
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!prefFile) {
      setPrefStats(null)
      onPrefParsed?.(null)
      return
    }

    const extractor = new PrefeituraExtractor()
    setPrefLoading(true)

    extractor
      .extract(prefFile)
      .then((result) => {
        let extracao: 'completa' | 'parcial' | 'falhou' = 'completa'
        const hasErrors = result.diagnostics.some((d) => d.severity === 'error')
        const isUnknownFormat = result.formato === 'unknown'

        if (result.rows.length === 0 || isUnknownFormat) {
          extracao = 'falhou'
        } else if (hasErrors) {
          extracao = 'parcial'
        }

        const formatoDisplay =
          result.formato === 'csv_report_v1'
            ? 'CSV'
            : result.formato === 'unknown'
            ? 'Desconhecido'
            : result.formato

        const stats: PrefStats = {
          extracted: result.rows.length,
          competencia: result.competencia,
          formato: formatoDisplay,
          extracao,
          diagnosticsCount: result.diagnostics.length,
          isUnknownFormat,
        }
        setPrefStats(stats)

        onPrefParsed?.({
          rows: result.rows,
          diagnostics: result.diagnostics,
          competencia: result.competencia,
          formato: result.formato,
          extracted: result.rows.length,
          extracao,
        })
      })
      .catch(() => {
        setPrefStats({
          extracted: 0,
          formato: 'Erro',
          extracao: 'falhou',
          diagnosticsCount: 1,
          isUnknownFormat: true,
        })
        onPrefParsed?.(null)
      })
      .finally(() => {
        setPrefLoading(false)
      })
  }, [prefFile, onPrefParsed])

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  const handleGenerate = () => {
    onGenerate?.()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="upload">
      {/* ═══════════════════════════════════════════════════════════════════
          LAYOUT PRINCIPAL — 2 colunas
          Esquerda: Título + Cards
          Direita: Uploads + Botão
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="upload-grid">
        {/* ─────────────────────────────────────────────────────────────────
            COLUNA ESQUERDA — Título + Instruções + Você vai receber
            ───────────────────────────────────────────────────────────────── */}
        <div className="upload-left">
          <header className="upload-header">
            <h1 className="upload-title">VALIDAR CONSIGNADOS</h1>
            <p className="upload-subtitle">
              Depósito de arquivos para reconciliação automática.
            </p>
          </header>

          {/* Card: Instruções */}
          <div className="upload-card">
            <h3 className="upload-card-title">INSTRUÇÕES</h3>
            <ol className="upload-card-list">
              <li>O <strong>arquivo do banco</strong> é o TXT de débitos.</li>
              <li>O <strong>arquivo da prefeitura</strong> é a folha de consignados.</li>
              <li>Você receberá um <strong>Excel</strong> com o cruzamento.</li>
            </ol>
          </div>

          {/* Card: Você vai receber */}
          <div className="upload-card">
            <h3 className="upload-card-title">VOCÊ VAI RECEBER</h3>
            <ul className="upload-result-tags">
              <li>Resumo</li>
              <li>Bateram</li>
              <li>Só Banco</li>
              <li>Só Prefeitura</li>
              <li>Divergências</li>
              <li>Diagnósticos</li>
            </ul>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            COLUNA DIREITA — Uploads + Botão
            ───────────────────────────────────────────────────────────────── */}
        <div className="upload-right">
          {/* Área 1: Arquivo do Banco */}
          <UploadZone
            label="ARQUIVO DO BANCO"
            sublabel="Arquivo de débito em formato TXT"
            accept=".txt"
            icon="txt"
            file={bankFile}
            onFile={setBankFile}
            loading={bankLoading}
            status={
              bankStats
                ? bankStats.ok
                  ? { type: 'success', text: `${bankStats.lines} linhas lidas` }
                  : { type: 'error', text: 'Erro na leitura' }
                : undefined
            }
            meta={bankStats?.competencia ? `Competência: ${bankStats.competencia}` : undefined}
          />

          {/* Área 2: Arquivo da Prefeitura */}
          <UploadZone
            label="ARQUIVO DA PREFEITURA"
            sublabel="CSV, XLS, XLSX, PDF ou DOCX"
            accept=".csv,.xls,.xlsx,.pdf,.docx"
            icon="sheet"
            file={prefFile}
            onFile={setPrefFile}
            loading={prefLoading}
            status={
              prefStats
                ? prefStats.isUnknownFormat
                  ? { type: 'error', text: 'Formato não suportado' }
                  : prefStats.extracao === 'falhou'
                  ? { type: 'error', text: 'Extração falhou' }
                  : prefStats.extracao === 'parcial'
                  ? { type: 'warning', text: `${prefStats.extracted} linhas (parcial)` }
                  : { type: 'success', text: `${prefStats.extracted} linhas extraídas` }
                : undefined
            }
            meta={
              prefStats?.competencia
                ? `Competência: ${prefStats.competencia}`
                : undefined
            }
          />

          {/* Banner de erro se formato não suportado */}
          {prefStats?.isUnknownFormat && (
            <InlineBanner variant="warning" title="Formato não suportado">
              Por enquanto aceitamos apenas CSV. Converta o arquivo para CSV e tente novamente.
            </InlineBanner>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              BOTÃO DE AÇÃO — Inline, alinhado à esquerda
              ───────────────────────────────────────────────────────────────── */}
          {/* Botão Gerar Relatório */}
          <div className="upload-action">
            <button
              type="button"
              className="upload-btn"
              onClick={handleGenerate}
              disabled={!canGenerate}
            >
              Gerar Relatório
            </button>
            <span className="upload-action-hint">
              <LockIcon /> Processamento local. Nada é enviado para servidor.
            </span>
          </div>
        </div>
      </div>

      <style>{uploadCSS}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: UploadZone — Área de drop individual
// ═══════════════════════════════════════════════════════════════════════════

interface UploadZoneProps {
  label: string
  sublabel: string
  accept: string
  icon: 'txt' | 'sheet'
  file: File | null
  onFile: (file: File | null) => void
  loading?: boolean
  status?: { type: 'success' | 'warning' | 'error'; text: string }
  meta?: string
}

function UploadZone({
  label,
  sublabel,
  accept,
  icon,
  file,
  onFile,
  loading,
  status,
  meta,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const acceptedExtensions = accept.split(',').map((ext) => ext.trim().toLowerCase())

  const validateFile = (f: File): boolean => {
    const fileName = f.name.toLowerCase()
    const isValid = acceptedExtensions.some((ext) => fileName.endsWith(ext))
    if (!isValid) {
      setError(`Use: ${acceptedExtensions.join(', ')}`)
      return false
    }
    setError(null)
    return true
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && validateFile(droppedFile)) {
      onFile(droppedFile)
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    if (selectedFile && validateFile(selectedFile)) {
      onFile(selectedFile)
    }
    e.target.value = ''
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleRemove = () => {
    onFile(null)
    setError(null)
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toUpperCase() || ''
    return ext
  }

  const zoneClass = [
    'zone',
    isDragging && 'zone--dragging',
    file && 'zone--has-file',
    error && 'zone--error',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="upload-zone-wrapper">
      <div className="upload-zone-header">
        <span className="upload-zone-label">{label}</span>
        <span className="upload-zone-sublabel">{sublabel}</span>
      </div>

      <div
        className={zoneClass}
        onClick={file ? undefined : handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          style={{ display: 'none' }}
        />

        {file ? (
          <div className="zone-file">
            <div className="zone-file-info">
              {getFileIcon(file.name)}
              <div className="zone-file-details">
                <span className="zone-file-name" title={file.name}>{file.name}</span>
                <span className="zone-file-size">{formatSize(file.size)}</span>
              </div>
            </div>
            <div className="zone-file-actions">
              {status && (
                <span className={`zone-status zone-status--${status.type}`}>
                  {status.text}
                </span>
              )}
              <button type="button" className="zone-link" onClick={handleClick}>
                Trocar
              </button>
              <button type="button" className="zone-link zone-link--remove" onClick={handleRemove}>
                Remover
              </button>
            </div>
          </div>
        ) : (
          <div className="zone-empty">
            {icon === 'txt' ? <TxtIcon /> : <SheetIcon />}
            <div className="zone-empty-text">
              <span className="zone-empty-cta">Arraste ou clique para selecionar</span>
            </div>
          </div>
        )}

        {loading && <div className="zone-loading" />}
      </div>

      {meta && <div className="upload-zone-meta">{meta}</div>}
      {error && <div className="upload-zone-error">{error}</div>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ÍCONES — Grandes para dropzone vazia
// ═══════════════════════════════════════════════════════════════════════════

function TxtIcon() {
  return (
    <div className="zone-icon">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
      </svg>
    </div>
  )
}

function SheetIcon() {
  return (
    <div className="zone-icon">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <rect x="7" y="12" width="10" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1" />
        <line x1="10" y1="12" x2="10" y2="19" strokeWidth="1" />
        <line x1="7" y1="15.5" x2="17" y2="15.5" strokeWidth="1" />
      </svg>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ÍCONES — Por tipo de arquivo (coloridos)
// ═══════════════════════════════════════════════════════════════════════════

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  
  switch (ext) {
    case 'xlsx':
    case 'xls':
      return <ExcelIconSmall />
    case 'csv':
      return <CsvIconSmall />
    case 'pdf':
      return <PdfIconSmall />
    case 'docx':
    case 'doc':
      return <WordIconSmall />
    case 'txt':
    default:
      return <TxtIconSmall />
  }
}

function TxtIconSmall() {
  return (
    <div className="zone-icon-small zone-icon-txt">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="12" y2="17" />
      </svg>
    </div>
  )
}

function ExcelIconSmall() {
  return (
    <div className="zone-icon-small zone-icon-excel">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="#107C41" />
        <polyline points="14 2 14 8 20 8" fill="#21A366" stroke="#21A366" strokeWidth="1" />
        <text x="12" y="16" fontSize="7" fontWeight="bold" textAnchor="middle" fill="white">X</text>
      </svg>
    </div>
  )
}

function CsvIconSmall() {
  return (
    <div className="zone-icon-small zone-icon-csv">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="#107C41" />
        <polyline points="14 2 14 8 20 8" fill="#21A366" stroke="#21A366" strokeWidth="1" />
        <text x="12" y="16" fontSize="5" fontWeight="bold" textAnchor="middle" fill="white">CSV</text>
      </svg>
    </div>
  )
}

function PdfIconSmall() {
  return (
    <div className="zone-icon-small zone-icon-pdf">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="#DC2626" />
        <polyline points="14 2 14 8 20 8" fill="#EF4444" stroke="#EF4444" strokeWidth="1" />
        <text x="12" y="16" fontSize="5" fontWeight="bold" textAnchor="middle" fill="white">PDF</text>
      </svg>
    </div>
  )
}

function WordIconSmall() {
  return (
    <div className="zone-icon-small zone-icon-word">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="#2563EB" />
        <polyline points="14 2 14 8 20 8" fill="#3B82F6" stroke="#3B82F6" strokeWidth="1" />
        <text x="12" y="16" fontSize="7" fontWeight="bold" textAnchor="middle" fill="white">W</text>
      </svg>
    </div>
  )
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS — Modern Editorial Style (Pixel-Perfect Final)
// ═══════════════════════════════════════════════════════════════════════════

const uploadCSS = `
  /* ═══════════════════════════════════════════════════════════════════════
     UPLOAD — Container Centralizado (tendência ao topo - optical center)
     ═══════════════════════════════════════════════════════════════════════ */
  .upload {
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
    min-height: calc(100vh - 160px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 24px 0 48px 0;
    margin-top: -40px; /* Optical center - leve tendência ao topo */
  }

  /* ═══════════════════════════════════════════════════════════════════════
     GRID — Centralizado verticalmente (Desktop)
     ═══════════════════════════════════════════════════════════════════════ */
  .upload-grid {
    display: flex;
    gap: 48px;
    align-items: center;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     COLUNA ESQUERDA — Contexto (mais compacta)
     ═══════════════════════════════════════════════════════════════════════ */
  .upload-left {
    flex: 0 0 300px;
    display: flex;
    flex-direction: column;
  }

  .upload-header {
    margin: 0 0 24px 0;
  }

  /* H1 — Sans-Serif, SemiBold */
  .upload-title {
    font-family: var(--cc-font-body);
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--cc-text);
    letter-spacing: -0.02em;
    line-height: 1.2;
    margin: 0 0 8px 0;
    padding: 0;
  }

  .upload-subtitle {
    font-family: var(--cc-font-body);
    font-size: 0.9375rem;
    color: var(--cc-text-tertiary);
    line-height: 1.5;
    margin: 0;
  }

  /* Cards — Compactos e limpos */
  .upload-card {
    background: var(--cc-surface);
    border: 1px solid var(--cc-border);
    border-radius: 12px;
    padding: 16px 18px;
    margin-bottom: 12px;
  }

  .upload-card:last-child {
    margin-bottom: 0;
  }

  .upload-card-title {
    font-family: var(--cc-font-body);
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--cc-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0 0 10px 0;
  }

  .upload-card-list {
    font-family: var(--cc-font-body);
    font-size: 0.875rem;
    color: var(--cc-text-secondary);
    line-height: 1.6;
    margin: 0;
    padding-left: 18px;
  }

  .upload-card-list li {
    margin-bottom: 4px;
  }

  .upload-card-list li:last-child {
    margin-bottom: 0;
  }

  .upload-card-list strong {
    font-weight: 500;
    color: var(--cc-text);
  }

  /* Tags → Pills compactos */
  .upload-result-tags {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .upload-result-tags li {
    font-family: var(--cc-font-body);
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--cc-text-secondary);
    background: var(--cc-bg-muted, var(--cc-bg));
    padding: 4px 10px;
    border-radius: 99px;
    border: 1px solid var(--cc-border);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     COLUNA DIREITA — Ação (gap compacto)
     ═══════════════════════════════════════════════════════════════════════ */
  .upload-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     UPLOAD ZONE — Dropzones com vida
     ═══════════════════════════════════════════════════════════════════════ */
  .upload-zone-wrapper {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .upload-zone-header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    /* Mesmo line-height que o H1 para alinhamento */
    line-height: 1;
  }

  .upload-zone-label {
    font-family: var(--cc-font-body);
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--cc-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    line-height: 1;
  }

  .upload-zone-sublabel {
    font-family: var(--cc-font-body);
    font-size: 0.8125rem;
    color: var(--cc-text-tertiary);
    line-height: 1;
  }

  /* Dropzone — Compacto e elegante (140px) */
  .zone {
    position: relative;
    min-height: 140px;
    padding: 24px;
    background: var(--cc-surface);
    border: 2px dashed var(--cc-border);
    border-radius: 12px;
    cursor: pointer;
    transition: all 180ms ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .zone:hover {
    border-style: solid;
    border-color: var(--cc-primary);
    background: var(--cc-primary-light);
    transform: scale(1.005);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }

  .zone--dragging {
    border-style: solid;
    border-color: var(--cc-primary);
    background: var(--cc-primary-light);
    transform: scale(1.01);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  }

  .zone--has-file {
    cursor: default;
    border-style: solid;
    border-color: var(--cc-border);
    border-width: 1px;
    min-height: 80px;
    background: var(--cc-surface);
  }

  .zone--error {
    border-color: var(--cc-error);
  }

  /* Ícone — Tamanho equilibrado */
  .zone-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: var(--cc-bg-muted, var(--cc-bg));
    border-radius: 10px;
    flex-shrink: 0;
    transition: all 180ms ease;
  }

  .zone:hover .zone-icon {
    background: var(--cc-primary-light);
  }

  .zone-icon svg {
    color: var(--cc-text-tertiary);
    width: 24px;
    height: 24px;
  }

  .zone:hover .zone-icon svg {
    color: var(--cc-primary);
  }

  /* Ícone pequeno para arquivo carregado */
  .zone-icon-small {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: var(--cc-bg-muted, var(--cc-bg));
    border-radius: 8px;
    flex-shrink: 0;
  }

  .zone-icon-small svg {
    color: var(--cc-text-tertiary);
  }

  /* Zone Empty State */
  .zone-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    text-align: center;
  }

  .zone-empty-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .zone-empty-cta {
    font-family: var(--cc-font-body);
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--cc-text-secondary);
  }
  
  .zone:hover .zone-empty-cta {
    color: var(--cc-primary);
  }

  /* Zone File State — Layout fixo que não quebra */
  .zone-file {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 16px;
    width: 100%;
  }

  .zone-file-info {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    overflow: hidden;
  }

  .zone-file-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    overflow: hidden;
  }

  .zone-file-name {
    font-family: var(--cc-font-body);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--cc-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .zone-file-size {
    font-family: var(--cc-font-mono);
    font-size: 0.6875rem;
    color: var(--cc-text-muted);
  }

  .zone-file-type {
    font-family: var(--cc-font-body);
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--cc-text-muted);
    background: var(--cc-bg-muted);
    padding: 2px 6px;
    border-radius: 4px;
    margin-left: 8px;
  }

  .zone-file-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .zone-status {
    font-family: var(--cc-font-body);
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 4px 10px;
    border-radius: 6px;
    white-space: nowrap;
  }

  .zone-status--success {
    color: #059669;
    background: #ECFDF5;
  }

  .zone-status--warning {
    color: #D97706;
    background: #FFFBEB;
  }

  .zone-status--error {
    color: var(--cc-error);
    background: var(--cc-danger-light);
  }

  .zone-link {
    font-family: var(--cc-font-body);
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--cc-primary);
    text-decoration: underline;
    text-underline-offset: 2px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .zone-link:hover {
    color: var(--cc-primary-hover);
  }

  .zone-link--remove {
    color: var(--cc-text-tertiary);
  }

  .zone-link--remove:hover {
    color: var(--cc-error);
  }

  /* Loading bar */
  .zone-loading {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--cc-primary);
    animation: zone-loading 1.5s ease-in-out infinite;
  }

  @keyframes zone-loading {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(0%); }
    100% { transform: translateX(100%); }
  }

  .upload-zone-meta {
    font-family: var(--cc-font-mono);
    font-size: 0.6875rem;
    color: var(--cc-text-tertiary);
  }

  .upload-zone-error {
    font-family: var(--cc-font-body);
    font-size: 0.75rem;
    color: var(--cc-error);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     ACTION — Botão Compacto (altura 48px)
     ═══════════════════════════════════════════════════════════════════════ */
  .upload-action {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 8px;
  }

  .upload-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 48px;
    
    font-family: var(--cc-font-body);
    font-size: 0.9375rem;
    font-weight: 500;
    letter-spacing: 0.01em;
    
    color: #FFFFFF;
    background: var(--cc-primary);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    
    transition: all 180ms ease;
  }

  .upload-btn:hover:not(:disabled) {
    background: var(--cc-primary-hover);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    transform: translateY(-1px);
  }

  .upload-btn:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: none;
  }

  /* Disabled State */
  .upload-btn:disabled {
    background: var(--cc-border);
    color: var(--cc-text-muted);
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  .upload-action-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-family: var(--cc-font-body);
    font-size: 0.75rem;
    color: var(--cc-text-muted);
  }


  /* ═══════════════════════════════════════════════════════════════════════
     RESPONSIVO — Mobile: Cards primeiro, Instruções depois
     ═══════════════════════════════════════════════════════════════════════ */
  @media (max-width: 900px) {
    .upload {
      margin-top: 0;
    }

    .upload-grid {
      flex-direction: column;
      gap: 28px;
      align-items: stretch;
    }

    /* Mobile: Cards (direita) aparecem PRIMEIRO */
    .upload-right {
      flex: none;
      width: 100%;
      order: 1;
    }

    /* Mobile: Instruções (esquerda) aparecem DEPOIS */
    .upload-left {
      flex: none;
      width: 100%;
      order: 2;
    }

    .upload-title {
      font-size: 1.375rem;
    }

    .upload-header {
      margin-bottom: 16px;
    }
  }

  @media (max-width: 640px) {
    .upload {
      min-height: auto;
      padding: 16px 0;
    }

    .upload-title {
      font-size: 1.25rem;
    }

    .upload-subtitle {
      font-size: 0.8125rem;
    }

    .upload-card {
      padding: 14px 16px;
    }

    .zone {
      min-height: 120px;
      padding: 20px;
    }

    .zone:hover {
      transform: none;
    }

    .zone-icon {
      width: 44px;
      height: 44px;
    }

    .zone-icon svg {
      width: 22px;
      height: 22px;
    }

    .zone-file {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }

    .zone-file-name {
      max-width: 200px;
    }

    .upload-btn {
      height: 48px;
    }

    .upload-result-tags li {
      font-size: 0.6875rem;
      padding: 4px 10px;
    }
  }
`
