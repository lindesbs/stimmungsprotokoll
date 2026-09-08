import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-maskable.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Stimmungsprotokoll',
        short_name: 'Stimmung',
        description: 'Offlinefähiges Stimmungs- und Aktivitätsprotokoll',
        lang: 'de-DE',
        dir: 'ltr',
        theme_color: '#39424e',
        background_color: '#f6f7f9',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}']
      }
    })
  ]
})
