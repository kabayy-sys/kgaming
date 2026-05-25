import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gaming: {
          950: '#050508',
          900: '#0a0a12',
          850: '#0d0d1a',
          800: '#12121e',
          750: '#18182a',
          700: '#1e1e30',
          650: '#252540',
          600: '#2a2a48',
          500: '#3a3a5c',
          400: '#5a5a80',
          300: '#8080a8',
          200: '#a8a8c8',
          100: '#d0d0e8',
          50: '#e8e8f5',
        },
        neon: {
          cyan: '#00d4aa',
          purple: '#8b5cf6',
          pink: '#ec4899',
          green: '#10b981',
          orange: '#f59e0b',
          yellow: '#eab308',
        },
        status: {
          ready: '#10b981',
          inUse: '#f59e0b',
          booked: '#8b5cf6',
          pending: '#eab308',
          maintenance: '#ef4444',
        },
        surface: {
          DEFAULT: '#12121e',
          raised: '#1a1a2e',
          overlay: '#252540',
          border: '#2a2a48',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        'app': '480px',
        'app-lg': '720px',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 8px)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
        'elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.75' },
        },
      },
    },
  },
  plugins: [],
};

export default config;