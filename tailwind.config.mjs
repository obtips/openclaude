/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        claude: {
          cream: '#F5F1E8',
          warm: '#FAF8F3',
          text: '#1A1A1A',
          'text-light': '#6B6B6B',
          accent: '#D4A574',
          border: '#E8E4DB',
        },
      },
      fontFamily: {
        sans: ['Figtree', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0,0,0,0.04)',
        'soft-lg': '0 4px 16px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
