import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0A2540',
          deep:    '#0A2540',
          soft:    '#1D3461',
          muted:   '#334E7B',
        },
        cyan:  { DEFAULT: '#2563EB', bright: '#3B82F6' },
        lime:  { DEFAULT: '#10B981' },
        ink:   { DEFAULT: '#1E293B', muted: '#64748B' },
        surface: '#FFFFFF',
        bg:    '#F8FAFC',
        line:  '#E2E8F0',
      },
      fontFamily: {
        sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'var(--font-inter)', 'sans-serif'],
        mono:    ['var(--font-jetbrains)', 'monospace'],
      },
      fontWeight: {
        '500': '500',
        '600': '600',
        '700': '700',
        '800': '800',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
        lg:   '0 10px 40px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.04)',
      },
    },
  },
  plugins: [],
}

export default config
