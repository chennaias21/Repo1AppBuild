import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base './' makes the build work from any folder: web hosting, GitHub Pages and the Android WebView.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Rupee Routine – Money Made Simple',
        short_name: 'Rupee Routine',
        description: 'Track your money. Plan your budget. Build your savings.',
        theme_color: '#5b5bf0',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'], maximumFileSizeToCacheInBytes: 3_000_000 },
    }),
  ],
  build: { chunkSizeWarningLimit: 900 },
});
