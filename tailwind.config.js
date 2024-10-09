/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      boxShadow: {
        'soft': '0 0 20px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}