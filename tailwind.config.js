/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        'medal-gold': '#FFD700',
        'medal-silver': '#C0C0C0',
        'medal-bronze': '#CD7F32',
        'primary': '#208491',
        'primary-hover': '#1d745f',
        'accent': '#32b8c6',
        'bg-primary': '#fcfcf9',
        'bg-secondary': '#ffffff',
        'text-primary': '#133452',
        'text-secondary': '#626c71'
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'base': '16px',
        'lg': '20px',
        'xl': '24px',
        '2xl': '32px'
      }
    }
  },
  plugins: []
}
