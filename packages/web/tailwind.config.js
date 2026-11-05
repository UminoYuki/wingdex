/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0F1512',
          800: '#16201B',
          700: '#1E2A24',
        },
        moss: {
          DEFAULT: '#57C785',
          deep: '#3E9E6B',
          soft: '#7FD1A5',
        },
        plume: '#6FB3C9',
        amber: {
          gold: '#E8B04B',
        },
        danger: '#E5636F',
        success: '#4FBF7B',
        fog: {
          100: '#E8EFE9',
          200: '#9FB0A5',
          300: '#6E7F74',
        },
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
        'elev-1': '0 1px 2px rgba(0,0,0,.4), inset 0 0 0 1px rgba(255,255,255,.06)',
        'elev-2': '0 8px 24px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.06)',
        'elev-3': '0 24px 60px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,255,255,.07)',
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
