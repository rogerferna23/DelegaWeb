import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { CartProvider } from './contexts/CartContext';
import { BackgroundJobsProvider } from './contexts/BackgroundJobsContext';
import { ToastProvider } from './contexts/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { logFrontendError } from './utils/errorLogger';
import { reloadIfChunkError, clearChunkReloadGuard } from './utils/chunkReload';
import './index.css';
import App from './App';

// Si llegamos hasta aquí es que el chunk de entrada cargó bien —
// liberamos el guard para permitir un reload futuro si hace falta.
clearChunkReloadGuard();

// Monitoreo Global de Errores
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  const reason: unknown = event.reason;
  if (reloadIfChunkError(reason)) return;
  logFrontendError(
    reason instanceof Error ? reason : new Error(String(reason)),
    { type: 'unhandled_promise' },
  );
});

window.onerror = (msg, src, line, col, err) => {
  if (reloadIfChunkError(err ?? msg)) return;
  logFrontendError(err ?? new Error(String(msg)), { source: src, line, col });
};

// Limpiar restos del sistema de auth antiguo (contraseñas en texto plano)
(['dw_admin_users', 'dw_admin_session'] as const).forEach(k => localStorage.removeItem(k));

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <PayPalScriptProvider options={{
    clientId: (import.meta.env.VITE_PAYPAL_CLIENT_ID as string) || 'test',
    currency:   'USD',
    intent:     'capture',
    components: 'buttons',
  }}>
    <BrowserRouter>
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <BackgroundJobsProvider>
                <App />
              </BackgroundJobsProvider>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </PayPalScriptProvider>,
);
