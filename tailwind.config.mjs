/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        claude: {
          cream: '#FAFAF6',
          warm: '#FFFEFB',
          text: '#1A1A1A',
          'text-light': '#666666',
          accent: '#D97706',
          border: '#E8E4DE',
        },
        // 康定斯基色彩
        kandinsky: {
          yellow: '#FFC72C',
          blue: '#4A90D9',
          red: '#E85D4C',
          black: '#1A1A1A',
          white: '#FAFAF5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
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
