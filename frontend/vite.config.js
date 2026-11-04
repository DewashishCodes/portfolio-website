import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { renderHead } from './src/seo.js'

// Bakes SEO head tags into index.html so crawlers see them without JS (PRD §7).
const seoHead = { name: 'seo-head', transformIndexHtml: (html) => html.replace('<!--head-->', renderHead()) }

export default defineConfig({
  plugins: [react(), tailwindcss(), seoHead],
  define: { __BUILD_DATE__: JSON.stringify(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })) },
  server: { proxy: { '/api': 'http://localhost:8000' } },
})
