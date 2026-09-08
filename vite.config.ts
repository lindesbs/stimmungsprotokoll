import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

const configuredBase = process.env.BASE_PATH ?? '/'
const base = configuredBase === '/'
  ? '/'
  : `/${configuredBase.replace(/^\/+|\/+$/g, '')}/`
const assetUrl = (file: string) => `${base}${file}`

export default defineConfig({
  base,
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
