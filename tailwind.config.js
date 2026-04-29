/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Cairo", "Tajawal", "system-ui", "sans-serif"],
      },
      colors: {
        medical: {
          50:  "#eef7ff",
          100: "#d9ecff",
          200: "#bcdfff",
          300: "#8ecbff",
          400: "#59afff",
          500: "#3392fb",
          600: "#1d75ed",
          700: "#175fd6",
          800: "#194fad",
          900: "#1a4589",
        },
        teal: {
          500: "#14b8a6",
        },
      },
      keyframes: {
        "fade-in": { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        "slide-up": { "0%": { transform: "translateY(10px)", opacity: 0 }, "100%": { transform: "translateY(0)", opacity: 1 } },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
