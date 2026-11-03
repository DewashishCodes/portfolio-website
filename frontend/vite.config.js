import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { createServer, defineConfig } from 'vite'

// Bakes the Pit Lane page and SEO head tags into index.html so crawlers see them without JS (PRD §7).
function prerender() {
  return {
    name: 'pitlane-prerender',
    async transformIndexHtml(html, ctx) {
      const vite = ctx.server ?? (await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true, hmr: false }, appType: 'custom', optimizeDeps: { noDiscovery: true } }))
      try {
        const { renderHead, renderBody } = await vite.ssrLoadModule('/src/pitlane/ssr.jsx')
        return html.replace('<!--head-->', renderHead()).replace('<div id="root"></div>', `<div id="root">${renderBody()}</div>`)
      } finally {
        if (!ctx.server) await vite.close()
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), prerender()],
  server: { proxy: { '/api': 'http://localhost:8000' } },
})
