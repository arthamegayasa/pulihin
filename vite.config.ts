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
        categories: ['health', 'lifestyle'],
        screenshots: [
          { src: '/landing/beranda.webp', sizes: '824x1830', type: 'image/webp', form_factor: 'narrow', label: 'Beranda pasien: latihan hari ini' },
          { src: '/landing/keluarga.webp', sizes: '824x1830', type: 'image/webp', form_factor: 'narrow', label: 'Untuk Keluarga: kepatuhan dan tanda perlu perhatian' },
          { src: '/landing/afasia-kata.webp', sizes: '824x1830', type: 'image/webp', form_factor: 'narrow', label: 'Latihan bicara Bahasa Indonesia' },
        ],
        icons: [
          { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache hanya kerangka aplikasi (~1 MB) agar landing page ringan di kuota prabayar.
        // Aset MediaPipe (WASM ~13 MB + model 5,8 MB) masuk cache saat aplikasi dibuka (prefetch saat idle di
        // PoseEngine) atau saat sesi pertama, lalu dilayani CacheFirst: sesi kamera tetap bisa dimulai dalam
        // mode pesawat setelah aplikasi termuat sekali (Bab 11, Ketahanan). Video peraga + poster (±0,5 MB per
        // latihan) juga tidak di-precache: masuk cache saat Beranda pasien (program hari ini) atau Detail Latihan.
        // Ilustrasi (public/ilustrasi): hanya peran/* (3) dan kategori/* (5), kecil dan selalu terlihat (<= 40 KB
        // per berkas), ikut precache; kata/*, momen/*, landing/* masuk cache runtime saat pertama kali tampil.
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,json}'],
        globIgnores: ['mediapipe/**', 'peraga/**', 'landing/og.jpg', 'ilustrasi/kata/**', 'ilustrasi/momen/**', 'ilustrasi/landing/**'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/mediapipe/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'pulihin-mediapipe',
              expiration: { maxEntries: 16 },
              cacheableResponse: { statuses: [200] },
              // MediaPipe memuat loader lewat <script crossorigin> (mengirim Origin) sedangkan prefetch memakai
              // fetch biasa; abaikan Vary agar keduanya cocok saat luring meski host menambah `Vary: Origin`.
              matchOptions: { ignoreVary: true },
            },
          },
          // Video peraga 3D (VideoPeraga.tsx): satu cache untuk MP4 + poster WebP. Header content-type wajib cocok
          // agar index.html dari rewrite SPA Vercel (berkas belum ada) tidak tersimpan sebagai video/poster.
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/peraga/') && url.pathname.endsWith('.mp4'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'pulihin-peraga',
              expiration: { maxEntries: 40 },
              cacheableResponse: { statuses: [200], headers: { 'content-type': 'video/mp4' } },
              // Hanya jawaban 200 utuh yang disimpan (fetch tanpa Range); permintaan Range dari elemen <video>
              // lalu dilayani sebagai 206 dari salinan cache itu, termasuk saat luring.
              rangeRequests: true,
              matchOptions: { ignoreVary: true },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/peraga/') && url.pathname.endsWith('.webp'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'pulihin-peraga',
              expiration: { maxEntries: 40 },
              cacheableResponse: { statuses: [200], headers: { 'content-type': 'image/webp' } },
              matchOptions: { ignoreVary: true },
            },
          },
          // Ilustrasi S2 (src/components/premium/Ilustrasi.tsx). Content-type wajib gambar agar index.html dari
          // rewrite SPA (berkas belum ada) tidak tersimpan sebagai gambar. ~120 berkas total (100 kata).
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/ilustrasi/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'pulihin-ilustrasi',
              expiration: { maxEntries: 140 },
              cacheableResponse: { statuses: [200], headers: { 'content-type': 'image/webp' } },
              matchOptions: { ignoreVary: true },
            },
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
