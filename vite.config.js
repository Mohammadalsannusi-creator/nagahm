import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
  build: {
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore", "firebase/storage"],
          react: ["react", "react-dom", "react-router-dom"],
          charts: ["recharts", "d3"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["pdfjs-dist", "tesseract.js"],
  },
});
