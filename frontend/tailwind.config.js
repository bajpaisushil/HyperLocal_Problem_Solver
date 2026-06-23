/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Civic teal — trustworthy, community, environment.
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d4d9e2',
          300: '#aeb7c7',
          400: '#828fa7',
          500: '#63718c',
          600: '#4e5a73',
          700: '#40495d',
          800: '#373e4f',
          900: '#1c2030',
          950: '#11131c',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16,24,40,.04), 0 4px 16px -4px rgba(16,24,40,.08)',
        lift: '0 8px 30px -8px rgba(16,24,40,.18)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(13,148,136,.45)' },
          '70%': { boxShadow: '0 0 0 10px rgba(13,148,136,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(13,148,136,0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up .4s ease-out both',
        'pulse-ring': 'pulse-ring 2s infinite',
      },
    },
  },
  plugins: [],
};
