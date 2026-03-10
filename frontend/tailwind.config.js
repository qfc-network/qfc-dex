/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        qfc: {
          primary: "#6366f1",
          dark: "#0f0b2e",
          card: "#1a1640",
          border: "#2d2760",
          accent: "#818cf8",
        },
      },
    },
  },
  plugins: [],
};
