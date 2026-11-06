/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: 'rgb(var(--c-ink-900) / <alpha-value>)',
          800: 'rgb(var(--c-ink-800) / <alpha-value>)',
          700: 'rgb(var(--c-ink-700) / <alpha-value>)',
        },
        moss: {
          DEFAULT: 'rgb(var(--c-moss) / <alpha-value>)',
          deep: 'rgb(var(--c-moss-deep) / <alpha-value>)',
          soft: 'rgb(var(--c-moss-soft) / <alpha-value>)',
        },
        plume: 'rgb(var(--c-plume) / <alpha-value>)',
        amber: {
          gold: 'rgb(var(--c-gold) / <alpha-value>)',
        },
        danger: 'rgb(var(--c-danger) / <alpha-value>)',
        success: 'rgb(var(--c-success) / <alpha-value>)',
        fog: {
          100: 'rgb(var(--c-fog-100) / <alpha-value>)',
          200: 'rgb(var(--c-fog-200) / <alpha-value>)',
          300: 'rgb(var(--c-fog-300) / <alpha-value>)',
        },
        line: 'rgb(var(--c-line) / <alpha-value>)',
        recess: 'var(--surface-recess)',
      },
      fontFamily: {
        sans: [
          'PingFang SC',
          'Microsoft YaHei',
          'Hiragino Sans GB',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        display: ['28px', { lineHeight: '1.3', fontWeight: '600' }],
        title: ['18px', { lineHeight: '1.4', fontWeight: '500' }],
        body: ['14px', { lineHeight: '1.5' }],
        caption: ['12px', { lineHeight: '1.4' }],
        micro: ['10px', { lineHeight: '1.4', fontWeight: '500' }],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '22px',
      },
      boxShadow: {
        'elev-1': 'var(--shadow-elev-1)',
        'elev-2': 'var(--shadow-elev-2)',
        'elev-3': 'var(--shadow-elev-3)',
      },
      transitionTimingFunction: {
        natural: 'cubic-bezier(0.22,1,0.36,1)',
      },
      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '320ms',
        flip: '600ms',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'badge-sweep': {
          '0%': { transform: 'translateX(-120%) skewX(-20deg)' },
          '100%': { transform: 'translateX(220%) skewX(-20deg)' },
        },
        'pulse-ring': {
          '0%': { opacity: '0.7', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(1.35)' },
        },
        'holo-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        'card-sway': {
          '0%, 100%': { transform: 'rotateY(-16deg) rotateX(4deg)' },
          '50%': { transform: 'rotateY(16deg) rotateX(4deg)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 320ms cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 200ms cubic-bezier(0.22,1,0.36,1) both',
        'badge-sweep': 'badge-sweep 600ms cubic-bezier(0.22,1,0.36,1)',
        'pulse-ring': 'pulse-ring 900ms ease-out forwards',
        'holo-shift': 'holo-shift 6s linear infinite',
        'card-sway': 'card-sway 8s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
