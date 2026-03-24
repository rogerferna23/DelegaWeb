import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Public site
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Services from './components/Services'
import Features from './components/Features'
import Process from './components/Process'
import Testimonials from './components/Testimonials'
import CTA from './components/CTA'
import Footer from './components/Footer'
import CookieConsent from './components/CookieConsent'
import CookiePolicy from './components/CookiePolicy'
import PrivacyPolicy from './components/PrivacyPolicy'
import Disclaimer from './components/Disclaimer'
import CloserProgram from './components/CloserProgram'
import TermsAndConditions from './components/TermsAndConditions'
import Copyright from './components/Copyright'
import RefundPolicy from './components/RefundPolicy'
import PrivateBooking from './components/PrivateBooking'
import './App.css'

// Admin panel
import AdminLogin from './admin/AdminLogin'
import AdminLayout from './admin/AdminLayout'
import ProtectedRoute from './admin/ProtectedRoute'
import Dashboard from './admin/pages/Dashboard'
import Productos from './admin/pages/Productos'
import Vendedores from './admin/pages/Vendedores'
import Reportes from './admin/pages/Reportes'
import Transacciones from './admin/pages/Transacciones'
import Campanas from './admin/pages/Campanas'
import Configuracion from './admin/pages/Configuracion'
import AuditLog from './admin/pages/AuditLog'
import AdminRequests from './admin/pages/AdminRequests'
import Postulantes from './admin/pages/Postulantes'
import { AdminDataProvider } from './admin/AdminDataContext'

function PublicSite() {
  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30 px-3">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Features />
        <Process />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <Routes>
      {/* Public website */}
      <Route
        path="/"
        element={
          <>
            <PublicSite />
            <CookieConsent />
          </>
        }
      />
      <Route
        path="/politica-de-cookies"
        element={
          <>
            <CookiePolicy />
            <CookieConsent />
          </>
        }
      />
      <Route
        path="/politica-de-privacidad"
        element={
          <>
            <PrivacyPolicy />
            <CookieConsent />
          </>
        }
      />
      <Route
        path="/descargos-de-responsabilidad"
        element={
          <>
            <Disclaimer />
            <CookieConsent />
          </>
        }
      />
      <Route
        path="/terminos-y-condiciones"
        element={
          <>
            <TermsAndConditions />
            <CookieConsent />
          </>
        }
      />
      <Route
        path="/copyright"
        element={
          <>
            <Copyright />
            <CookieConsent />
          </>
        }
      />
      <Route
        path="/politica-de-reembolsos"
        element={
          <>
            <RefundPolicy />
            <CookieConsent />
          </>
        }
      />
      <Route
        path="/politica-de-reembolsos"
        element={
          <>
            <RefundPolicy />
            <CookieConsent />
          </>
        }
      />
      <Route
        path="/trabaja-con-nosotros"
        element={
          <>
            <CloserProgram />
            <CookieConsent />
          </>
        }
      />
      <Route
        path="/sesion-estrategica"
        element={
          <>
            <PrivateBooking />
            <CookieConsent />
          </>
        }
      />

      {/* Admin login */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Protected admin panel */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDataProvider>
              <AdminLayout />
            </AdminDataProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="transacciones" element={<Transacciones />} />
        <Route path="productos" element={<Productos />} />
        <Route path="vendedores" element={<Vendedores />} />
        <Route path="postulantes" element={<Postulantes />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="campanas" element={<Campanas />} />
        <Route path="solicitudes" element={<AdminRequests />} />
        <Route
          path="auditoria"
          element={
            <ProtectedRoute requireSuperAdmin>
              <AuditLog />
            </ProtectedRoute>
          }
        />
        <Route
          path="configuracion"
          element={
            <ProtectedRoute requireSuperAdmin>
              <Configuracion />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

