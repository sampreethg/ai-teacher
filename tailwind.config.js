/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#090d16',
        surface: {
          50: '#131927',
          100: '#1a2235',
          200: '#222d45',
          300: '#2e3c5a',
        },
        brand: {
          cyan: '#06b6d4',
          blue: '#3b82f6',
          violet: '#8b5cf6',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6, 182, 212, 0.25), rgba(59, 130, 246, 0.1), transparent)',
        'glow-gradient': 'radial-gradient(circle at center, rgba(6, 182, 212, 0.15) 0%, rgba(139, 92, 246, 0.05) 50%, transparent 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
