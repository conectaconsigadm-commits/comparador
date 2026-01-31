/**
 * Design Tokens - Conecta Consig
 * 
 * Sistema de design Apple-inspired, minimalista e elegante
 */

export const tokens = {
  // ─────────────────────────────────────────────────────────────
  // CORES
  // ─────────────────────────────────────────────────────────────
  colors: {
    // Fundos
    background: '#f5f7fa',
    backgroundGradient: 'linear-gradient(145deg, #f5f7fa 0%, #e8ecf2 50%, #f0f4f8 100%)',
    
    // Superfícies
    surface: '#ffffff',
    surfaceHover: '#fafbfc',
    surfaceBorder: 'rgba(0, 0, 0, 0.06)',
    
    // Textos
    textPrimary: '#1a1f36',
    textSecondary: '#525f7f',
    textMuted: '#8898aa',
    textInverse: '#ffffff',
    
    // Primária (azul elegante)
    primary: '#0066cc',
    primaryHover: '#0055b3',
    primaryActive: '#004499',
    primaryLight: 'rgba(0, 102, 204, 0.08)',
    
    // Estados
    success: '#34c759',
    successLight: 'rgba(52, 199, 89, 0.1)',
    warning: '#ff9f0a',
    warningLight: 'rgba(255, 159, 10, 0.1)',
    error: '#ff3b30',
    errorLight: 'rgba(255, 59, 48, 0.1)',
    
    // Dropzone
    dropzoneBg: '#f8fafc',
    dropzoneBorder: '#d1d9e6',
    dropzoneActive: 'rgba(0, 102, 204, 0.04)',
    dropzoneActiveBorder: '#0066cc',
  },

  // ─────────────────────────────────────────────────────────────
  // TIPOGRAFIA
  // ─────────────────────────────────────────────────────────────
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Inter, Roboto, sans-serif",
    fontFamilyMono: "'SF Mono', 'Fira Code', 'Consolas', monospace",
    
    // Tamanhos
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.8125rem',   // 13px
      base: '0.9375rem', // 15px
      md: '1rem',        // 16px
      lg: '1.125rem',    // 18px
      xl: '1.375rem',    // 22px
      '2xl': '1.75rem',  // 28px
      '3xl': '2.25rem',  // 36px
    },
    
    // Pesos
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    
    // Line heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.65,
    },
    
    // Letter spacing
    letterSpacing: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.02em',
    },
  },

  // ─────────────────────────────────────────────────────────────
  // ESPAÇAMENTO
  // ─────────────────────────────────────────────────────────────
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    base: '1rem',    // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '2.5rem', // 40px
    '3xl': '3rem',   // 48px
    '4xl': '4rem',   // 64px
  },

  // ─────────────────────────────────────────────────────────────
  // BORDAS
  // ─────────────────────────────────────────────────────────────
  radius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '20px',
    full: '9999px',
  },

  // ─────────────────────────────────────────────────────────────
  // SOMBRAS
  // ─────────────────────────────────────────────────────────────
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
    md: '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
    lg: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
    xl: '0 8px 32px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.05)',
    focus: '0 0 0 3px rgba(0, 102, 204, 0.2)',
  },

  // ─────────────────────────────────────────────────────────────
  // TRANSIÇÕES
  // ─────────────────────────────────────────────────────────────
  transitions: {
    fast: '120ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
  },

  // ─────────────────────────────────────────────────────────────
  // BREAKPOINTS
  // ─────────────────────────────────────────────────────────────
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
} as const

export type Tokens = typeof tokens
