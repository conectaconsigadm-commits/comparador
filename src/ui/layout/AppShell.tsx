import { useState, type ReactNode } from 'react'
import { tokens } from '../styles/tokens'

interface AppShellProps {
  children: ReactNode
}

/**
 * Layout base da aplicação
 * Topbar + Container centralizado
 */
export function AppShell({ children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="app-shell">
      {/* Topbar */}
      <header className="app-topbar">
        <div className="app-topbar-inner">
          {/* Logo */}
          <div className="app-logo">
            <LogoIcon />
            <span className="app-logo-text">Conecta Consig</span>
          </div>

          {/* Desktop nav */}
          <nav className="app-nav-desktop">
            <a href="#ajuda" className="app-nav-link">
              Ajuda
            </a>
            <a href="#privacidade" className="app-nav-link">
              Privacidade
            </a>
          </nav>

          {/* Mobile menu button */}
          <button
            className="app-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <MenuIcon />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="app-mobile-menu">
          <a href="#ajuda" className="app-mobile-link">
            Ajuda
          </a>
          <a href="#privacidade" className="app-mobile-link">
            Privacidade
          </a>
        </div>
      )}

      {/* Main content */}
      <main className="app-main">{children}</main>

      <style>{appShellCSS}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ÍCONES
// ─────────────────────────────────────────────────────────────

function LogoIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke={tokens.colors.primary}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────

const appShellCSS = `
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-topbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid ${tokens.colors.surfaceBorder};
  }

  .app-topbar-inner {
    max-width: 1120px;
    margin: 0 auto;
    padding: ${tokens.spacing.md} ${tokens.spacing.lg};
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .app-logo {
    display: flex;
    align-items: center;
    gap: ${tokens.spacing.sm};
  }

  .app-logo-text {
    font-size: ${tokens.typography.fontSize.md};
    font-weight: ${tokens.typography.fontWeight.semibold};
    color: ${tokens.colors.textPrimary};
    letter-spacing: ${tokens.typography.letterSpacing.tight};
  }

  .app-nav-desktop {
    display: flex;
    align-items: center;
    gap: ${tokens.spacing.lg};
  }

  .app-nav-link {
    font-size: ${tokens.typography.fontSize.sm};
    font-weight: ${tokens.typography.fontWeight.medium};
    color: ${tokens.colors.textSecondary};
    text-decoration: none;
    transition: color ${tokens.transitions.fast};
  }

  .app-nav-link:hover {
    color: ${tokens.colors.primary};
  }

  .app-menu-btn {
    display: none;
    padding: ${tokens.spacing.sm};
    background-color: transparent;
    border: none;
    cursor: pointer;
    color: ${tokens.colors.textSecondary};
  }

  .app-mobile-menu {
    display: flex;
    flex-direction: column;
    padding: ${tokens.spacing.base};
    background-color: ${tokens.colors.surface};
    border-bottom: 1px solid ${tokens.colors.surfaceBorder};
  }

  .app-mobile-link {
    padding: ${tokens.spacing.md} ${tokens.spacing.base};
    font-size: ${tokens.typography.fontSize.base};
    color: ${tokens.colors.textPrimary};
    text-decoration: none;
  }

  .app-main {
    flex: 1;
    max-width: 1120px;
    width: 100%;
    margin: 0 auto;
    padding: ${tokens.spacing.xl} ${tokens.spacing.lg};
  }

  /* Mobile */
  @media (max-width: 768px) {
    .app-topbar-inner {
      padding: ${tokens.spacing.sm} ${tokens.spacing.base};
    }

    .app-logo-text {
      font-size: ${tokens.typography.fontSize.sm};
    }

    .app-nav-desktop {
      display: none;
    }

    .app-menu-btn {
      display: flex;
    }

    .app-main {
      padding: ${tokens.spacing.lg} ${tokens.spacing.base};
    }
  }
`
