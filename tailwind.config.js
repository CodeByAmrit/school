/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.{ejs,html,js}", 
    "./views/partials/**/*.{ejs,html,js}",
    "./node_modules/flowbite/**/*.js", 
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('flowbite/plugin'),
  ],
};
