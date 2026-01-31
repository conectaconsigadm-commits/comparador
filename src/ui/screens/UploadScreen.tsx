import { useState, useEffect } from 'react'
import { tokens } from '../styles/tokens'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { FileUploadCard } from '../components/FileUploadCard'
import { BankParser } from '../../core/bank/BankParser'
import { PrefeituraExtractor } from '../../core/prefeitura/PrefeituraExtractor'
import type { KeyValueItem } from '../components/KeyValueList'

// ─────────────────────────────────────────────────────────────
// TIPOS DE ESTADO
// ─────────────────────────────────────────────────────────────

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
}

interface UploadScreenProps {
  onGenerate?: (data: {
    bankLines: number
    prefFormat: string
    prefExtracted: number
    showPartialWarning: boolean
  }) => void
}

/**
 * Tela 1 - Upload de arquivos (Mockup 2)
 * Layout 2 colunas com leitura real dos arquivos
 */
export function UploadScreen({ onGenerate }: UploadScreenProps) {
  // Arquivos
  const [bankFile, setBankFile] = useState<File | null>(null)
  const [prefFile, setPrefFile] = useState<File | null>(null)

  // Stats após leitura
  const [bankStats, setBankStats] = useState<BankStats | null>(null)
  const [prefStats, setPrefStats] = useState<PrefStats | null>(null)

  // Loading
  const [bankLoading, setBankLoading] = useState(false)
  const [prefLoading, setPrefLoading] = useState(false)

  const canGenerate = bankStats?.ok && prefStats?.extracao !== 'falhou'

  // ─────────────────────────────────────────────────────────────
  // LEITURA DO BANCO (TXT)
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!bankFile) {
      setBankStats(null)
      return
    }

    const parser = new BankParser()
    setBankLoading(true)

    parser
      .parse(bankFile)
      .then((result) => {
        setBankStats({
          lines: result.rows.length,
          competencia: result.competencia,
          ok: result.rows.length > 0,
          diagnosticsCount: result.diagnostics.length,
        })
      })
      .catch(() => {
        setBankStats({
          lines: 0,
          ok: false,
          diagnosticsCount: 1,
        })
      })
      .finally(() => {
        setBankLoading(false)
      })
  }, [bankFile])

  // ─────────────────────────────────────────────────────────────
  // LEITURA DA PREFEITURA
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!prefFile) {
      setPrefStats(null)
      return
    }

    const extractor = new PrefeituraExtractor()
    setPrefLoading(true)

    extractor
      .extract(prefFile)
      .then((result) => {
        let extracao: 'completa' | 'parcial' | 'falhou' = 'completa'
        const hasErrors = result.diagnostics.some((d) => d.severity === 'error')
        if (result.rows.length === 0) {
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

        setPrefStats({
          extracted: result.rows.length,
          competencia: result.competencia,
          formato: formatoDisplay,
          extracao,
          diagnosticsCount: result.diagnostics.length,
        })
      })
      .catch(() => {
        setPrefStats({
          extracted: 0,
          formato: 'Erro',
          extracao: 'falhou',
          diagnosticsCount: 1,
        })
      })
      .finally(() => {
        setPrefLoading(false)
      })
  }, [prefFile])

  // ─────────────────────────────────────────────────────────────
  // MÉTRICAS PARA OS CARDS
  // ─────────────────────────────────────────────────────────────

  const bankMetrics: KeyValueItem[] | undefined = bankStats
    ? [
        { label: 'Linhas lidas', value: bankStats.lines, icon: 'bullet' },
        {
          label: 'Competência detectada',
          value: bankStats.competencia,
          icon: 'bullet',
        },
      ]
    : undefined

  const prefMetrics: KeyValueItem[] | undefined = prefStats
    ? [
        { label: 'Linhas extraídas', value: prefStats.extracted, icon: 'bullet' },
        {
          label: 'Extração',
          value: prefStats.extracao,
          icon: 'bullet',
        },
      ]
    : undefined

  // ─────────────────────────────────────────────────────────────
  // HANDLER
  // ─────────────────────────────────────────────────────────────

  const handleGenerate = () => {
    if (onGenerate && bankStats && prefStats) {
      onGenerate({
        bankLines: bankStats.lines,
        prefFormat: prefStats.formato,
        prefExtracted: prefStats.extracted,
        showPartialWarning: prefStats.extracao === 'parcial',
      })
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="upload-screen">
      {/* Header */}
      <header className="upload-header">
        <h1 className="upload-title">Validar consignados</h1>
        <p className="upload-subtitle">
          Envie o TXT do banco e o arquivo da prefeitura. Baixe um Excel com o
          resultado.
        </p>
      </header>

      {/* Grid principal */}
      <div className="upload-grid">
        {/* Coluna esquerda - Cards de upload */}
        <div className="upload-left">
          {/* Card 1: TXT do banco */}
          <FileUploadCard
            title="TXT do banco (obrigatório)"
            stepNumber={1}
            accept=".txt"
            hint="Arquivo de débito do banco"
            file={bankFile}
            onFile={setBankFile}
            loading={bankLoading}
            badge={
              bankStats
                ? bankStats.ok
                  ? { text: 'Lido com sucesso', variant: 'success' }
                  : { text: 'Erro na leitura', variant: 'error' }
                : undefined
            }
            metrics={bankMetrics}
            formatInfo={bankStats ? 'Formato: TXT fixo' : undefined}
          />

          {/* Card 2: Arquivo da prefeitura */}
          <FileUploadCard
            title="Arquivo da prefeitura (obrigatório)"
            stepNumber={2}
            accept=".csv,.xls,.xlsx,.pdf,.docx"
            hint="CSV, XLS, XLSX, PDF ou DOCX"
            file={prefFile}
            onFile={setPrefFile}
            loading={prefLoading}
            badge={
              prefStats
                ? prefStats.extracao === 'falhou'
                  ? { text: 'Extração falhou', variant: 'error' }
                  : prefStats.extracao === 'parcial'
                  ? { text: `Formato: ${prefStats.formato}`, variant: 'warning' }
                  : { text: `Formato: ${prefStats.formato}`, variant: 'info' }
                : undefined
            }
            metrics={prefMetrics}
            formatInfo={
              prefStats?.competencia
                ? `Competência: ${prefStats.competencia}`
                : undefined
            }
            showPreviewLink={!!prefStats}
          />

          {/* Botão Gerar */}
          <div className="upload-generate">
            <Button
              variant="primary"
              disabled={!canGenerate}
              onClick={handleGenerate}
              style={{ width: '100%', maxWidth: '320px', padding: '14px 24px' }}
            >
              Gerar relatório
            </Button>
            <p className="upload-privacy">
              <LockIcon />
              Processamento local. Nada é enviado para servidor.
            </p>
          </div>
        </div>

        {/* Coluna direita - Informações */}
        <aside className="upload-right">
          {/* Como funciona */}
          <Card padding="md">
            <h3 className="upload-info-title">Como funciona</h3>
            <ul className="upload-bullet-list">
              <li>O TXT do banco é a referência.</li>
              <li>O arquivo da prefeitura pode variar.</li>
              <li>O sistema compara e gera um Excel para conferência.</li>
            </ul>
          </Card>

          {/* Você vai baixar */}
          <Card padding="md">
            <h3 className="upload-info-title">Você vai baixar</h3>
            <ul className="upload-download-list">
              <li>
                <CheckIcon /> Resumo
              </li>
              <li>
                <CheckIcon /> Bateu
              </li>
              <li>
                <CheckIcon /> Só no banco
              </li>
              <li>
                <CheckIcon /> Só na prefeitura
              </li>
              <li>
                <CheckIcon /> Divergências
              </li>
              <li>
                <CheckIcon /> Diagnósticos
              </li>
            </ul>
          </Card>

          {/* Ilustração */}
          <div className="upload-illustration">
            <IllustrationSVG />
          </div>
        </aside>
      </div>

      <style>{uploadScreenCSS}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ÍCONES
// ─────────────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ marginRight: '6px', flexShrink: 0 }}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={tokens.colors.success}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ marginRight: '8px', flexShrink: 0 }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IllustrationSVG() {
  return (
    <svg
      width="180"
      height="120"
      viewBox="0 0 180 120"
      fill="none"
      style={{ opacity: 0.7, maxWidth: '100%', height: 'auto' }}
    >
      <rect
        x="20"
        y="30"
        width="50"
        height="65"
        rx="4"
        fill="#e8ecf2"
        stroke="#c8cfd8"
        strokeWidth="1"
      />
      <rect x="28" y="42" width="34" height="3" rx="1.5" fill="#b8c0cc" />
      <rect x="28" y="50" width="28" height="3" rx="1.5" fill="#b8c0cc" />
      <rect x="28" y="58" width="32" height="3" rx="1.5" fill="#b8c0cc" />
      <rect x="28" y="66" width="20" height="3" rx="1.5" fill="#b8c0cc" />

      <rect
        x="110"
        y="30"
        width="50"
        height="65"
        rx="4"
        fill="#e8ecf2"
        stroke="#c8cfd8"
        strokeWidth="1"
      />
      <rect x="118" y="42" width="34" height="3" rx="1.5" fill="#b8c0cc" />
      <rect x="118" y="50" width="28" height="3" rx="1.5" fill="#b8c0cc" />
      <rect x="118" y="58" width="32" height="3" rx="1.5" fill="#b8c0cc" />
      <rect x="118" y="66" width="20" height="3" rx="1.5" fill="#b8c0cc" />

      <path
        d="M75 62 L90 55 L90 47 L105 62 L90 77 L90 69 L75 62"
        fill={tokens.colors.primary}
        opacity="0.6"
      />

      <circle cx="90" cy="100" r="12" fill={tokens.colors.success} opacity="0.15" />
      <path
        d="M84 100 L88 104 L96 96"
        stroke={tokens.colors.success}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────

const uploadScreenCSS = `
  .upload-screen {
    width: 100%;
  }

  .upload-header {
    margin-bottom: ${tokens.spacing.xl};
  }

  .upload-title {
    font-size: 1.875rem;
    font-weight: ${tokens.typography.fontWeight.bold};
    color: ${tokens.colors.textPrimary};
    letter-spacing: ${tokens.typography.letterSpacing.tight};
    margin-bottom: ${tokens.spacing.xs};
  }

  .upload-subtitle {
    font-size: ${tokens.typography.fontSize.md};
    color: ${tokens.colors.textSecondary};
    line-height: ${tokens.typography.lineHeight.relaxed};
    max-width: 480px;
  }

  .upload-grid {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: ${tokens.spacing.xl};
    align-items: start;
  }

  .upload-left {
    display: flex;
    flex-direction: column;
    gap: ${tokens.spacing.lg};
  }

  .upload-right {
    display: flex;
    flex-direction: column;
    gap: ${tokens.spacing.lg};
  }

  .upload-generate {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${tokens.spacing.md};
    padding-top: ${tokens.spacing.base};
  }

  .upload-privacy {
    display: flex;
    align-items: center;
    font-size: ${tokens.typography.fontSize.xs};
    color: ${tokens.colors.textMuted};
    text-align: center;
  }

  .upload-info-title {
    font-size: ${tokens.typography.fontSize.sm};
    font-weight: ${tokens.typography.fontWeight.semibold};
    color: ${tokens.colors.textPrimary};
    margin-bottom: ${tokens.spacing.md};
  }

  .upload-bullet-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: ${tokens.spacing.sm};
    font-size: ${tokens.typography.fontSize.sm};
    color: ${tokens.colors.textSecondary};
    line-height: ${tokens.typography.lineHeight.relaxed};
  }

  .upload-bullet-list li::before {
    content: '→';
    margin-right: 8px;
    color: ${tokens.colors.primary};
  }

  .upload-download-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: ${tokens.typography.fontSize.sm};
    color: ${tokens.colors.textSecondary};
  }

  .upload-download-list li {
    display: flex;
    align-items: center;
  }

  .upload-illustration {
    display: flex;
    justify-content: center;
    padding: ${tokens.spacing.lg};
  }

  /* Tablet */
  @media (max-width: 900px) {
    .upload-grid {
      grid-template-columns: 1fr;
      gap: ${tokens.spacing.lg};
    }

    .upload-right {
      order: 2;
    }
  }

  /* Mobile */
  @media (max-width: 640px) {
    .upload-header {
      margin-bottom: ${tokens.spacing.lg};
    }

    .upload-title {
      font-size: 1.5rem;
    }

    .upload-subtitle {
      font-size: ${tokens.typography.fontSize.sm};
    }

    .upload-grid {
      gap: ${tokens.spacing.base};
    }

    .upload-left {
      gap: ${tokens.spacing.base};
    }

    .upload-right {
      gap: ${tokens.spacing.base};
    }

    .upload-illustration {
      padding: ${tokens.spacing.base};
    }

    .upload-illustration svg {
      max-width: 160px;
    }
  }
`
