import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
  ],

  // ======================================================
  // DEV PROXY — only active during local `npm run dev`
  // On Vercel, API_URL="" and /api/* routes to vercel.json
  // ======================================================
  server: command === 'serve' ? {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  } : {},

  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.js$/,
    exclude: [],
  },

  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
}))
