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
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a2e',
          600: '#242440',
          500: '#2d2d50',
          400: '#3d3d6b',
          300: '#4f4f8a',
          200: '#6c6caa',
          100: '#8f8fc4',
          50: '#b3b3d8',
        },
        neon: {
          cyan: '#00f5d4',
          purple: '#7c3aed',
          pink: '#ff006e',
          green: '#00f593',
          orange: '#ff6b35',
          yellow: '#fee440',
        },
        status: {
          ready: '#00f593',
          inUse: '#ff6b35',
          booked: '#7c3aed',
          pending: '#fee440',
          maintenance: '#ff006e',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'status-pulse': 'status-pulse 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
      keyframes: {
        'status-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;