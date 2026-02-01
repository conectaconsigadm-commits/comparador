import { useState, useCallback, type ReactNode } from 'react'
import { useThemeContext } from '../theme/ThemeContext'
import { HelpModal } from '../components/HelpModal'
import { PrivacyModal } from '../components/PrivacyModal'

interface AppShellProps {
  children: ReactNode
  /** Callback quando clicar no logo (volta para Home) */
  onLogoClick?: () => void
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APP SHELL — Layout Principal (Swiss Ledger)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Layout Flexbox com fluxo natural:
 * - Container: min-height: 100vh, flex-direction: column
 * - Header: altura fixa (sticky)
 * - Main: flex: 1 (cresce para preencher)
 * - Footer: estático no final (NUNCA fixed ou absolute)
 * 
 * Sem overflow:hidden — scroll natural do documento
 */
export function AppShell({ children, onLogoClick }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const { isDark, toggleTheme } = useThemeContext()

  const handleLogoClick = useCallback(() => {
    setMenuOpen(false)
    onLogoClick?.()
  }, [onLogoClick])

  const handleOpenHelp = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setMenuOpen(false)
    setHelpOpen(true)
  }, [])

  const handleOpenPrivacy = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setMenuOpen(false)
    setPrivacyOpen(true)
  }, [])

  return (
    <div className="shell">
      {/* ─────────────────────────────────────────────────────────────
          HEADER — Barra superior sticky
          ───────────────────────────────────────────────────────────── */}
      <header className="shell-header">
        <div className="shell-header-inner">
          {/* Logo */}
          <button 
            className="shell-logo" 
            onClick={handleLogoClick}
            title="Voltar ao início"
            aria-label="Voltar ao início"
          >
            <LogoIcon />
            <span className="shell-logo-text">Conecta Consig</span>
          </button>

          {/* Nav Desktop */}
          <div className="shell-nav">
            <nav className="shell-nav-links">
              <a href="#ajuda" className="shell-nav-link" onClick={handleOpenHelp}>
                Ajuda
              </a>
              <a href="#privacidade" className="shell-nav-link" onClick={handleOpenPrivacy}>
                Privacidade
              </a>
            </nav>
            
            <button
              className="shell-theme-btn"
              onClick={toggleTheme}
              aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
              title={isDark ? 'Modo claro' : 'Modo escuro'}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="shell-mobile-actions">
            <button
              className="shell-theme-btn"
              onClick={toggleTheme}
              aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            
            <button
              className="shell-menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <nav className="shell-mobile-menu">
            <a href="#ajuda" className="shell-mobile-link" onClick={handleOpenHelp}>
              Ajuda
            </a>
            <a href="#privacidade" className="shell-mobile-link" onClick={handleOpenPrivacy}>
              Privacidade
            </a>
          </nav>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────
          MAIN — Conteúdo principal (flex: 1)
          ───────────────────────────────────────────────────────────── */}
      <main className="shell-main">{children}</main>

      {/* ─────────────────────────────────────────────────────────────
          FOOTER — Estático no final (position: static)
          ───────────────────────────────────────────────────────────── */}
      <footer className="shell-footer">
        <div className="shell-footer-inner">
          <span className="shell-footer-text">
            Processamento 100% local
          </span>
          <span className="shell-footer-sep">·</span>
          <a href="#privacidade" className="shell-footer-link" onClick={handleOpenPrivacy}>
            Privacidade
          </a>
        </div>
      </footer>

      {/* Modais */}
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <PrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />

      <style>{shellCSS}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ÍCONES — Linhas retas, estilo Swiss
// ═══════════════════════════════════════════════════════════════════════════

function LogoIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <line x1="10" y1="6.5" x2="14" y2="6.5" />
      <line x1="14" y1="6.5" x2="14" y2="14" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="6.76" y2="6.76" />
      <line x1="17.24" y1="17.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="6.76" y2="17.24" />
      <line x1="17.24" y1="6.76" x2="19.07" y2="4.93" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS — Swiss Ledger Layout
// ═══════════════════════════════════════════════════════════════════════════

const shellCSS = `
  /* ═══════════════════════════════════════════════════════════════════════
     SHELL — Container Principal (Flexbox)
     ═══════════════════════════════════════════════════════════════════════ */
  .shell {
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background-color: var(--cc-bg);
    /* CRÍTICO: Sem overflow:hidden — permite scroll natural */
  }

  /* ═══════════════════════════════════════════════════════════════════════
     HEADER — Sticky no topo
     ═══════════════════════════════════════════════════════════════════════ */
  .shell-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--cc-surface);
    border-bottom: 1px solid var(--cc-border);
    flex-shrink: 0;
  }

  .shell-header-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  @media (min-width: 1024px) {
    .shell-header-inner {
      padding: 0 3rem;
    }
  }

  /* Logo */
  .shell-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    margin: -6px -10px;
    background: transparent;
    border: none;
    border-radius: var(--cc-radius-sm);
    cursor: pointer;
    transition: background-color 100ms ease;
  }

  .shell-logo:hover {
    background: var(--cc-surface-hover);
  }

  .shell-logo svg {
    color: var(--cc-text);
  }

  .shell-logo-text {
    font-family: var(--cc-font-heading);
    font-size: 1rem;
    font-weight: 700;
    color: var(--cc-text);
    letter-spacing: -0.01em;
  }

  /* Nav Desktop */
  .shell-nav {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .shell-nav-links {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .shell-nav-link {
    font-family: var(--cc-font-body);
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--cc-text-secondary);
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 4px 0;
    border-bottom: 1px solid transparent;
    transition: color 100ms ease, border-color 100ms ease;
  }

  .shell-nav-link:hover {
    color: var(--cc-text);
    border-color: var(--cc-text);
  }

  /* Theme Button */
  .shell-theme-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    background: transparent;
    border: 1px solid var(--cc-border);
    border-radius: var(--cc-radius-sm);
    cursor: pointer;
    color: var(--cc-text-secondary);
    transition: all 150ms ease;
  }

  .shell-theme-btn:hover {
    background: var(--cc-surface-hover);
    border-color: var(--cc-border-strong);
    color: var(--cc-text);
  }

  /* Mobile Actions */
  .shell-mobile-actions {
    display: none;
    align-items: center;
    gap: 8px;
  }

  .shell-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    background: transparent;
    border: 1px solid var(--cc-border);
    border-radius: var(--cc-radius-sm);
    cursor: pointer;
    color: var(--cc-text-secondary);
    transition: all 150ms ease;
  }

  .shell-menu-btn:hover {
    background: var(--cc-surface-hover);
    border-color: var(--cc-border-strong);
    color: var(--cc-text);
  }

  /* Mobile Menu */
  .shell-mobile-menu {
    display: flex;
    flex-direction: column;
    background: var(--cc-surface);
    border-bottom: 1px solid var(--cc-border);
    padding: 8px 0;
  }

  .shell-mobile-link {
    padding: 12px 1rem;
    font-family: var(--cc-font-body);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--cc-text);
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border-bottom: 1px solid var(--cc-border);
    transition: background-color 100ms ease;
  }

  .shell-mobile-link:last-child {
    border-bottom: none;
  }

  .shell-mobile-link:hover {
    background: var(--cc-surface-hover);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     MAIN — Área de conteúdo (flex: 1)
     ═══════════════════════════════════════════════════════════════════════ */
  .shell-main {
    flex: 1;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    /* Permite crescer e scroll natural */
  }

  @media (min-width: 1024px) {
    .shell-main {
      padding: 2rem 3rem;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     FOOTER — Estático no final (NUNCA fixed ou absolute)
     ═══════════════════════════════════════════════════════════════════════ */
  .shell-footer {
    flex-shrink: 0;
    background: var(--cc-surface);
    border-top: 1px solid var(--cc-border);
    padding: 16px 0;
    /* position: static por padrão — fluxo normal do documento */
  }

  .shell-footer-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .shell-footer-text {
    font-family: var(--cc-font-body);
    font-size: 0.75rem;
    color: var(--cc-text-tertiary);
    letter-spacing: 0.01em;
  }

  .shell-footer-sep {
    color: var(--cc-text-muted);
  }

  .shell-footer-link {
    font-family: var(--cc-font-body);
    font-size: 0.6875rem;
    font-weight: 500;
    color: var(--cc-text-tertiary);
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    transition: color 100ms ease;
  }

  .shell-footer-link:hover {
    color: var(--cc-text);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     RESPONSIVO — Mobile
     ═══════════════════════════════════════════════════════════════════════ */
  @media (max-width: 768px) {
    .shell-header-inner {
      height: 48px;
    }

    .shell-logo-text {
      font-size: 0.875rem;
    }

    .shell-nav {
      display: none;
    }

    .shell-mobile-actions {
      display: flex;
    }

    .shell-main {
      padding: 1.5rem 1rem;
    }

    .shell-footer-inner {
      flex-direction: column;
      gap: 4px;
    }

    .shell-footer-sep {
      display: none;
    }
  }
`
