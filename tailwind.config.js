/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/*.{html,js}",
    "./views/**/*.{ejs,html,js}",
    "./views/partials/**/*.{ejs,html,js}",
    "./node_modules/flowbite/**/*.js",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "brand-blue": {
          DEFAULT: "#3182CE", // Your primary blue color
          light: "#63B3ED",
        },
        "brand-dark": "#202223",
        "brand-yellow": "#FFC107",
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        blue: {
          50: "#f2fcff",
          100: "#eaf6fb",
          500: "#63b3ed",
          600: "#3182ce",
          700: "#2c5282",
          800: "#1b90e4",
        },
      },
    },
    fontFamily: {
      poppins: ["Poppins", "sans-serif"],
      body: [
        "Inter",
        "ui-sans-serif",
        "system-ui",
        "-apple-system",
        "system-ui",
        "Segoe UI",
        "Roboto",
        "Helvetica Neue",
        "Arial",
        "Noto Sans",
        "sans-serif",
        "Apple Color Emoji",
        "Segoe UI Emoji",
        "Segoe UI Symbol",
        "Noto Color Emoji",
      ],
      sans: ["Quicksand", "sans-serif"],
      display: ["Calibri", "sans-serif"],
    },
  },
  plugins: [require("flowbite/plugin")({ charts: true })],
};
