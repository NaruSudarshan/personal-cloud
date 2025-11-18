// 
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class", // we use class-based dark mode
  theme: {
    extend: {
      colors: {
        background: "#000000", // pure black
        foreground: "#1f1f1f",
        primary: "#ff7a00", // your orange
        secondary: "#ffa94d", // optional lighter orange
      },
    },
  },
  plugins: [],
};
