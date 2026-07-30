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
          light: "#6f7d86",
          dark: "#1a2c37",
        },
        secondary: {
          DEFAULT: "#ff5b8e",
          light: "#ff94b6",
          dark: "#ba4286",
        },
        highlight: {
          DEFAULT: "#ead9c9",
          light: "#f1e6dc",
          dark: "#bbaea1",
        },
        white: {
          DEFAULT: "#f8f8f8",
          light: "#fefefe",
          dark: "#E6E6E6",
        },
        black: {
          DEFAULT: "#39393a",
          light: "#39393a",
          dark: "#39393a",
        }
      },
    },
  },
  plugins: [],
};
