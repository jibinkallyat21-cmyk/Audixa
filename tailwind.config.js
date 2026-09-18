/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: '#0D1B2A',
        'brand-red': '#E8323C',
        emerald: '#059669',
        amber: '#D97706',
        'alert-red': '#DC2626',
        background: '#F8FAFC',
      },
    },
  },
  plugins: [],
}
