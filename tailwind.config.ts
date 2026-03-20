import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // --- Cybersecurity SOC / GRC platform palette ---

        // Primary: Dark Navy / Slate (backgrounds, sidebars, panels)
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#334155',  // mid slate
          600: '#1e293b',  // dark surface
          700: '#0f172a',  // deepest navy
          800: '#0a0f1e',
          900: '#060b14',
          950: '#020408',
        },

        // Accent: Cyan (active states, highlights, CTAs)
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',  // primary cyan
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },

        // Info: Blue (informational elements, links)
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',  // primary blue
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },

        // Background and surfaces (dark-mode-first for SOC dashboards)
        background: '#0f172a',
        surface: {
          DEFAULT: '#1e293b',
          raised: '#334155',
          overlay: '#0a0f1e',
        },
        foreground: {
          DEFAULT: '#f1f5f9',
          secondary: '#94a3b8',
          muted: '#475569',
        },

        // Success / Compliant: Emerald
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          400: '#34d399',
          500: '#10b981',  // compliant
          600: '#059669',
          700: '#047857',
          900: '#064e3b',
        },

        // Warning / Partial compliance: Amber
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          400: '#fbbf24',
          500: '#f59e0b',  // partial compliance
          600: '#d97706',
          700: '#b45309',
          900: '#78350f',
        },

        // Danger / Critical / Non-compliant: Rose
        danger: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          400: '#fb7185',
          500: '#f43f5e',  // critical / non-compliant
          600: '#e11d48',
          700: '#be123c',
          900: '#881337',
        },

        // Keep error alias pointing to rose for backwards compatibility
        error: {
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
        },

        // Border: subtle on dark backgrounds
        border: {
          DEFAULT: '#1e293b',
          light: '#334155',
          dark: '#0f172a',
          glow: '#06b6d4',  // cyan glow border for focus/active states
        },

        // GRC Risk-level semantic palette
        risk: {
          critical: '#f43f5e',   // Rose  — critical risk
          high:     '#f97316',   // Orange — high risk
          medium:   '#f59e0b',   // Amber  — medium risk
          low:      '#10b981',   // Emerald — low risk
          none:     '#06b6d4',   // Cyan    — no risk / compliant
          unknown:  '#94a3b8',   // Slate   — not assessed
        },

        // Compliance status semantic palette
        compliance: {
          compliant:    '#10b981',  // Emerald
          partial:      '#f59e0b',  // Amber
          nonCompliant: '#f43f5e',  // Rose
          notApplicable:'#475569',  // Slate muted
          inReview:     '#3b82f6',  // Blue
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-sm': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-xs': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-xl': ['1.25rem', { lineHeight: '1.6' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body-md': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'body-xs': ['0.75rem', { lineHeight: '1.5' }],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        // General surface shadows (dark-bg adjusted)
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.2)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
        'elevated': '0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
        'modal': '0 25px 50px -12px rgb(0 0 0 / 0.6)',
        // Cybersecurity glow effects
        'glow-cyan': '0 0 0 1px rgb(6 182 212 / 0.3), 0 0 16px 2px rgb(6 182 212 / 0.15)',
        'glow-cyan-md': '0 0 0 1px rgb(6 182 212 / 0.5), 0 0 24px 4px rgb(6 182 212 / 0.25)',
        'glow-success': '0 0 0 1px rgb(16 185 129 / 0.3), 0 0 12px 2px rgb(16 185 129 / 0.15)',
        'glow-danger': '0 0 0 1px rgb(244 63 94 / 0.3), 0 0 12px 2px rgb(244 63 94 / 0.15)',
        'glow-warning': '0 0 0 1px rgb(245 158 11 / 0.3), 0 0 12px 2px rgb(245 158 11 / 0.15)',
        'inner-dark': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.4)',
      },
      animation: {
        // Existing transitions
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        // Cybersecurity / SOC dashboard animations
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'pulse-danger': 'pulseDanger 1.5s ease-in-out infinite',
        'scan-line': 'scanLine 2.5s linear infinite',
        'blink-dot': 'blinkDot 1.2s step-start infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Cyan glow pulse — for active/live indicators
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 4px 1px rgb(6 182 212 / 0.2)' },
          '50%':       { boxShadow: '0 0 16px 4px rgb(6 182 212 / 0.5)' },
        },
        // Rose pulse — for critical alerts
        pulseDanger: {
          '0%, 100%': { boxShadow: '0 0 4px 1px rgb(244 63 94 / 0.2)' },
          '50%':       { boxShadow: '0 0 16px 4px rgb(244 63 94 / 0.5)' },
        },
        // Horizontal scan line — decorative SOC panel effect
        scanLine: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        // Status dot blink — live feed / online indicators
        blinkDot: {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0' },
        },
      },
      backgroundImage: {
        // Core SOC gradients
        'gradient-primary': 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        'gradient-cyber': 'linear-gradient(135deg, #0f172a 0%, #0e7490 100%)',
        'gradient-accent': 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
        // Risk-level gradients (useful for gauge / meter fills)
        'gradient-critical': 'linear-gradient(90deg, #f43f5e 0%, #be123c 100%)',
        'gradient-high': 'linear-gradient(90deg, #f97316 0%, #c2410c 100%)',
        'gradient-medium': 'linear-gradient(90deg, #f59e0b 0%, #b45309 100%)',
        'gradient-low': 'linear-gradient(90deg, #10b981 0%, #047857 100%)',
        // Dashboard panel overlay
        'gradient-panel': 'linear-gradient(180deg, rgb(30 41 59 / 0.95) 0%, rgb(15 23 42 / 0.98) 100%)',
        // Subtle grid / scan-line texture overlay
        'grid-dark': 'linear-gradient(rgb(6 182 212 / 0.03) 1px, transparent 1px), linear-gradient(90deg, rgb(6 182 212 / 0.03) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
}

export default config
