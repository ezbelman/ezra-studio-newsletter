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
          DEFAULT: '#001A5C',
          deep:    '#0D1B3E',
          soft:    '#0033A0',
          muted:   '#1A2E6E',
        },
        cyan:  { DEFAULT: '#00B5E2', bright: '#4DD3F0' },
        lime:  { DEFAULT: '#C8E100' },
        ink:   { DEFAULT: '#0D1B3E', muted: '#6B7A9E' },
        surface: '#FFFFFF',
        bg:    '#F4F6FB',
        line:  '#E0E6F5',
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
        DEFAULT: '0.75rem',
        sm: '0.375rem',
        lg: '1.25rem',
        xl: '1.75rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(13,27,62,.06), 0 4px 12px rgba(13,27,62,.04)',
        lg:   '0 12px 48px rgba(0,26,92,.12), 0 4px 12px rgba(0,26,92,.06)',
      },
    },
  },
  plugins: [],
}

export default config
