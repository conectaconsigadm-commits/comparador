import { useEffect } from 'react'

interface PrivacyModalProps {
  open: boolean
  onClose: () => void
}

/**
 * Modal de privacidade com informações sobre processamento de dados
 */
export function PrivacyModal({ open, onClose }: PrivacyModalProps) {
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
        aria-labelledby="privacy-title"
      >
        <header className="info-modal-header">
          <h2 id="privacy-title" className="info-modal-title">Privacidade</h2>
          <button className="info-modal-close" onClick={onClose} aria-label="Fechar">
            <CloseIcon />
          </button>
        </header>

        <div className="info-modal-body">
          <section className="info-section">
            <h3>Processamento local</h3>
            <p>
              Todo o processamento acontece no seu navegador. Os arquivos que você
              seleciona são lidos e processados localmente, sem envio para nenhum servidor.
            </p>
          </section>

          <section className="info-section">
            <h3>Nenhum dado é enviado</h3>
            <p>
              O Conecta Consig não envia seus arquivos para a internet. A comparação
              entre banco e prefeitura acontece inteiramente no seu computador ou
              dispositivo móvel.
            </p>
          </section>

          <section className="info-section">
            <h3>Sem armazenamento</h3>
            <p>
              Não armazenamos o conteúdo dos seus arquivos. Os dados ficam apenas
              na memória do navegador durante o uso e são descartados quando você
              fecha a página ou inicia um novo upload.
            </p>
          </section>

          <section className="info-section">
            <h3>Segurança</h3>
            <p>
              Como não há transmissão de dados, não há risco de interceptação
              durante o processamento. O Excel gerado é baixado diretamente
              para o seu dispositivo.
            </p>
          </section>

          <section className="info-section info-section-muted">
            <h3>Sobre métricas e analytics</h3>
            <p>
              Atualmente, o sistema não coleta métricas de uso ou analytics.
              Se isso mudar no futuro, atualizaremos esta página.
            </p>
          </section>
        </div>

        <footer className="info-modal-footer">
          <button className="info-modal-btn" onClick={onClose}>
            Entendi
          </button>
        </footer>
      </div>

      <style>{privacyModalCSS}</style>
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

const privacyModalCSS = `
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

  .info-section-muted {
    padding: 16px;
    background: var(--cc-surface-elevated);
    border-radius: 10px;
    border: 1px solid var(--cc-border);
  }

  .info-section-muted h3 {
    font-size: 13px;
    color: var(--cc-text-muted);
  }

  .info-section-muted p {
    font-size: 13px;
    color: var(--cc-text-muted);
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
