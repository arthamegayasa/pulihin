/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        id: '/app',
        name: 'PULIHIN - Pendamping Rehabilitasi Stroke',
        short_name: 'PULIHIN',
        description:
          'Pendamping latihan rehabilitasi stroke di rumah: kamera menilai gerakan, latihan bicara Bahasa Indonesia, ringkasan untuk keluarga. Prototype lomba.',
        lang: 'id',
        dir: 'ltr',
        start_url: '/app',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FFFFFF',
        theme_color: '#0B4F4A',
        categories: ['health', 'medical', 'lifestyle'],
        icons: [
          { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Aset MediaPipe (runtime WASM SIMD + model pose lite) ikut di-precache agar sesi kamera
        // tetap dapat dimulai dalam mode pesawat setelah aplikasi termuat sekali (Bab 11, Ketahanan).
        globPatterns: [
          '**/*.{js,css,html,svg,png,webp,woff2,json}',
          'mediapipe/wasm/vision_wasm_internal.{js,wasm}',
          'mediapipe/models/*.task',
        ],
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/mediapipe/'),
            handler: 'CacheFirst',
            options: { cacheName: 'pulihin-mediapipe', expiration: { maxEntries: 16 } },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  build: { target: 'es2022', sourcemap: false, chunkSizeWarningLimit: 900 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
