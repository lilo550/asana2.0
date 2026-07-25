/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#213745",
          light: "#2f4d61",
          dark: "#152530",
        },
        secondary: {
          DEFAULT: "#ff5b8e",
          light: "#ff85ac",
          dark: "#e13d70",
        },
        highlight: {
          DEFAULT: "#ead9c9",
          light: "#f5ede4",
          dark: "#d9c1a6",
        },
      },
    },
  },
  plugins: [],
};
