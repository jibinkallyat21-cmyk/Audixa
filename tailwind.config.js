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
        brand: '#E8323C',
        'brand-hover': '#D12C35',
        emerald: '#059669',
        amber: '#D97706',
        'alert-red': '#DC2626',
        background: '#F8F9FB',
      },
      boxShadow: {
        focus: '0 0 0 3px rgba(232,50,60,0.25)',
      },
      transitionTimingFunction: {
        'out-strong': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-out-strong': 'cubic-bezier(0.77, 0, 0.175, 1)',
      },
    },
  },
  plugins: [],
}
