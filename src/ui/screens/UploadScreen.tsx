import { useState } from 'react'
import { tokens } from '../styles/tokens'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { FileDrop } from '../components/FileDrop'

/**
 * Tela 1 - Upload de arquivos
 * Seleção de arquivo do banco (TXT) e prefeitura (CSV/XLS/XLSX/PDF/DOCX)
 */
export function UploadScreen() {
  const [bankFile, setBankFile] = useState<File | null>(null)
  const [prefFile, setPrefFile] = useState<File | null>(null)

  const canGenerate = bankFile !== null && prefFile !== null

  const handleGenerate = () => {
    // Por enquanto não faz nada (sem processamento real)
    console.log('Gerar relatório:', { bankFile, prefFile })
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>Conecta Consig</h1>
        <p style={styles.subtitle}>Validador Banco × Prefeitura</p>
      </header>

      {/* Main Card - Upload */}
      <Card style={styles.mainCard}>
        <div style={styles.uploadGrid}>
          {/* Banco */}
          <FileDrop
            label="Arquivo do banco (TXT)"
            hint="Arquivo TXT com dados de débito"
            accept=".txt"
            file={bankFile}
            onFile={setBankFile}
          />

          {/* Prefeitura */}
          <FileDrop
            label="Arquivo da prefeitura"
            hint="CSV, XLS, XLSX, PDF ou DOCX"
            accept=".csv,.xls,.xlsx,.pdf,.docx"
            file={prefFile}
            onFile={setPrefFile}
          />
        </div>

        {/* Footer */}
        <div style={styles.cardFooter}>
          <p style={styles.privacyNote}>
            <LockIcon />
            Processamento acontece no seu navegador. Arquivos não são enviados.
          </p>
          <Button
            variant="primary"
            disabled={!canGenerate}
            onClick={handleGenerate}
            style={styles.generateButton}
          >
            Gerar relatório
          </Button>
        </div>
      </Card>

      {/* Como funciona */}
      <Card style={styles.infoCard} padding="md">
        <h3 style={styles.infoTitle}>Como funciona</h3>
        <ul style={styles.infoList}>
          <li>Selecione o arquivo TXT do banco e o relatório da prefeitura</li>
          <li>O sistema cruza os dados por matrícula e valor, identificando divergências</li>
          <li>Baixe o relatório Excel com o resultado completo da conciliação</li>
        </ul>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ÍCONE
// ─────────────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg
      width="14"
      height="14"
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

// ─────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: `${tokens.spacing['3xl']} ${tokens.spacing.lg}`,
  },

  header: {
    textAlign: 'center',
    marginBottom: tokens.spacing.xl,
  },

  title: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.textPrimary,
    letterSpacing: tokens.typography.letterSpacing.tight,
    marginBottom: tokens.spacing.xs,
  },

  subtitle: {
    fontSize: tokens.typography.fontSize.md,
    color: tokens.colors.textMuted,
    fontWeight: tokens.typography.fontWeight.normal,
  },

  mainCard: {
    marginBottom: tokens.spacing.lg,
  },

  uploadGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
  },

  cardFooter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacing.base,
    paddingTop: tokens.spacing.lg,
    borderTop: `1px solid ${tokens.colors.surfaceBorder}`,
  },

  privacyNote: {
    display: 'flex',
    alignItems: 'center',
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.textMuted,
    textAlign: 'center',
  },

  generateButton: {
    minWidth: '200px',
  },

  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },

  infoTitle: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.md,
  },

  infoList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.sm,
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.textSecondary,
    lineHeight: tokens.typography.lineHeight.relaxed,
    paddingLeft: 0,
  },
}

// Adicionar bullet points customizados via CSS inline
const bulletStyle = `
  .info-list li::before {
    content: '→';
    margin-right: 8px;
    color: ${tokens.colors.primary};
  }
`

// Injetar estilo
if (typeof document !== 'undefined') {
  const styleEl = document.getElementById('upload-screen-styles') || document.createElement('style')
  styleEl.id = 'upload-screen-styles'
  styleEl.textContent = bulletStyle
  if (!document.getElementById('upload-screen-styles')) {
    document.head.appendChild(styleEl)
  }
}
