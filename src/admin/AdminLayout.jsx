import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useInactivityTimer } from '../hooks/useInactivityTimer';
import {
  LayoutDashboard, Package, Users, BarChart3, Megaphone,
  Settings, Bell, Search, LogOut, Shield, PanelLeftClose,
  PanelLeftOpen, ClipboardList, FileText, Clock, RefreshCw,
  CheckCircle, XCircle, UserPlus, UserMinus, Inbox, Receipt, FileSpreadsheet, Palette, Sparkles
} from 'lucide-react';

import SecurityBanner from './components/SecurityBanner';
import BackgroundJobsIndicator from './components/BackgroundJobsIndicator';
import TimeAgo from './components/TimeAgo';

const navItems = [
  { label: 'Dashboard',     icon: LayoutDashboard, path: '/admin' },
  { label: 'Transacciones', icon: FileSpreadsheet, path: '/admin/transacciones' },
  { label: 'Productos',     icon: Package,         path: '/admin/productos' },
  { label: 'Vendedores',    icon: Users,           path: '/admin/vendedores' },
  { label: 'Reportes',      icon: BarChart3,       path: '/admin/reportes' },
  { label: 'Postulantes',   icon: UserPlus,        path: '/admin/postulantes' },
  { label: 'Campañas',      icon: Megaphone,       path: '/admin/campanas', badge: 'Pronto' },
  { label: 'Guiones IA',    icon: Sparkles,        path: '/admin/guiones-ia', badge: 'Nuevo' },
  { label: 'Creativos',     icon: Palette,         path: '/admin/creativos' },
  { label: 'Seguridad',     icon: Shield,          path: '/admin/seguridad' },
];

export default function AdminLayout() {
  const { currentUser, logout, pendingRequests, allRequests, reviewRequest, fetchAllRequests } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [processing, setProcessing] = useState(null);
  const notifRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Refresh requests when panel opens
  useEffect(() => {
    if (notifOpen) fetchAllRequests();
  }, [notifOpen, fetchAllRequests]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const handleReviewInline = async (id, approved) => {
    setProcessing(id + (approved ? '_a' : '_r'));
    await reviewRequest(id, approved);
    setProcessing(null);
  };

  const { showWarning, countdown, stayActive } = useInactivityTimer(handleLogout);

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  const pendingCount = pendingRequests?.length || 0;
  const resolvedRequests = (allRequests || []).filter(r => r.status !== 'pending').slice(0, 5);

  const allNavItems = [
    ...navItems,
    { label: 'Solicitudes', icon: ClipboardList, path: '/admin/solicitudes',
      badge: pendingCount > 0 ? String(pendingCount) : null, badgeAlert: true },
    ...(currentUser?.role === 'superadmin' ? [
      { label: 'Auditoría',    icon: FileText,        path: '/admin/auditoria' },
      { label: 'Configuración',icon: Settings,        path: '/admin/configuracion' },
    ] : []),
  ];

  const mins = Math.floor(countdown / 60);
  const secs = String(countdown % 60).padStart(2, '0');

  return (
    <div className="w-screen h-screen bg-background text-white flex overflow-hidden">
      <SecurityBanner />
      {/* ── Inactivity Warning Modal ── */}
      {showWarning && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inactivity-warning-title"
        >
          <div className="bg-cardbg border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-orange-400" aria-hidden="true" />
            </div>
            <h3 id="inactivity-warning-title" className="text-base font-bold text-white mb-1">¿Sigues ahí?</h3>
            <p className="text-gray-400 text-xs mb-4">
              Tu sesión cerrará en{' '}
              <span className="font-mono text-orange-400 font-bold text-sm">{mins > 0 ? `${mins}:${secs}` : countdown}</span>
              {' '}segundos por inactividad.
            </p>
            <div className="flex gap-2">
              <button
                onClick={stayActive}
                className="flex-1 bg-primary hover:bg-primaryhover text-white font-semibold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Continuar sesión
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 font-semibold py-2 rounded-xl text-xs transition-all"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className={`relative flex flex-col flex-shrink-0 bg-cardbg transition-[width] duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
        collapsed ? 'w-[52px]' : 'w-[196px]'
      }`}>
        <div className="flex items-center gap-2.5 px-3 h-12 border-b border-white/5 flex-shrink-0">
          <div className="flex-shrink-0 w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs">W</span>
          </div>
          <span className={`font-bold text-xs tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ${
            collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          }`}>
            Delega<span className="text-primary">Web</span>
          </span>
        </div>

        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {allNavItems.map((item) => {
            const { label, icon: NavIcon, path, badge, badgeAlert } = item;
            // Verificación defensiva del componente de icono
            const ActualIcon = (typeof NavIcon === 'function' || (typeof NavIcon === 'object' && NavIcon !== null)) 
              ? NavIcon 
              : Shield;

            return (
              <NavLink
                key={path}
                to={path}
                end={path === '/admin'}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 relative ${
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <ActualIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className={`flex-1 whitespace-nowrap transition-all duration-300 ${
                collapsed ? 'w-0 opacity-0 overflow-hidden' : 'opacity-100'
              }`}>
                {label}
              </span>
              {!collapsed && badge && (
                <span className={`text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                  badgeAlert ? 'bg-red-500 animate-pulse' : 'bg-primaryhover'
                }`}>
                  {badge}
                </span>
              )}
              {collapsed && badge && (
                <span className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${
                  badgeAlert ? 'bg-red-500' : 'bg-primaryhover'
                }`} />
              )}
            </NavLink>
          );
        })}
        </nav>

        <div className="border-t border-white/5 py-2 px-2 space-y-0.5 flex-shrink-0">
          <button
            onClick={() => setCollapsed(v => !v)}
            className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            title={collapsed ? 'Expandir panel' : 'Contraer panel'}
          >
            <span className="flex-shrink-0">
              {collapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
            </span>
            <span className={`whitespace-nowrap transition-all duration-300 ${collapsed ? 'w-0 opacity-0 overflow-hidden' : 'opacity-100'}`}>
              Contraer panel
            </span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-xs text-gray-400 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200"
            title={collapsed ? 'Cerrar sesión' : undefined}
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            <span className={`whitespace-nowrap transition-all duration-300 ${collapsed ? 'w-0 opacity-0 overflow-hidden' : 'opacity-100'}`}>
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="relative z-20 h-12 border-b border-white/5 bg-cardbg/80 backdrop-blur-md flex items-center justify-between px-5 gap-4 flex-shrink-0">
          <div className="flex-1 max-w-xs">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full bg-background border border-white/8 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/40 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Bell with notification dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(v => !v)}
                className="relative w-8 h-8 rounded-lg bg-background border border-white/8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <Bell className="w-3.5 h-3.5" />
                {pendingCount > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {pendingCount}
                  </span>
                ) : (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary rounded-full border-2 border-background" />
                )}
              </button>

              {/* Dropdown panel */}
              {notifOpen && (
                <div className="absolute right-0 top-10 w-80 bg-cardbg border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Notificaciones</span>
                    {pendingCount > 0 && (
                      <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full font-semibold">
                        {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {/* Pending requests */}
                    {pendingRequests.length > 0 ? (
                      pendingRequests.map(req => {
                        // Preferir las columnas nuevas (amount, metadata)
                        // con fallback al hack viejo (target_email/target_role)
                        // para solicitudes creadas antes de la migración 20260420.
                        const expenseAmount = req.amount != null
                          ? Number(req.amount).toLocaleString()
                          : req.target_email;
                        const exportMode  = req.metadata?.export_mode  ?? req.target_name;
                        const exportMonth = req.metadata?.export_month ?? req.target_email;
                        const ACTION_MAP = {
                          create_admin:    { label: 'Agregar admin',     Icon: UserPlus,       color: 'bg-blue-500/10 text-blue-400',    detail: req.target_email },
                          delete_admin:    { label: 'Eliminar admin',    Icon: UserMinus,      color: 'bg-orange-500/10 text-orange-400', detail: req.target_email },
                          add_expense:     { label: 'Nuevo gasto',       Icon: Receipt,        color: 'bg-red-500/10 text-red-400',       detail: `${req.target_name} · $${expenseAmount}` },
                          download_report: { label: 'Descarga de reporte', Icon: FileSpreadsheet, color: 'bg-green-500/10 text-green-400',  detail: `Excel ${exportMode === 'year' ? 'año completo' : exportMonth}` },
                        };
                        const cfg = ACTION_MAP[req.action] || { label: req.action, Icon: FileText, color: 'bg-white/5 text-gray-400', detail: req.target_email };
                        const { label, Icon, color, detail } = cfg;
                        return (
                          <div key={req.id} className="px-4 py-3 border-b border-white/5 hover:bg-white/[0.02]">
                            <div className="flex items-start gap-2.5">
                              <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
                                <Icon className="w-3 h-3" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium text-white">{label}</p>
                                <p className="text-[10px] text-gray-500 truncate">{detail}</p>
                                <TimeAgo dateStr={req.created_at} className="text-[9px] text-gray-600" />
                                <div className="flex gap-1.5 mt-1.5">
                                  <button
                                    onClick={() => handleReviewInline(req.id, true)}
                                    disabled={!!processing}
                                    className="flex items-center gap-1 px-2 py-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-[10px] font-medium rounded-md transition-all disabled:opacity-50"
                                  >
                                    <CheckCircle className="w-2.5 h-2.5" /> Aprobar
                                  </button>
                                  <button
                                    onClick={() => handleReviewInline(req.id, false)}
                                    disabled={!!processing}
                                    className="flex items-center gap-1 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-medium rounded-md transition-all disabled:opacity-50"
                                  >
                                    <XCircle className="w-2.5 h-2.5" /> Rechazar
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-4 py-3 border-b border-white/5">
                        <div className="flex items-center gap-2 text-gray-500">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500/40" />
                          <span className="text-[11px]">Sin solicitudes pendientes</span>
                        </div>
                      </div>
                    )}

                    {/* Resolved history */}
                    {resolvedRequests.length > 0 && (
                      <>
                        <div className="px-4 py-1.5 bg-white/[0.02]">
                          <span className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider">Recientes</span>
                        </div>
                        {resolvedRequests.map(req => (
                          <div key={req.id} className="px-4 py-2.5 flex items-center gap-2.5 border-b border-white/5">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              req.status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-gray-400 truncate">{req.target_email}</p>
                              <p className="text-[9px] text-gray-600">
                                {req.status === 'approved' ? '✅ Aprobada' : '❌ Rechazada'} · <TimeAgo dateStr={req.created_at} />
                              </p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {pendingRequests.length === 0 && resolvedRequests.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Inbox className="w-7 h-7 text-gray-700 mb-2" />
                        <p className="text-[11px] text-gray-600">No hay notificaciones</p>
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-2 border-t border-white/5">
                    <button
                      onClick={() => { setNotifOpen(false); navigate('/admin/solicitudes'); }}
                      className="text-[10px] text-primary hover:text-primaryhover transition-colors"
                    >
                      Ver todas las solicitudes →
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-5 bg-white/10" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/20">
                <span className="text-white font-bold text-[10px]">{initials}</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] font-medium text-white leading-tight">{currentUser?.name?.split(' ')[0]}</p>
                <p className="text-[9px] text-gray-500 leading-tight capitalize">
                  {currentUser?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                </p>
              </div>
              {currentUser?.role === 'superadmin' && (
                <Shield className="w-3 h-3 text-primary" title="Super Admin" />
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-background px-7 py-5">
          <div key={pathname} className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Indicador global de procesos en segundo plano.
          Persiste entre cambios de ruta porque vive fuera del <Outlet />. */}
      <BackgroundJobsIndicator />
    </div>
  );
}
