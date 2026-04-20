import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import { CartProvider } from './contexts/CartContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { logFrontendError } from './utils/errorLogger'
import { reloadIfChunkError, clearChunkReloadGuard } from './utils/chunkReload'
import './index.css'
import App from './App.jsx'

// Si llegamos hasta aquí es que el chunk de entrada cargó bien —
// liberamos el guard para permitir un reload futuro si hace falta.
clearChunkReloadGuard();

// Monitoreo Global de Errores (Fase 3.4)
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  // Si el error es un ChunkLoadError (usuario en versión vieja tras deploy),
  // forzamos reload para que el navegador baje la versión nueva.
  if (reloadIfChunkError(reason)) return;
  logFrontendError(reason instanceof Error ? reason : new Error(String(reason)), { type: "unhandled_promise" });
});

window.onerror = (msg, src, line, col, err) => {
  if (reloadIfChunkError(err || msg)) return;
  logFrontendError(err || new Error(msg), { source: src, line, col });
};

// Clean up old auth system remnants (passwords were stored in plaintext)
;['dw_admin_users', 'dw_admin_session'].forEach(k => localStorage.removeItem(k));

createRoot(document.getElementById('root')).render(
  <PayPalScriptProvider options={{
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test',
    currency: 'USD',
    intent: 'capture',
    components: 'buttons',
  }}>
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </PayPalScriptProvider>
)
