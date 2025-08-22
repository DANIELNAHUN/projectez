/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Nueva paleta de colores personalizada basada en Color Palette -06
        primary: {
          50: '#f9f7f4',
          100: '#f2dd6c', // #F2DD6C - Amarillo claro
          200: '#eae9e7', // #EAE9E7 - Gris claro
          300: '#daad29', // #DAAD29 - Amarillo dorado
          400: '#79792e', // #79792E - Verde oliva
          500: '#794515', // #794515 - Marrón
          600: '#3e350e', // #3E350E - Verde oscuro
          700: '#2d2a0a',
          800: '#1f1d07',
          900: '#141205',
        },
        // Colores específicos de la paleta
        earth: {
          'dark-olive': '#3E350E',    // Color más oscuro
          'golden': '#DAAD29',        // Amarillo dorado
          'light-gray': '#EAE9E7',    // Gris claro
          'brown': '#794515',         // Marrón
          'olive': '#79792E',         // Verde oliva
          'light-yellow': '#F2DD6C',  // Amarillo claro
        },
        // Mantener algunos grises para compatibilidad
        gray: {
          25: '#fafafa',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'inner-lg': 'inset 0 10px 15px -3px rgba(0, 0, 0, 0.1), inset 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      }
    }
  },
  plugins: [
    // Add line-clamp plugin if needed
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          /* IE and Edge */
          '-ms-overflow-style': 'none',
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      })
    }
  ]
}