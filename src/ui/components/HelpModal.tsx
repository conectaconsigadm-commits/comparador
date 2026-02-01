import { useEffect } from 'react'

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

/**
 * Modal de ajuda com informações sobre o sistema
 */
export function HelpModal({ open, onClose }: HelpModalProps) {
  // Fechar com ESC
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Prevenir scroll do body
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="info-modal-overlay" onClick={onClose}>
      <div
        className="info-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
      >
        <header className="info-modal-header">
          <h2 id="help-title" className="info-modal-title">Ajuda</h2>
          <button className="info-modal-close" onClick={onClose} aria-label="Fechar">
            <CloseIcon />
          </button>
        </header>

        <div className="info-modal-body">
          <section className="info-section">
            <h3>O que o sistema faz</h3>
            <p>
              O Conecta Consig compara o arquivo de débito do banco com o relatório
              da prefeitura, identificando divergências, valores que só existem em um
              dos lados e gerando um Excel organizado para conferência.
            </p>
          </section>

          <section className="info-section">
            <h3>Formatos suportados</h3>
            <ul>
              <li><strong>Banco:</strong> TXT (formato fixo de débito)</li>
              <li><strong>Prefeitura:</strong> CSV, XLSX, XLS</li>
              <li><strong>Em fase de teste:</strong> PDF com texto selecionável, DOCX com tabelas</li>
            </ul>
          </section>

          <section className="info-section">
            <h3>O que significa "extração parcial"</h3>
            <p>
              Quando o sistema não consegue ler 100% dos dados (por exemplo, quando
              o PDF tem partes escaneadas ou o XLSX tem formatação incomum), ele
              extrai o que é possível e marca como "parcial". Você pode revisar
              os diagnósticos e decidir se quer continuar.
            </p>
          </section>

          <section className="info-section">
            <h3>O que fazer quando a extração falhar</h3>
            <ul>
              <li>Exporte o relatório da prefeitura como CSV ou XLSX</li>
              <li>Se for PDF escaneado, peça a versão digital ao município</li>
              <li>Verifique se o arquivo não está corrompido ou protegido</li>
              <li>Confira se selecionou o arquivo correto</li>
            </ul>
          </section>

          <section className="info-section">
            <h3>Dúvidas ou problemas</h3>
            <p>
              Se encontrar algum erro ou precisar de ajuda, entre em contato com
              o suporte da sua instituição.
            </p>
          </section>
        </div>

        <footer className="info-modal-footer">
          <button className="info-modal-btn" onClick={onClose}>
            Entendi
          </button>
        </footer>
      </div>

      <style>{infoModalCSS}</style>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

const infoModalCSS = `
  .info-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1100;
    padding: 16px;
    animation: infoModalFadeIn 0.2s ease-out;
  }

  @keyframes infoModalFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .info-modal-container {
    background: var(--cc-surface);
    border: 1px solid var(--cc-border);
    border-radius: 16px;
    box-shadow: var(--cc-shadow-xl);
    width: 100%;
    max-width: 560px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    animation: infoModalSlideUp 0.2s ease-out;
  }

  @keyframes infoModalSlideUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .info-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--cc-border);
  }

  .info-modal-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--cc-text);
    margin: 0;
  }

  .info-modal-close {
    background: none;
    border: none;
    padding: 6px;
    border-radius: 6px;
    cursor: pointer;
    color: var(--cc-text-secondary);
    transition: all 0.15s;
  }

  .info-modal-close:hover {
    background: var(--cc-surface-hover);
    color: var(--cc-text);
  }

  .info-modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }

  .info-section {
    margin-bottom: 24px;
  }

  .info-section:last-child {
    margin-bottom: 0;
  }

  .info-section h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--cc-text);
    margin: 0 0 8px;
  }

  .info-section p {
    font-size: 14px;
    color: var(--cc-text-secondary);
    line-height: 1.6;
    margin: 0;
  }

  .info-section ul {
    margin: 0;
    padding-left: 20px;
    font-size: 14px;
    color: var(--cc-text-secondary);
    line-height: 1.8;
  }

  .info-section li {
    margin-bottom: 4px;
  }

  .info-section strong {
    color: var(--cc-text);
    font-weight: 500;
  }

  .info-modal-footer {
    display: flex;
    justify-content: flex-end;
    padding: 16px 24px;
    border-top: 1px solid var(--cc-border);
  }

  .info-modal-btn {
    padding: 10px 24px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    background: var(--cc-primary);
    color: white;
    transition: all 0.15s;
  }

  .info-modal-btn:hover {
    background: var(--cc-primary-hover);
  }

  @media (max-width: 640px) {
    .info-modal-container {
      max-height: 95vh;
    }

    .info-modal-header {
      padding: 16px 20px;
    }

    .info-modal-body {
      padding: 20px;
    }

    .info-modal-footer {
      padding: 12px 20px;
    }
  }
`
