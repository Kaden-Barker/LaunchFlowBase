import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 8080
  },
  preview: {
    port: 8080,
    allowedHosts: ['rusted-gate-73a4k.ondigitalocean.app']
  }
})
