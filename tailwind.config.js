/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'space-navy':    '#0A0E1A',
        'panel-surface': '#1C2333',
        'panel-hover':   '#232C42',
        'signal-cyan':   '#00E5FF',
        'warning-amber': '#FF6B35',
        'warning-yellow':'#FFD23F',
        'critical-red':  '#FF3366',
        'ai-violet':     '#B967FF',
        'muted':         '#4A5568',
        'text-dim':      '#8892A4',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
      },
      boxShadow: {
        'glow-cyan':     '0 0 20px rgba(0,229,255,0.35), 0 0 60px rgba(0,229,255,0.15)',
        'glow-cyan-sm':  '0 0 10px rgba(0,229,255,0.4)',
        'glow-amber':    '0 0 20px rgba(255,107,53,0.4), 0 0 60px rgba(255,107,53,0.15)',
        'glow-red':      '0 0 20px rgba(255,51,102,0.4), 0 0 60px rgba(255,51,102,0.15)',
        'glow-violet':   '0 0 20px rgba(185,103,255,0.4)',
        'panel':         '0 4px 24px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'pulse-slow':    'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow':     'spin 8s linear infinite',
        'fade-in':       'fadeIn 0.6s ease forwards',
        'slide-up':      'slideUp 0.5s ease forwards',
        'systems-online':'systemsOnline 2s ease forwards',
        'ring-pulse':    'ringPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        systemsOnline: {
          '0%':   { opacity: '0', filter: 'brightness(0)' },
          '40%':  { opacity: '0.3', filter: 'brightness(0.5)' },
          '100%': { opacity: '1', filter: 'brightness(1)' },
        },
        ringPulse: {
          '0%, 100%': { filter: 'drop-shadow(0 0 6px currentColor)' },
          '50%':      { filter: 'drop-shadow(0 0 18px currentColor) drop-shadow(0 0 40px currentColor)' },
        },
      },
    },
  },
  plugins: [],
}
