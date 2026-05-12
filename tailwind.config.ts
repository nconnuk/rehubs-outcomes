import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'grad-purple':      '#9333EA',
        'grad-purple-deep': '#7A1FC2',
        'grad-amber':       '#F4A93A',
        'grad-amber-light': '#FFCB6B',
        'grad-rose':        '#E76A85',
        'ink-900': '#0A0A0F',
        'ink-800': '#15151D',
        'ink-700': '#1F1F2B',
        'ink-600': '#2C2C3A',
        'ink-500': '#42424F',
        'ink-400': '#6B6B78',
        'ink-300': '#9A9AA6',
        'ink-200': '#CCCCD3',
        'paper':       '#FAFAF8',
        'paper-warm':  '#F4F2EC',
        'line':        '#E5E2D8',
        'line-soft':   '#EFEDE4',
        'moss':     '#5C8A6B',
        'moss-bg':  '#E6F2EA',
        'rose':     '#C25A5A',
        'rose-bg':  '#F8E5E5',
        'amber-w':  '#C48A2C',
        'amber-bg': '#FBF4E5',
      },
      fontFamily: {
        serif: ['var(--font-fraunces)', 'serif'],
        sans:  ['var(--font-inter-tight)', 'Inter Tight', 'sans-serif'],
        mono:  ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'brand-gradient':   'linear-gradient(135deg, #F4A93A 0%, #E76A85 45%, #9333EA 100%)',
        'brand-gradient-r': 'linear-gradient(45deg, #9333EA 0%, #E76A85 55%, #F4A93A 100%)',
      },
      borderRadius: {
        '13px': '13px',
      },
      boxShadow: {
        'sm':  '0 1px 2px rgba(11,15,25,.04)',
        'md':  '0 6px 24px rgba(11,15,25,.06), 0 1px 2px rgba(11,15,25,.04)',
        'lg':  '0 20px 60px rgba(11,15,25,.10), 0 2px 8px rgba(11,15,25,.05)',
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        pulse: {
          '0%':   { boxShadow: '0 0 0 0 rgba(93,216,154,.6)' },
          '70%':  { boxShadow: '0 0 0 8px rgba(93,216,154,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(93,216,154,0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      animation: {
        floaty:   'floaty 3.4s ease-in-out infinite',
        'pulse-dot': 'pulse 2s infinite',
        'slide-up':  'slideUp 0.35s cubic-bezier(.16,1,.3,1)',
        'fade-in':   'fadeIn 0.25s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
