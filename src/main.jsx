import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import { CartProvider } from './contexts/CartContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { logFrontendError } from './utils/errorLogger'
import './index.css'
import App from './App.jsx'

// Monitoreo Global de Errores (Fase 3.4)
window.addEventListener("unhandledrejection", (event) => {
  logFrontendError(new Error(event.reason), { type: "unhandled_promise" });
});

window.onerror = (msg, src, line, col, err) => {
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
    <HashRouter>
      <ErrorBoundary>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </ErrorBoundary>
    </HashRouter>
  </PayPalScriptProvider>
)
