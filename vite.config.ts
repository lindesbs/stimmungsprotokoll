import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
function buildCommit(): string {
  if (/^[a-f0-9]{40}$/i.test(process.env.GITHUB_SHA ?? '')) return process.env.GITHUB_SHA!.slice(0, 7)
  try {
    return execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], {
      cwd: fileURLToPath(new URL('.', import.meta.url)),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
  } catch {
    return 'lokaler Build'
  }
}

const configuredBase = process.env.BASE_PATH ?? '/'
const base = configuredBase === '/'
  ? '/'
  : `/${configuredBase.replace(/^\/+|\/+$/g, '')}/`
const assetUrl = (file: string) => `${base}${file}`

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APP_COMMIT__: JSON.stringify(buildCommit())
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-maskable.svg', 'apple-touch-icon.png'],
      manifest: {
        id: base,
        name: 'Stimmungsprotokoll',
        short_name: 'Stimmung',
        description: 'Offlinefähiges Stimmungs- und Aktivitätsprotokoll',
        lang: 'de-DE',
        dir: 'ltr',
        theme_color: '#39424e',
        background_color: '#f6f7f9',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: assetUrl('pwa-192x192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: assetUrl('pwa-512x512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: assetUrl('maskable-512x512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}']
      }
    })
  ]
})
