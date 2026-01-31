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
    <div style={styles.wrapper}>
      {/* Topbar */}
      <header style={styles.topbar}>
        <div style={styles.topbarInner}>
          {/* Logo */}
          <div style={styles.logo}>
            <LogoIcon />
            <span style={styles.logoText}>Conecta Consig</span>
          </div>

          {/* Desktop nav */}
          <nav style={styles.desktopNav}>
            <a href="#ajuda" style={styles.navLink}>
              Ajuda
            </a>
            <a href="#privacidade" style={styles.navLink}>
              Privacidade
            </a>
          </nav>

          {/* Mobile menu button */}
          <button
            style={styles.menuButton}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <MenuIcon />
          </button>
        </div>
      </header>

      {/* Mobile menu (sem funcionalidade real) */}
      {menuOpen && (
        <div style={styles.mobileMenu}>
          <a href="#ajuda" style={styles.mobileNavLink}>
            Ajuda
          </a>
          <a href="#privacidade" style={styles.mobileNavLink}>
            Privacidade
          </a>
        </div>
      )}

      {/* Main content */}
      <main style={styles.main}>{children}</main>
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
// ESTILOS
// ─────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },

  topbar: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: `1px solid ${tokens.colors.surfaceBorder}`,
  },

  topbarInner: {
    maxWidth: '1120px',
    margin: '0 auto',
    padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },

  logoText: {
    fontSize: tokens.typography.fontSize.md,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.textPrimary,
    letterSpacing: tokens.typography.letterSpacing.tight,
  },

  desktopNav: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.lg,
  },

  navLink: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.textSecondary,
    textDecoration: 'none',
    transition: `color ${tokens.transitions.fast}`,
  },

  menuButton: {
    display: 'none',
    padding: tokens.spacing.sm,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: tokens.colors.textSecondary,
  },

  mobileMenu: {
    display: 'none',
    flexDirection: 'column',
    padding: tokens.spacing.base,
    backgroundColor: tokens.colors.surface,
    borderBottom: `1px solid ${tokens.colors.surfaceBorder}`,
  },

  mobileNavLink: {
    padding: `${tokens.spacing.md} ${tokens.spacing.base}`,
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.textPrimary,
    textDecoration: 'none',
  },

  main: {
    flex: 1,
    maxWidth: '1120px',
    width: '100%',
    margin: '0 auto',
    padding: `${tokens.spacing.xl} ${tokens.spacing.lg}`,
  },
}

// Injetar estilos responsivos
if (typeof document !== 'undefined') {
  const styleId = 'appshell-responsive'
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style')
    styleEl.id = styleId
    styleEl.textContent = `
      @media (max-width: 768px) {
        .appshell-desktop-nav { display: none !important; }
        .appshell-menu-btn { display: flex !important; }
        .appshell-mobile-menu { display: flex !important; }
      }
    `
    document.head.appendChild(styleEl)
  }
}
