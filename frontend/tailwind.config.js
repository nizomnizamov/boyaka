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
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },

      colors: {
        primary:         '#2563EB',
        'primary-hover': '#1D4ED8',
        'primary-press': '#1E40AF',
        'primary-light': '#EFF6FF',
        'primary-dark':  '#3B82F6',

        income:          '#16A34A',
        'income-light':  '#DCFCE7',
        'income-muted':  '#F0FDF4',
        'income-dark':   '#22C55E',

        expense:         '#EF4444',
        'expense-light': '#FEE2E2',
        'expense-muted': '#FEF2F2',
        'expense-dark':  '#F87171',

        warning:         '#F59E0B',
        'warning-light': '#FFFBEB',
        'warning-dark':  '#FBBF24',

        success:         '#22C55E',
        'success-light': '#DCFCE7',

        bg:              '#F5F5F7',
        'bg-2':          '#F8FAFC',
        surface:         '#FFFFFF',
        'surface-2':     '#F3F4F6',
        'surface-3':     '#EAECF0',
        border:          '#E5E7EB',
        'border-strong': '#D1D5DB',

        'text-primary':   '#111827',
        'text-secondary': '#6B7280',
        'text-muted':     '#9CA3AF',
        'text-disabled':  '#D1D5DB',

        dark: {
          bg:              '#0C0C0F',
          'bg-2':          '#111115',
          surface:         '#161619',
          'surface-2':     '#1E1E23',
          'surface-3':     '#26262D',
          border:          '#2E2E38',
          'border-strong': '#3E3E4A',
          'text-primary':  '#F9FAFB',
          'text-secondary':'#9CA3AF',
          'text-muted':    '#6B7280',
          'text-disabled': '#374151',
        },
      },

      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
        '5xl': '28px',
      },

      boxShadow: {
        'soft':    '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.05)',
        'soft-md': '0 2px 8px rgba(0,0,0,0.07), 0 8px 28px rgba(0,0,0,0.06)',
        'soft-lg': '0 4px 20px rgba(0,0,0,0.09), 0 24px 56px rgba(0,0,0,0.07)',
        'primary': '0 4px 20px rgba(37,99,235,0.28)',
        'income':  '0 4px 16px rgba(22,163,74,0.20)',
        'expense': '0 4px 16px rgba(239,68,68,0.20)',
        'dark-sm': '0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4)',
        'dark-md': '0 2px 8px rgba(0,0,0,0.6), 0 8px 28px rgba(0,0,0,0.5)',
      },

      spacing: {
        '4.5': '18px',
        '13': '52px',
        '15': '60px',
        '18': '72px',
      },

      fontSize: {
        '2xs': ['11px', { lineHeight: '16px' }],
      },

      animation: {
        'fade-up':     'fadeUp 0.22s ease-out',
        'fade-in':     'fadeIn 0.16s ease-out',
        'scale-in':    'scaleIn 0.18s ease-out',
        'slide-up':    'slideUp 0.3s cubic-bezier(0.32,0.72,0,1)',
        'slide-sheet': 'slideSheet 0.32s cubic-bezier(0.32,0.72,0,1)',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideSheet: {
          '0%':   { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
