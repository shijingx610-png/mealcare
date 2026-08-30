import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // 既存の mealcare アプリ
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        // メルカリ出品AI（/mercari.html）
        mercari: fileURLToPath(new URL('./mercari.html', import.meta.url)),
      },
    },
  },
})
