import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Semantic surface tokens */
        ink:     {
          DEFAULT: 'rgb(var(--color-text-primary) / <alpha-value>)',
          muted:   'rgb(var(--color-text-secondary) / <alpha-value>)',
          faint:   'rgb(var(--color-text-muted) / <alpha-value>)',
        },
        bg:      'rgb(var(--color-bg-base) / <alpha-value>)',
        surface: 'rgb(var(--color-bg-surface) / <alpha-value>)',
        elevated:'rgb(var(--color-bg-elevated) / <alpha-value>)',
        line:    'rgb(var(--color-border) / <alpha-value>)',

        /* Accent palette */
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          blue:    'rgb(var(--color-accent-blue) / <alpha-value>)',
        },

        /* Status */
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        danger:  'rgb(var(--color-error) / <alpha-value>)',

        /* Channels */
        whatsapp:  'rgb(var(--color-whatsapp) / <alpha-value>)',
        telegram:  'rgb(var(--color-telegram) / <alpha-value>)',
        instagram: 'rgb(var(--color-instagram) / <alpha-value>)',

        /* Legacy aliases — keep for backward compat */
        navy: {
          DEFAULT: 'var(--navy)',
          deep:    'var(--navy-deep)',
          soft:    'var(--navy-soft)',
          muted:   'var(--navy-muted)',
        },
        cyan: { DEFAULT: 'var(--cyan)', bright: 'var(--cyan)' },
        lime: { DEFAULT: 'var(--lime)' },
      },
      fontFamily: {
        sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'var(--font-inter)', 'sans-serif'],
        mono:    ['var(--font-jetbrains)', 'monospace'],
      },
      fontWeight: {
        '400': '400',
        '500': '500',
        '600': '600',
        '700': '700',
        '800': '800',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm:  '0.375rem',
        md:  '0.5rem',
        lg:  '0.75rem',
        xl:  '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card:   '0 1px 3px rgba(0,0,0,.2), 0 1px 2px rgba(0,0,0,.15)',
        lg:     '0 10px 40px rgba(0,0,0,.3), 0 4px 12px rgba(0,0,0,.2)',
        glow:   '0 0 24px rgb(123 92 240 / 0.25)',
        'glow-sm': '0 0 12px rgb(123 92 240 / 0.2)',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, rgb(var(--color-accent)), rgb(var(--color-accent-blue)))',
        'gradient-hero': 'radial-gradient(ellipse 80% 60% at 50% -10%, rgb(123 92 240 / 0.25) 0%, transparent 70%)',
      },
      animation: {
        'fade-up':    'fade-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':    'fade-in 0.25s ease both',
        'scale-in':   'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'shimmer':    'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
}

export default config
