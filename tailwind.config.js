/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#040b14', // Color muy oscuro, casi negro con tono azulado
        cardbg: '#0a131f', // Color de tarjetas
        primary: '#f97316', // Naranja vibrante
        primaryhover: '#ea580c', // Naranja hover
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Fuente sans moderna
      }
    },
  },
  plugins: [],
}

