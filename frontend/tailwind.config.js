/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFDF5', // Warm Cream / Paper feel
        foreground: '#1E293B', // Slate 800
        muted: '#F1F5F9',      // Slate 100
        mutedForeground: '#64748B', // Slate 500
        accent: {
          DEFAULT: '#8B5CF6', // Vivid Violet (Primary Brand)
          hover: '#7C3AED',
          light: '#EDE9FE',
          dark: '#6D28D9',
        },
        secondary: {
          DEFAULT: '#F472B6', // Hot Pink (Playful Pop)
          hover: '#EC4899',
          light: '#FCE7F3',
          dark: '#DB2777',
        },
        tertiary: {
          DEFAULT: '#FBBF24', // Amber/Yellow (Optimism)
          hover: '#F59E0B',
          light: '#FEF3C7',
          dark: '#D97706',
        },
        quaternary: {
          DEFAULT: '#34D399', // Mint/Emerald (Freshness)
          hover: '#10B981',
          light: '#D1FAE5',
          dark: '#059669',
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
          950: '#0B0F17',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'pop-xs': '2px 2px 0px 0px #1E293B',
        'pop-sm': '3px 3px 0px 0px #1E293B',
        'pop': '4px 4px 0px 0px #1E293B',
        'pop-hover': '6px 6px 0px 0px #1E293B',
        'pop-active': '1px 1px 0px 0px #1E293B',
        'pop-lg': '8px 8px 0px 0px #1E293B',
        'pop-pink': '5px 5px 0px 0px #F472B6',
        'pop-yellow': '5px 5px 0px 0px #FBBF24',
        'pop-mint': '5px 5px 0px 0px #34D399',
        'pop-violet': '5px 5px 0px 0px #8B5CF6',
      },
      borderWidth: {
        '3': '3px',
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '28px',
        'blob-1': '24px 24px 24px 0px',
        'blob-2': '24px 24px 0px 24px',
        'blob-arch': '9999px 9999px 16px 16px',
      },
      transitionTimingFunction: {
        'bounce-pop': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        popIn: {
          '0%': { transform: 'scale(0.92)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(3deg)' },
          '75%': { transform: 'rotate(-3deg)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      },
      animation: {
        'pop-in': 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'wiggle': 'wiggle 0.4s ease-in-out',
        'float-slow': 'floatSlow 4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
