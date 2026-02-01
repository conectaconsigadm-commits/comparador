import { useThemeContext } from '../theme/ThemeContext'

type IllustrationName = 'upload' | 'processing' | 'result'
type IllustrationSize = 'sm' | 'md' | 'lg'

interface IllustrationProps {
  name: IllustrationName
  size?: IllustrationSize
  className?: string
}

const sizeMap: Record<IllustrationSize, { width: number; height: number }> = {
  sm: { width: 120, height: 100 },
  md: { width: 180, height: 140 },
  lg: { width: 240, height: 180 },
}

/**
 * Componente de ilustração com fallback SVG inline
 * Escolhe automaticamente versão light/dark baseado no tema
 */
export function Illustration({ name, size = 'md', className }: IllustrationProps) {
  const { isDark } = useThemeContext()
  const dimensions = sizeMap[size]

  // Renderiza SVG inline como fallback (sempre funciona, sem dependência de arquivo)
  return (
    <div 
      className={className}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        opacity: 0.85,
      }}
    >
      {name === 'upload' && <UploadIllustration {...dimensions} isDark={isDark} />}
      {name === 'processing' && <ProcessingIllustration {...dimensions} isDark={isDark} />}
      {name === 'result' && <ResultIllustration {...dimensions} isDark={isDark} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ILUSTRAÇÕES SVG (inline, sem dependência externa)
// ─────────────────────────────────────────────────────────────

interface IllustrationSvgProps {
  width: number
  height: number
  isDark: boolean
}

function UploadIllustration({ width, height, isDark }: IllustrationSvgProps) {
  const colors = isDark ? {
    bg: '#1e293b',
    bgLight: '#334155',
    accent: '#3b82f6',
    accentLight: 'rgba(59, 130, 246, 0.25)',
    line: '#475569',
    lineLight: '#64748b',
    check: '#10b981',
    shadow: 'rgba(0, 0, 0, 0.3)',
  } : {
    bg: '#ffffff',
    bgLight: '#f8fafc',
    accent: '#0070f3',
    accentLight: 'rgba(0, 112, 243, 0.12)',
    line: '#cbd5e1',
    lineLight: '#e2e8f0',
    check: '#059669',
    shadow: 'rgba(0, 0, 0, 0.08)',
  }

  return (
    <svg width={width} height={height} viewBox="0 0 180 140" fill="none">
      {/* Background glow */}
      <ellipse cx="90" cy="70" rx="70" ry="50" fill={colors.accentLight} opacity="0.5" />
      
      {/* Document 1 - Banco */}
      <g filter="url(#shadow1)">
        <rect x="22" y="28" width="54" height="70" rx="8" fill={colors.bg} />
        <rect x="22" y="28" width="54" height="70" rx="8" stroke={colors.line} strokeWidth="1" />
      </g>
      <rect x="22" y="28" width="54" height="16" rx="8" fill={colors.accent} opacity="0.1" />
      <rect x="22" y="28" width="54" height="16" rx="8" fill="none" stroke={colors.line} strokeWidth="1" />
      <circle cx="32" cy="36" r="3" fill={colors.accent} opacity="0.6" />
      <rect x="40" y="34" width="28" height="4" rx="2" fill={colors.line} />
      <rect x="30" y="52" width="38" height="3" rx="1.5" fill={colors.lineLight} />
      <rect x="30" y="60" width="32" height="3" rx="1.5" fill={colors.lineLight} />
      <rect x="30" y="68" width="36" height="3" rx="1.5" fill={colors.lineLight} />
      <rect x="30" y="76" width="24" height="3" rx="1.5" fill={colors.lineLight} />
      <rect x="30" y="84" width="30" height="3" rx="1.5" fill={colors.lineLight} />
      
      {/* Document 2 - Prefeitura */}
      <g filter="url(#shadow1)">
        <rect x="104" y="28" width="54" height="70" rx="8" fill={colors.bg} />
        <rect x="104" y="28" width="54" height="70" rx="8" stroke={colors.line} strokeWidth="1" />
      </g>
      <rect x="104" y="28" width="54" height="16" rx="8" fill={colors.check} opacity="0.1" />
      <rect x="104" y="28" width="54" height="16" rx="8" fill="none" stroke={colors.line} strokeWidth="1" />
      <circle cx="114" cy="36" r="3" fill={colors.check} opacity="0.6" />
      <rect x="122" y="34" width="28" height="4" rx="2" fill={colors.line} />
      <rect x="112" y="52" width="38" height="3" rx="1.5" fill={colors.lineLight} />
      <rect x="112" y="60" width="32" height="3" rx="1.5" fill={colors.lineLight} />
      <rect x="112" y="68" width="36" height="3" rx="1.5" fill={colors.lineLight} />
      <rect x="112" y="76" width="24" height="3" rx="1.5" fill={colors.lineLight} />
      <rect x="112" y="84" width="30" height="3" rx="1.5" fill={colors.lineLight} />
      
      {/* Connecting arrows */}
      <path d="M80 55 L90 55 M90 50 L98 55 L90 60" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8" />
      <path d="M80 65 L90 65 M90 60 L98 65 L90 70" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.6" />
      <path d="M80 75 L90 75 M90 70 L98 75 L90 80" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.4" />
      
      {/* Success badge */}
      <circle cx="90" cy="112" r="16" fill={colors.check} opacity="0.15" />
      <circle cx="90" cy="112" r="12" fill={colors.check} opacity="0.2" />
      <path d="M83 112 L87 116 L97 106" stroke={colors.check} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      
      {/* Decorative elements */}
      <circle cx="25" cy="18" r="2.5" fill={colors.accent} opacity="0.5" />
      <circle cx="155" cy="22" r="3" fill={colors.accent} opacity="0.4" />
      <circle cx="165" cy="95" r="2" fill={colors.check} opacity="0.4" />
      <circle cx="15" cy="80" r="2" fill={colors.accent} opacity="0.3" />
      
      <defs>
        <filter id="shadow1" x="-4" y="-2" width="66" height="82" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={colors.shadow} floodOpacity="1" />
        </filter>
      </defs>
    </svg>
  )
}

function ProcessingIllustration({ width, height, isDark }: IllustrationSvgProps) {
  const colors = isDark ? {
    bg: '#1e293b',
    bgLight: '#334155',
    accent: '#3b82f6',
    accentLight: 'rgba(59, 130, 246, 0.2)',
    line: '#475569',
    lineLight: '#64748b',
    check: '#10b981',
    checkBg: 'rgba(16, 185, 129, 0.25)',
    shadow: 'rgba(0, 0, 0, 0.3)',
  } : {
    bg: '#ffffff',
    bgLight: '#f8fafc',
    accent: '#0070f3',
    accentLight: 'rgba(0, 112, 243, 0.12)',
    line: '#cbd5e1',
    lineLight: '#e2e8f0',
    check: '#059669',
    checkBg: 'rgba(5, 150, 105, 0.15)',
    shadow: 'rgba(0, 0, 0, 0.08)',
  }

  return (
    <svg width={width} height={height} viewBox="0 0 200 150" fill="none">
      {/* Background glow */}
      <ellipse cx="100" cy="75" rx="60" ry="45" fill={colors.accentLight} opacity="0.5" />
      
      {/* Clipboard shadow */}
      <rect x="58" y="24" width="84" height="106" rx="10" fill={colors.shadow} opacity="0.3" />
      
      {/* Clipboard */}
      <rect x="55" y="20" width="90" height="110" rx="10" fill={colors.bg} />
      <rect x="55" y="20" width="90" height="110" rx="10" stroke={colors.line} strokeWidth="1" />
      
      {/* Clip top */}
      <rect x="78" y="10" width="44" height="18" rx="6" fill={colors.bgLight} stroke={colors.line} strokeWidth="1" />
      <rect x="86" y="16" width="28" height="6" rx="3" fill={colors.line} />
      
      {/* Progress header */}
      <rect x="55" y="20" width="90" height="20" rx="10" fill={colors.accent} opacity="0.08" />
      
      {/* Lines with varying lengths */}
      <rect x="68" y="48" width="64" height="4" rx="2" fill={colors.lineLight} />
      <rect x="68" y="58" width="52" height="4" rx="2" fill={colors.lineLight} />
      <rect x="68" y="68" width="58" height="4" rx="2" fill={colors.lineLight} />
      <rect x="68" y="78" width="42" height="4" rx="2" fill={colors.lineLight} />
      
      {/* Check circles - completed steps */}
      <circle cx="75" cy="100" r="11" fill={colors.checkBg} />
      <circle cx="75" cy="100" r="8" fill={colors.check} opacity="0.2" />
      <path d="M70 100 L73 103 L80 96" stroke={colors.check} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      
      <circle cx="100" cy="100" r="11" fill={colors.checkBg} />
      <circle cx="100" cy="100" r="8" fill={colors.check} opacity="0.2" />
      <path d="M95 100 L98 103 L105 96" stroke={colors.check} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      
      {/* Spinner - current step */}
      <circle cx="125" cy="100" r="11" fill={colors.accentLight} />
      <circle cx="125" cy="100" r="8" stroke={colors.accentLight} strokeWidth="2" fill="none" />
      <path d="M125 92 a8 8 0 0 1 8 8" stroke={colors.accent} strokeWidth="2.5" strokeLinecap="round" fill="none">
        <animateTransform attributeName="transform" type="rotate" from="0 125 100" to="360 125 100" dur="0.8s" repeatCount="indefinite" />
      </path>
      
      {/* Progress bar */}
      <rect x="68" y="118" width="64" height="4" rx="2" fill={colors.lineLight} />
      <rect x="68" y="118" width="40" height="4" rx="2" fill={colors.accent} opacity="0.7" />
      
      {/* Decorative elements */}
      <circle cx="38" cy="35" r="3" fill={colors.accent} opacity="0.4" />
      <circle cx="165" cy="45" r="2.5" fill={colors.check} opacity="0.4" />
      <circle cx="170" cy="115" r="2" fill={colors.accent} opacity="0.3" />
      <circle cx="30" cy="100" r="2" fill={colors.check} opacity="0.3" />
    </svg>
  )
}

function ResultIllustration({ width, height, isDark }: IllustrationSvgProps) {
  const colors = isDark ? {
    bg: '#1e293b',
    bgLight: '#334155',
    accent: '#3b82f6',
    accentLight: 'rgba(59, 130, 246, 0.2)',
    line: '#475569',
    lineLight: '#64748b',
    check: '#10b981',
    checkBg: 'rgba(16, 185, 129, 0.25)',
    star: '#fbbf24',
    shadow: 'rgba(0, 0, 0, 0.3)',
  } : {
    bg: '#ffffff',
    bgLight: '#f8fafc',
    accent: '#0070f3',
    accentLight: 'rgba(0, 112, 243, 0.12)',
    line: '#cbd5e1',
    lineLight: '#e2e8f0',
    check: '#059669',
    checkBg: 'rgba(5, 150, 105, 0.15)',
    star: '#f59e0b',
    shadow: 'rgba(0, 0, 0, 0.08)',
  }

  return (
    <svg width={width} height={height} viewBox="0 0 180 140" fill="none">
      {/* Background glow - success themed */}
      <ellipse cx="90" cy="70" rx="65" ry="50" fill={colors.checkBg} opacity="0.6" />
      
      {/* Document shadow */}
      <rect x="48" y="18" width="84" height="100" rx="10" fill={colors.shadow} opacity="0.3" />
      
      {/* Document */}
      <rect x="45" y="14" width="90" height="105" rx="10" fill={colors.bg} />
      <rect x="45" y="14" width="90" height="105" rx="10" stroke={colors.line} strokeWidth="1" />
      
      {/* Success header */}
      <rect x="45" y="14" width="90" height="22" rx="10" fill={colors.check} opacity="0.1" />
      <rect x="45" y="14" width="90" height="22" rx="10" fill="none" stroke={colors.line} strokeWidth="1" />
      <circle cx="58" cy="25" r="4" fill={colors.check} opacity="0.4" />
      <rect x="68" y="22" width="55" height="6" rx="3" fill={colors.lineLight} />
      
      {/* Content lines */}
      <rect x="58" y="44" width="64" height="4" rx="2" fill={colors.lineLight} />
      <rect x="58" y="54" width="52" height="4" rx="2" fill={colors.lineLight} />
      <rect x="58" y="64" width="58" height="4" rx="2" fill={colors.lineLight} />
      
      {/* Big success checkmark */}
      <circle cx="90" cy="96" r="22" fill={colors.check} opacity="0.12" />
      <circle cx="90" cy="96" r="17" fill={colors.check} opacity="0.18" />
      <circle cx="90" cy="96" r="12" fill={colors.check} opacity="0.25" />
      <path d="M82 96 L87 101 L98 90" stroke={colors.check} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      
      {/* Stars/sparkles - celebration */}
      <path d="M32 42 L34.5 36 L37 42 L43 44.5 L37 47 L34.5 53 L32 47 L26 44.5 Z" fill={colors.star} opacity="0.7" />
      <path d="M148 30 L150 25 L152 30 L157 32 L152 34 L150 39 L148 34 L143 32 Z" fill={colors.star} opacity="0.6" />
      <path d="M155 75 L156.5 71 L158 75 L162 76.5 L158 78 L156.5 82 L155 78 L151 76.5 Z" fill={colors.star} opacity="0.4" />
      
      {/* Decorative circles */}
      <circle cx="25" cy="75" r="2.5" fill={colors.accent} opacity="0.4" />
      <circle cx="160" cy="105" r="2" fill={colors.check} opacity="0.4" />
      <circle cx="20" cy="25" r="2" fill={colors.star} opacity="0.4" />
    </svg>
  )
}
