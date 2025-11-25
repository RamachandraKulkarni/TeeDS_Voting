import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const baseFromGhPages = (() => {
  const url = process.env.GH_PAGES_URL
  if (!url) return '/'
  try {
    const parsed = new URL(url)
    return parsed.pathname.endsWith('/') ? parsed.pathname : `${parsed.pathname}/`
  } catch {
    return '/'
  }
})()

export default defineConfig({
  plugins: [react()],
  base: baseFromGhPages,
})
