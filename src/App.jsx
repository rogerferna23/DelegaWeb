import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Public site (Keep static for instant load of the landing page)
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Services from './components/Services'
import Features from './components/Features'
import Process from './components/Process'
import Testimonials from './components/Testimonials'
import CTA from './components/CTA'
import Footer from './components/Footer'
import CookieConsent from './components/CookieConsent'
import ScrollToTop from './components/ScrollToTop'
import './App.css'

// Lazy load secondary public pages
const CookiePolicy = lazy(() => import('./components/CookiePolicy'))
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'))
const Disclaimer = lazy(() => import('./components/Disclaimer'))
const TermsAndConditions = lazy(() => import('./components/TermsAndConditions'))
const Copyright = lazy(() => import('./components/Copyright'))
const RefundPolicy = lazy(() => import('./components/RefundPolicy'))
const CloserProgram = lazy(() => import('./components/CloserProgram'))
const PrivateBooking = lazy(() => import('./components/PrivateBooking'))

// Lazy load Admin Panel pages & layout
const AdminLogin = lazy(() => import('./admin/AdminLogin'))
const AdminLayout = lazy(() => import('./admin/AdminLayout'))
const Dashboard = lazy(() => import('./admin/pages/Dashboard'))
const Productos = lazy(() => import('./admin/pages/Productos'))
const Vendedores = lazy(() => import('./admin/pages/Vendedores'))
const Reportes = lazy(() => import('./admin/pages/Reportes'))
const Transacciones = lazy(() => import('./admin/pages/Transacciones'))
const Campanas = lazy(() => import('./admin/pages/Campanas'))
const CampanasOnboarding = lazy(() => import('./admin/pages/CampanasOnboarding'))
const NuevaCampana = lazy(() => import('./admin/pages/NuevaCampana'))
const DetalleCampana = lazy(() => import('./admin/pages/DetalleCampana'))
const Configuracion = lazy(() => import('./admin/pages/Configuracion'))
const AuditLog = lazy(() => import('./admin/pages/AuditLog'))
const AdminRequests = lazy(() => import('./admin/pages/AdminRequests'))
const Postulantes = lazy(() => import('./admin/pages/Postulantes'))

// Protected Route and Context (Keep static as they are small auth/logic wrappers)
import ProtectedRoute from './admin/ProtectedRoute'
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

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background text-white">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-r-2 border-primary border-transparent"></div>
  </div>
)

function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
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
            <Route path="campanas/onboarding" element={<CampanasOnboarding />} />
            <Route path="campanas/nueva" element={<NuevaCampana />} />
            <Route path="campanas/:id" element={<DetalleCampana />} />
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
      </Suspense>
    </>
  )
}

export default App

