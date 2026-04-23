import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Al detectar una versión nueva desplegada, el Service Worker:
      //  1. Se instala en background (precache nuevos assets).
      //  2. Toma control inmediatamente (clients claim) sin forzar reload.
      //  3. El botón/flow de "nueva versión" lo añadiríamos después si queremos
      //     aviso explícito; por ahora confiamos en el auto-update silencioso +
      //     el chunk-reload guard que ya tenemos para chunks huérfanos.
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'robots.txt', 'icon.svg', 'icon-maskable.svg'],
      workbox: {
        // Precache de los artefactos de Vite. Los assets con hash son
        // inmutables así que los metemos directo; el HTML se sirve con
        // NetworkFirst para que siempre busque la versión nueva.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // API de Supabase: siempre red primero, pero si no hay conexión
            // servimos respuesta cacheada con expiración corta.
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
            },
          },
          {
            // Imágenes generadas/servidas desde supabase storage u otros CDNs.
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      manifest: {
        name: 'DelegaWeb',
        short_name: 'DelegaWeb',
        description: 'Agencia de marketing digital y desarrollo web — panel de administración.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#f97316',
        lang: 'es',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icon-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      devOptions: {
        // En dev NO queremos registrar el SW — interfiere con HMR y
        // puede dejar caches viejos. Se activa solo en build de prod.
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    // En builds de producción se eliminan los console.* y debugger.
    // console.error y console.warn se conservan para poder diagnosticar problemas reales.
    drop: ['debugger'],
    pure: ['console.log', 'console.info', 'console.debug', 'console.trace'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: ['src/test/**', 'src/main.tsx'],
    },
  },
  server: {
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.paypal.com https://*.paypalobjects.com https://assets.calendly.com https://*.supabase.co",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.paypal.com",
        "font-src 'self' https://fonts.gstatic.com https://*.paypalobjects.com",
        "img-src 'self' data: blob: https://*.paypal.com https://*.paypalobjects.com https://*.supabase.co",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.paypal.com https://www.sandbox.paypal.com https://*.braintree-api.com ws: wss: http://localhost:* http://127.0.0.1:*",
        "frame-src https://*.paypal.com https://calendly.com",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "base-uri 'self'",
      ].join('; '),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
});
