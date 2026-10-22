/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        beige: {
          50: '#FFFDF9',
          100: '#fff4f1', // Primary background (requested #fff4f1)
          200: '#F7ECE8', // Secondary warm tint
          300: '#EBDAD4', // Darker accent
          400: '#D6B4AB',
          500: '#B8968C',
        },
        // Dark brown primary branding & buttons (#3D2314)
        coffee: {
          DEFAULT: '#3D2314',
          hover: '#2A160B',
          dark: '#1D0E07',
          light: '#F8EFEA',
          border: '#D4C0B4',
        },
        // Alias ferrari to dark brown for seamless theme consistency
        ferrari: {
          DEFAULT: '#3D2314',
          hover: '#2A160B',
          dark: '#1D0E07',
          light: '#F8EFEA',
          border: '#D4C0B4',
        },
        card: '#FFFDF9',
        border: '#DDD5C8',
        surface: {
          DEFAULT: '#FFFDF9',
          muted: '#F8F4ED',
          hover: '#F2ECE2',
        },
        charcoal: {
          DEFAULT: '#222222',
          secondary: '#666666',
          muted: '#8A8A8A',
          subtle: '#B0B0B0',
        }
      },
      fontSize: {
        '2xs': '0.6875rem', // 11px
        'xs': '0.75rem',    // 12px
        'sm': '0.8125rem',  // 13px
        'base': '0.875rem', // 14px
        'md': '0.9375rem',  // 15px
        'lg': '1rem',       // 16px
        'xl': '1.125rem',   // 18px
        '2xl': '1.25rem',   // 20px
        '3xl': '1.5rem',    // 24px
      },
      borderRadius: {
        'sm': '4px',
        DEFAULT: '6px',
        'md': '8px',
        'lg': '10px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(40, 30, 20, 0.05)',
        'card': '0 1px 3px 0 rgba(40, 30, 20, 0.08), 0 1px 2px -1px rgba(40, 30, 20, 0.08)',
        'modal': '0 10px 25px -5px rgba(30, 20, 10, 0.15), 0 8px 10px -6px rgba(30, 20, 10, 0.1)',
      }
    },
  },
  plugins: [],
}

