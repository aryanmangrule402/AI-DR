import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,       // Needed for Docker
    port: 5173,       // Fix port
    watch: {
      usePolling: true // CRITICAL: Fixes "Hot Reload" on Windows
    }
  }
})