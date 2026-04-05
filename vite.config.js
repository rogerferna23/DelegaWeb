import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
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
    }
  }
})
