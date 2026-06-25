/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefcfb",
          100: "#d4f6f4",
          200: "#aeeceb",
          300: "#76dcdb",
          400: "#39c3c5",
          500: "#1ea7aa",
          600: "#168389",
          700: "#16696f",
          800: "#17555a",
          900: "#17474c",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
