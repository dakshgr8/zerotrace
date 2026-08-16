/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5', // Primary Indigo
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        violet: {
          500: '#8B5CF6',
          600: '#7C3AED', // Secondary Violet
          700: '#6D28D9',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        emerald: {
          50: '#ECFDF5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['Inter', '"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(79, 70, 229, 0.08)',
        'card-hover': '0 12px 28px -5px rgba(79, 70, 229, 0.15), 0 8px 10px -6px rgba(79, 70, 229, 0.08)',
        'primary-btn': '0 4px 14px 0 rgba(79, 70, 229, 0.35)',
        'primary-btn-hover': '0 6px 20px 0 rgba(79, 70, 229, 0.45)',
        'emerald-btn': '0 4px 14px 0 rgba(16, 185, 129, 0.35)',
        'glow': '0 0 20px rgba(79, 70, 229, 0.4)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
