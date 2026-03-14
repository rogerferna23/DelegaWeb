import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import { CartProvider } from './contexts/CartContext'
import './index.css'
import App from './App.jsx'

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
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </PayPalScriptProvider>
)
