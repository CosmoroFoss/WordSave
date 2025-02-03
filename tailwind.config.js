/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./**/*.{html,js}", // Include all HTML and JS files
    "!./node_modules/**", // Exclude the entire node_modules folder
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};