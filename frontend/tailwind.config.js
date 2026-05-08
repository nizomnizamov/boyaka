/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: '#2563EB',
        'primary-hover': '#1D4ED8',
        'primary-light': '#EFF6FF',
        'primary-dark': '#3B82F6',
        income: '#16A34A',
        'income-light': '#F0FDF4',
        'income-dark': '#22C55E',
        expense: '#EF4444',
        'expense-light': '#FEF2F2',
        'expense-dark': '#F87171',
        bg: '#F5F5F7',
        surface: '#FFFFFF',
        'surface-2': '#F3F4F6',
        border: '#E5E7EB',
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        'text-muted': '#9CA3AF',
        dark: {
          bg: '#0C0C0F',
          surface: '#161619',
          'surface-2': '#1E1E23',
          'surface-3': '#26262D',
          border: '#2E2E38',
          'text-primary': '#F9FAFB',
          'text-secondary': '#9CA3AF',
          'text-muted': '#6B7280',
        }
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
        '5xl': '28px',
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
        'soft-md': '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.05)',
        'soft-lg': '0 4px 16px rgba(0,0,0,0.08), 0 24px 48px rgba(0,0,0,0.06)',
        'primary': '0 4px 16px rgba(37,99,235,0.3)',
        'income': '0 4px 16px rgba(22,163,74,0.2)',
        'expense': '0 4px 16px rgba(239,68,68,0.2)',
        'dark-soft': '0 1px 2px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)',
        'dark-md': '0 2px 8px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'fade-up': 'fadeUp 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        'scale-in': 'scaleIn 0.15s ease-out',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
