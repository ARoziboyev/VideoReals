/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        fg: 'rgb(var(--fg) / <alpha-value>)',
        base: 'rgb(var(--bg) / <alpha-value>)',
        line: 'var(--border)',
        violet: { 450: '#9B7BFF' },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Unbounded', 'Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 10px 40px -12px rgba(0,0,0,0.45)',
        glow: '0 0 0 1px rgba(155,123,255,0.35), 0 8px 30px -6px rgba(139,92,246,0.55)',
      },
      keyframes: {
        floatUp: {
          '0%': { transform: 'translateY(0) scale(0.8)', opacity: '0' },
          '15%': { opacity: '1' },
          '100%': { transform: 'translateY(-260px) scale(1.2)', opacity: '0' },
        },
      },
      animation: { floatUp: 'floatUp 2.4s ease-out forwards' },
    },
  },
  plugins: [],
}
