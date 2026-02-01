/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONECTA CONSIG — DESIGN SYSTEM "SWISS LEDGER"
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Filosofia: Analítico • Tipografia Expressiva • Alta Densidade • Papel e Tinta
 * Inspiração: Relatórios financeiros suíços, tipografia editorial, design brutalista
 * 
 * Princípios:
 * 1. Conteúdo > Decoração — sem sombras difusas, sem gradientes, sem blur
 * 2. Tipografia como estrutura — serifas para autoridade, mono para dados
 * 3. Bordas honestas — linhas de 1px, cantos retos (0-2px radius)
 * 4. Cor como informação — vermelho=alerta, azul=ação, preto=conteúdo
 */

// ─────────────────────────────────────────────────────────────────────────────
// PALETA DE CORES — "PAPER & INK"
// ─────────────────────────────────────────────────────────────────────────────

export const colors = {
  // Fundos — papel de qualidade
  background: {
    base: '#F4F4F0',        // Off-white/Papel — fundo principal
    surface: '#FFFFFF',      // Branco puro — cards e áreas de conteúdo
    elevated: '#FFFFFF',     // Superfícies elevadas (modais)
    muted: '#ECECEA',        // Áreas secundárias
  },

  // Texto — tinta de alta qualidade
  text: {
    primary: '#111111',      // Quase preto — contraste máximo
    secondary: '#3D3D3D',    // Cinza escuro — texto de suporte
    tertiary: '#6B6B6B',     // Cinza médio — metadados
    muted: '#999999',        // Cinza claro — placeholders
    inverse: '#FFFFFF',      // Texto sobre fundos escuros
  },

  // Bordas — linhas finas e precisas
  border: {
    default: '#E2E2E2',      // Borda padrão — hairline
    strong: '#CCCCCC',       // Borda enfatizada
    dark: '#111111',         // Borda de destaque
  },

  // Cores funcionais — usadas com EXTREMA parcimônia
  accent: {
    action: '#1A73E8',       // Azul Link — CTAs e links
    actionHover: '#1557B0',  // Azul hover
    alert: '#D93025',        // Vermelho Alerta — erros e avisos críticos
    alertLight: '#FCECEA',   // Fundo para alertas
    success: '#137333',      // Verde contido — sucesso
    successLight: '#E6F4EA', // Fundo para sucesso
    warning: '#B06000',      // Laranja queimado — avisos
    warningLight: '#FEF7E0', // Fundo para avisos
    info: '#1967D2',         // Azul informativo
    infoLight: '#E8F0FE',    // Fundo para info
  },

  // Estados interativos
  interactive: {
    hover: 'rgba(0, 0, 0, 0.04)',      // Hover sutil
    active: 'rgba(0, 0, 0, 0.08)',     // Estado ativo
    selected: 'rgba(26, 115, 232, 0.08)', // Seleção
    focus: 'rgba(26, 115, 232, 0.2)',  // Focus ring
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// TIPOGRAFIA — "MODERN EDITORIAL"
// ─────────────────────────────────────────────────────────────────────────────

export const typography = {
  // Famílias tipográficas — HÍBRIDO: Serif para headings, Sans para UI
  fontFamily: {
    // Serifada para headings (H1, H2) — sofisticação e autoridade
    heading: "'Georgia', 'Times New Roman', 'Cambria', serif",
    
    // Sans-serif moderna para corpo/UI/labels — legibilidade e modernidade
    body: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
    
    // Monospace APENAS para dados numéricos
    mono: "'SF Mono', 'Fira Code', 'Consolas', 'Monaco', monospace",
  },

  // Escala tipográfica (modular)
  fontSize: {
    '2xs': '0.6875rem',   // 11px — microcopy
    'xs': '0.75rem',      // 12px — labels pequenos
    'sm': '0.8125rem',    // 13px — texto auxiliar
    'base': '0.9375rem',  // 15px — corpo de texto
    'md': '1rem',         // 16px — texto padrão
    'lg': '1.125rem',     // 18px — subtítulos
    'xl': '1.375rem',     // 22px — títulos de seção
    '2xl': '1.75rem',     // 28px — títulos principais
    '3xl': '2.25rem',     // 36px — display
    '4xl': '3rem',        // 48px — hero
  },

  // Pesos
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Alturas de linha
  lineHeight: {
    tight: 1.15,      // Headings
    snug: 1.3,        // Subtítulos
    normal: 1.5,      // Corpo
    relaxed: 1.65,    // Leitura longa
  },

  // Espaçamento entre letras
  letterSpacing: {
    tighter: '-0.03em',  // Display type
    tight: '-0.01em',    // Headings
    normal: '0',         // Body
    wide: '0.02em',      // Labels uppercase
    wider: '0.05em',     // All caps
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// ESPAÇAMENTO — GRID DE 4PX
// ─────────────────────────────────────────────────────────────────────────────

export const spacing = {
  '0': '0',
  'px': '1px',
  '0.5': '2px',
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '8': '32px',
  '10': '40px',
  '12': '48px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// BORDAS — MODERN EDITORIAL (Suavizadas)
// ─────────────────────────────────────────────────────────────────────────────

export const borders = {
  // Border radius — suave e moderno (não afiado)
  radius: {
    none: '0px',       // Casos especiais
    xs: '4px',         // Elementos pequenos (badges)
    sm: '6px',         // Inputs, dropdowns
    md: '8px',         // Cards, botões (padrão)
    lg: '12px',        // Cards grandes, modais
    xl: '16px',        // Containers principais
    full: '9999px',    // Pills, avatares
  },

  // Larguras de borda
  width: {
    hairline: '1px',   // Padrão
    regular: '1px',    // Padrão
    thick: '2px',      // Ênfase
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// SOMBRAS — ELIMINADAS (usando bordas)
// ─────────────────────────────────────────────────────────────────────────────

export const shadows = {
  // Sem sombras difusas — usar bordas sólidas
  none: 'none',
  
  // Focus ring — única exceção
  focus: '0 0 0 2px rgba(26, 115, 232, 0.25)',
  
  // Sombra mínima para dropdown/modal se absolutamente necessário
  dropdown: '0 2px 8px rgba(0, 0, 0, 0.12)',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// TRANSIÇÕES — RÁPIDAS E FUNCIONAIS
// ─────────────────────────────────────────────────────────────────────────────

export const transitions = {
  fast: '100ms ease',
  normal: '150ms ease',
  slow: '250ms ease',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// BREAKPOINTS
// ─────────────────────────────────────────────────────────────────────────────

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1440px',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────────────────────────────────────────

export const layout = {
  maxWidth: '1120px',
  contentWidth: '720px',
  sidebarWidth: '280px',
  topbarHeight: '56px',
  actionBarHeight: '72px',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT CONSOLIDADO
// ─────────────────────────────────────────────────────────────────────────────

export const theme = {
  colors,
  typography,
  spacing,
  borders,
  shadows,
  transitions,
  breakpoints,
  layout,
} as const

export type Theme = typeof theme
