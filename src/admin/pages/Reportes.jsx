import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import {
  Download, Plus, Trash2, FileSpreadsheet, ChevronDown,
  AlertCircle, ChevronRight, FolderOpen, Folder, Send, Zap, ShoppingCart, LayoutDashboard, Check, Clock, X,
  DollarSign, TrendingUp, Package
} from 'lucide-react';
import { useAdminVendors, useAdminGastos, useAdminVentas } from '../AdminDataContext';
import { SERVICES_CATALOG } from '../../constants/services';
import { exportToExcel } from '../../utils/exportExcel';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { sanitizeText } from '../../lib/sanitize';
import { validate, gastoSchema, ventaSchema } from '../../schemas/forms.schema';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

const PRODUCTS = [
  { name: 'Landing Page Premium', category: 'Web', price: '$300', sales: 48, revenue: 14400, growth: 12, status: 'Activo' },
  { name: 'E-Commerce Starter', category: 'Web', price: '$500', sales: 35, revenue: 17500, growth: 8, status: 'Activo' },
  { name: 'Portafolio Profesional', category: 'Web', price: '$200', sales: 29, revenue: 5800, growth: 22, status: 'Activo' },
  { name: 'Campaña Google Ads', category: 'Marketing', price: '$300', sales: 24, revenue: 7200, growth: 5, status: 'Activo' },
  { name: 'Sitio Corporativo', category: 'Web', price: '$750', sales: 18, revenue: 13500, growth: 15, status: 'Activo' },
  { name: 'SEO Básico', category: 'Marketing', price: '$150', sales: 12, revenue: 1800, growth: -3, status: 'Pausado' },
  { name: 'Branding Completo', category: 'Diseño', price: '$600', sales: 8, revenue: 4800, growth: 0, status: 'Activo' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-cardbg border border-white/10 rounded-lg px-3 py-2 text-xs space-y-1">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.dataKey} style={{ color: p.color }}>{p.name}: ${Number(p.value).toLocaleString()}</p>
        ))}
      </div>
    );
  }
  return null;
};

const EMPTY_FORM = { description: '', amount: '', date: new Date().toISOString().slice(0, 10) };

// Returns "2026-02" key for grouping
const getMonthKey = (date) => date ? date.slice(0, 7) : null;
const getMonthLabel = (key) => {
  if (!key) return '';
  const [y, m] = key.split('-');
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
};

export default function Reportes() {
  const { vendors, totalRevenue } = useAdminVendors();
  const { gastos, addGasto, removeGasto, totalsByMonth, totalGastos } = useAdminGastos();
  const { ventas, addVenta, removeVenta, approveVenta, totalVentas } = useAdminVentas();
  const { currentUser, requestAdminAction } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMode, setExportMode] = useState('year');
  const [exportMonth, setExportMonth] = useState('Ene');
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const toast = useToast();

  // Ventas form state
  const EMPTY_VENTA_FORM = {
    clienteNombre: '',
    clienteEmail: '',
    clienteTelefono: '',
    campanaOrigen: '',
    notas: '',
    importe: '', // We will auto-calculate this but allow override
    prioridad: false,
    fecha: new Date().toISOString().slice(0, 10),
  };
  const WEB_SERVICES_LIST = ['Landing Pages', 'Web con panel de administración', 'Ecommerce'];
  const ALL_SERVICES = SERVICES_CATALOG;
  const [ventaForm, setVentaForm] = useState(EMPTY_VENTA_FORM);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [ventaError, setVentaError] = useState('');
  const [confirmDeleteVenta, setConfirmDeleteVenta] = useState(null);
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [isCampaignDropdownOpen, setIsCampaignDropdownOpen] = useState(false);

  const CAMPAIGN_OPTIONS = [
    { value: 'cold_entrepreneurs', label: 'Tráfico Frío - Emprendedores' },
    { value: 'retargeting_hot', label: 'Retargeting General' },
    { value: 'organic_social', label: 'Orgánico (No campaña)' },
    { value: 'referral', label: 'Recomendación' },
  ];
  
  // A sale is considered 'web' if ANY of the selected services is a web service
  const isWebVenta = serviciosSeleccionados.some(sel => 
    WEB_SERVICES_LIST.some(webSvc => sel.name === webSvc || sel.name.includes('Web con panel'))
  );

  // Adaptador hacia el toast global para mantener las llamadas existentes
  // (showRequestToast(msg, 'success'|'error'|...)).
  const showRequestToast = (msg, type = 'success') => {
    const fn = toast[type] || toast.info;
    fn(msg);
  };

  // Current month key
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  // Open accordions — current month open by default
  const [openMonths, setOpenMonths] = useState(() => new Set([currentMonthKey]));

  const toggleMonth = (key) => {
    setOpenMonths(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Group gastos by month key, sorted newest first
  const grouped = useMemo(() => {
    const map = {};
    gastos.forEach(g => {
      const key = getMonthKey(g.date);
      if (!key) return;
      if (!map[key]) map[key] = { key, entries: [] };
      map[key].entries.push(g);
    });
    return Object.values(map).sort((a, b) => b.key.localeCompare(a.key));
  }, [gastos]);

  // Calculate ingresos per month based on real ventas
  const ingresosPerMonth = useMemo(() => {
    const acc = {};
    MONTHS.forEach(m => acc[m] = 0);
    ventas.forEach(v => {
      if (v.estado === 'pagado') {
        const d = new Date(v.fecha);
        const monthIndex = d.getMonth();
        // Fallback for valid date
        if (!isNaN(monthIndex) && monthIndex >= 0 && monthIndex < 12) {
          acc[MONTHS[monthIndex]] += parseFloat(v.importe || 0);
        }
      }
    });
    return acc;
  }, [ventas]);

  const totalIngresos = Object.values(ingresosPerMonth).reduce((a, b) => a + b, 0);
  const beneficioNeto = totalIngresos - totalGastos;

  const chartData = MONTHS.map(m => ({ mes: m, ingresos: ingresosPerMonth[m] || 0, gastos: totalsByMonth[m] || 0 }));

  const categoryData = useMemo(() => {
    const getCategoria = (servicioStr) => {
      if (!servicioStr) return 'Otros';
      const str = servicioStr.toLowerCase();
      if (str.includes('web') || str.includes('landing') || str.includes('ecommerce') || str.includes('sitio')) return 'Web';
      if (str.includes('seo') || str.includes('campaña') || str.includes('ads') || str.includes('marketing')) return 'Marketing';
      if (str.includes('diseño') || str.includes('branding') || str.includes('marca')) return 'Diseño';
      if (str.includes('coaching') || str.includes('starter') || str.includes('pro') || str.includes('elite')) return 'Planes/Consultoría';
      return 'Otros';
    };

    const map = {
      'Web': 0,
      'Marketing': 0,
      'Diseño': 0,
      'Planes/Consultoría': 0,
      'Otros': 0
    };
    ventas.forEach(v => {
        if (v.estado === 'pagado') {
            const cat = getCategoria(v.servicio);
            map[cat] += parseFloat(v.importe || 0);
        }
    });
    // Return only categories with > 0, or at least empty array so it shows nothing until sales happen
    const result = Object.entries(map)
      .map(([categoria, ingresos]) => ({ categoria, ingresos }))
      .filter(item => item.ingresos > 0);
    return result;
  }, [ventas]);

  const monthsFilled = MONTHS.filter(m => ingresosPerMonth[m] > 0 || totalsByMonth[m] > 0).length || 1;
  const yearComplete = monthsFilled === 12;

  const handleAddGasto = async (e) => {
    e.preventDefault();
    setFormError('');

    const { ok, data, errors } = validate(gastoSchema, form);
    if (!ok) {
      setFormError(errors.description || errors.amount || errors.date || 'Datos inválidos');
      return;
    }

    if (isSuperAdmin) {
      // Superadmin: add directly
      addGasto(data);
      setOpenMonths(prev => new Set([...prev, getMonthKey(data.date)]));
      setForm(EMPTY_FORM);
    } else {
      // Regular admin: submit request for approval.
      // Usamos los campos con nombre claro (amount / requestDate) en
      // lugar del hack anterior que metía el monto en targetEmail y la
      // fecha en targetRole. La columna nueva se añade en la migración
      // 20260420_admin_requests_proper_columns.sql.
      const result = await requestAdminAction({
        action: 'add_expense',
        targetName: form.description,
        amount: Number(form.amount),
        requestDate: form.date,
      });
      if (result.success) {
        setForm(EMPTY_FORM);
        showRequestToast('Solicitud de gasto enviada al superadmin 🔔');
      } else {
        setFormError(result.error);
      }
    }
  };

  const handleExport = async () => {
    if (isSuperAdmin) {
      exportToExcel({ mode: exportMode, selectedMonth: exportMonth, gastosList: gastos, totalsByMonth, ingresosPerMonth, vendors, products: PRODUCTS });
      setShowExportModal(false);
    } else {
      // Regular admin: request approval. Los parámetros específicos de
      // exportación viajan en `metadata` en vez de reutilizar campos
      // pensados para otra cosa.
      const result = await requestAdminAction({
        action: 'download_report',
        metadata: { export_mode: exportMode, export_month: exportMonth },
      });
      setShowExportModal(false);
      if (result.success) {
        showRequestToast('Solicitud de descarga enviada al superadmin 🔔');
      }
    }
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="relative">
      {/* Los toasts ahora se renderizan desde ToastProvider (main.jsx). */}

      {/* Export Modal */}
      {showExportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-modal-title"
        >
          <div className="bg-cardbg border border-white/10 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4 text-green-400" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="export-modal-title" className="text-sm font-semibold text-white">Exportar a Excel</h2>
                  <p className="text-[10px] text-gray-500">4 hojas de datos</p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-500 hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
            <div className="bg-background border border-white/5 rounded-lg p-3 mb-4 space-y-1.5">
              <p className="text-[10px] text-gray-500 mb-2 font-medium uppercase tracking-wide">Hojas incluidas</p>
              {[
                { icon: '📊', label: 'Resumen Financiero', desc: 'Ingresos, gastos y margen por mes' },
                { icon: '📦', label: 'Productos Vendidos', desc: 'Ventas e ingresos por producto' },
                { icon: '👥', label: 'Vendedores', desc: 'Analíticas por vendedor' },
                { icon: '💸', label: 'Gastos Detallados', desc: 'Descripción, importe y fecha de cada partida' },
              ].map(({ icon, label, desc }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <span className="text-sm">{icon}</span>
                  <div>
                    <p className="text-xs text-white">{label}</p>
                    <p className="text-[10px] text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mb-4">
              <p className="text-[10px] font-medium text-gray-400 mb-2">Rango de datos</p>
              <div className="grid grid-cols-2 gap-2">
                {[['year', '📅 Año completo', `${monthsFilled} meses`], ['month', '🗓️ Un mes', 'Mes específico']].map(([val, label, sub]) => (
                  <button key={val} onClick={() => setExportMode(val)}
                    className={`py-2.5 rounded-lg text-xs font-medium border transition-all ${exportMode === val ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-background border-white/10 text-gray-400 hover:border-white/20'}`}>
                    {label}<p className="text-[9px] mt-0.5 font-normal opacity-70">{sub}</p>
                  </button>
                ))}
              </div>
            </div>
            {exportMode === 'month' && (
              <div className="mb-4">
                <p className="text-[10px] font-medium text-gray-400 mb-2">Mes</p>
                <div className="relative">
                  <select value={exportMonth} onChange={e => setExportMonth(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none appearance-none">
                    {MONTHS.map(m => <option key={m} value={m}>{m} — ${(totalsByMonth[m] || 0).toLocaleString()} gastos</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                </div>
              </div>
            )}
            {yearComplete && exportMode === 'year' && (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 mb-4">
                <span className="text-sm">✅</span>
                <p className="text-[10px] text-green-400">Año completo — listo para declaración fiscal</p>
              </div>
            )}
            <button onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 font-semibold py-2.5 rounded-lg text-xs transition-all text-white bg-green-600 hover:bg-green-700">
              {isSuperAdmin
                ? <><Download className="w-3.5 h-3.5" /> Descargar Excel (.xlsx)</>
                : <><Send className="w-3.5 h-3.5" /> Solicitar descarga al superadmin</>}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-white">Reportes</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Ingresos automáticos · Gastos por partida
            {yearComplete && <span className="ml-2 text-green-400 font-medium">· Año completo ✓</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 bg-cardbg border border-white/5 rounded-lg px-3 py-1.5">
            <div className="flex gap-0.5">
              {MONTHS.map(m => (
                <div key={m} className={`w-2 h-4 rounded-sm transition-colors ${ingresosPerMonth[m] > 0 ? 'bg-primary' : 'bg-white/5'}`} title={m} />
              ))}
            </div>
            <span className="text-[10px] text-gray-400">{monthsFilled}/12</span>
          </div>
          <button onClick={() => setShowExportModal(true)}
            className={`flex items-center gap-1.5 text-white font-semibold px-3 py-2 rounded-lg text-xs transition-all ${
              isSuperAdmin
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-primary/80 hover:bg-primary'
            }`}>
            {isSuperAdmin
              ? <><FileSpreadsheet className="w-3.5 h-3.5" /> Exportar Excel</>
              : <><Send className="w-3.5 h-3.5" /> Solicitar Excel</>}
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mb-3">
        <div className="bg-cardbg border border-white/5 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-white mb-4">Ingresos vs Gastos</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ left: -20, right: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="mes" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 10 }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v}`}
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
              <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#f97316" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="gastos" name="Gastos" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-cardbg border border-white/5 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-white mb-4">Ingresos por Especialidad</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={categoryData} margin={{ left: -20, right: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="categoria" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 10 }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v}`}
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="ingresos" name="Ingresos" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gastos section */}
      <div className="bg-cardbg border border-white/5 rounded-xl overflow-hidden mb-3">
        {/* Section header + add form */}
        <div className="px-5 py-3.5 border-b border-white/5">
          <div className="flex items-center justify-between mb-0">
            <div>
              <h2 className="text-xs font-semibold text-white">Registro de Gastos</h2>
              <p className="text-[10px] text-gray-500 mt-0.5">{gastos.length} partidas · Total: ${totalGastos.toLocaleString()}</p>
            </div>
          </div>

          {/* Always-visible add form */}
          <form onSubmit={handleAddGasto} className="mt-3.5" aria-label="Registrar nuevo gasto" aria-describedby={formError ? 'gasto-form-error' : undefined}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="gasto-description" className="text-[10px] font-medium text-gray-400 mb-1 block">Descripción *</label>
                <input
                  id="gasto-description"
                  type="text" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Ej: Hosting, Publicidad, Nómina..."
                  aria-invalid={!!formError}
                  aria-required="true"
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/40 transition-all"
                />
              </div>
              <div>
                <label htmlFor="gasto-amount" className="text-[10px] font-medium text-gray-400 mb-1 block">Importe ($) *</label>
                <input
                  id="gasto-amount"
                  type="number" min="0" step="0.01" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                  aria-invalid={!!formError}
                  aria-required="true"
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/40 transition-all"
                />
              </div>
              <div>
                <label htmlFor="gasto-date" className="text-[10px] font-medium text-gray-400 mb-1 block">Fecha de pago *</label>
                <div className="flex gap-2">
                  <input
                    id="gasto-date"
                    type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    aria-invalid={!!formError}
                    aria-required="true"
                    className="flex-1 bg-background border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/40 transition-all [color-scheme:dark]"
                  />
                  <button type="submit"
                    className="flex items-center gap-1 bg-primary hover:bg-primaryhover text-white font-semibold px-3 py-2 rounded-lg text-xs transition-all whitespace-nowrap">
                    {isSuperAdmin
                      ? <><Plus className="w-3.5 h-3.5" aria-hidden="true" /> Agregar</>
                      : <><Send className="w-3.5 h-3.5" aria-hidden="true" /> Solicitar</>}
                  </button>
                </div>
              </div>
            </div>
            {formError && (
              <div id="gasto-form-error" role="alert" className="flex items-center gap-1.5 text-red-400 text-[10px] bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mt-2">
                <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> {formError}
              </div>
            )}
          </form>
        </div>

        {/* Month accordions */}
        <div className="divide-y divide-white/5">
          {grouped.length === 0 && (
            <div className="px-5 py-8 text-center text-xs text-gray-500">
              No hay gastos registrados. Agrega el primero arriba.
            </div>
          )}
          {grouped.map(({ key, entries }) => {
            const isOpen = openMonths.has(key);
            const isCurrent = key === currentMonthKey;
            const monthTotal = entries.reduce((s, g) => s + (g.amount || 0), 0);
            return (
              <div key={key}>
                {/* Month header (accordion trigger) */}
                <button
                  onClick={() => toggleMonth(key)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors text-left"
                >
                  {isOpen
                    ? <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
                    : <Folder className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  }
                  <span className="text-xs font-semibold text-white flex-1">{getMonthLabel(key)}</span>
                  {isCurrent && (
                    <span className="text-[9px] font-medium bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                      Mes actual
                    </span>
                  )}
                  <span className="text-xs font-semibold text-red-400 mr-2">${monthTotal.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-500">{entries.length} partida{entries.length !== 1 ? 's' : ''}</span>
                  <ChevronRight className={`w-3.5 h-3.5 text-gray-500 ml-2 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>

                {/* Entries table */}
                {isOpen && (
                  <div className="border-t border-white/5 bg-background/30 slide-down">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5">
                          {['Descripción', 'Fecha de Pago', 'Importe', ''].map(h => (
                            <th key={h} className="px-5 py-2 text-left text-[10px] font-medium text-gray-600 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {entries.map(g => (
                          <tr key={g.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-5 py-2.5">
                              <span className="text-xs text-white">{g.description}</span>
                            </td>
                            <td className="px-5 py-2.5">
                              <span className="text-xs text-gray-400">{fmtDate(g.date)}</span>
                            </td>
                            <td className="px-5 py-2.5">
                              <span className="text-xs font-semibold text-red-400">${Number(g.amount).toLocaleString()}</span>
                            </td>
                            <td className="px-5 py-2.5">
                              {confirmDelete === g.id ? (
                                <div className="flex items-center gap-2">
                                  <button onClick={() => { removeGasto(g.id); setConfirmDelete(null); }} className="text-[10px] text-red-400 hover:text-red-300 font-medium">Sí</button>
                                  <button onClick={() => setConfirmDelete(null)} className="text-[10px] text-gray-500 hover:text-gray-300">No</button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmDelete(g.id)} className="w-6 h-6 rounded flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {/* Month subtotal */}
                        <tr className="bg-white/[0.02]">
                          <td colSpan={2} className="px-5 py-2 text-[10px] text-gray-500 font-medium">Total {getMonthLabel(key)}</td>
                          <td className="px-5 py-2 text-xs font-bold text-red-400">${monthTotal.toLocaleString()}</td>
                          <td />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── VENTAS MANUALES ── */}
      <div className="bg-cardbg border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Ventas Manuales</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Registra ventas realizadas fuera del sitio web</p>
          </div>
          <span className="text-xs font-bold text-green-400">${totalVentas.toLocaleString()} USD total</span>
        </div>

        {/* Add venta form */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 mb-4 space-y-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Nueva venta</p>
          <div className="grid grid-cols-2 gap-3">
            {/* Services List & Adder */}
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] text-gray-500 block">Servicios incluidos</label>
              
              {/* Selected Services Tags */}
              {serviciosSeleccionados.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {serviciosSeleccionados.map((svc, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary px-2 py-1 rounded-md text-xs">
                      <span>{svc.name} <span className="opacity-70">(${svc.price})</span></span>
                      <button 
                        type="button" 
                        onClick={() => {
                          const newSel = [...serviciosSeleccionados];
                          const removed = newSel.splice(idx, 1)[0];
                          setServiciosSeleccionados(newSel);
                          setVentaForm(p => ({
                            ...p,
                            importe: Math.max(0, parseFloat(p.importe || 0) - removed.price).toString()
                          }));
                        }}
                        className="hover:text-red-400 opacity-70 hover:opacity-100 transition-colors p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Service Dropdown Main Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                  className="w-full flex items-center justify-between bg-white/5 border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors"
                >
                  <span className="text-gray-400 flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Agregar servicio</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isServiceDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isServiceDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsServiceDropdownOpen(false)}></div>
                    <div className="absolute z-20 w-full mt-1.5 bg-[#161618] border border-white/10 rounded-lg shadow-xl overflow-hidden py-1.5 max-h-56 overflow-y-auto custom-scrollbar">
                      {ALL_SERVICES.map(s => (
                        <button
                          key={s.name}
                          type="button"
                          onClick={() => {
                            setServiciosSeleccionados(prev => [...prev, s]);
                            setVentaForm(p => ({
                              ...p,
                              importe: (parseFloat(p.importe || 0) + s.price).toString(),
                              prioridad: false // Reset priority logic on new item
                            }));
                            setIsServiceDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-gray-300 hover:bg-white/5 hover:text-white"
                        >
                          <span>{s.name}</span>
                          <span className="opacity-60 text-[10px]">${s.price} USD</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Client name */}
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Nombre cliente *</label>
              <input
                type="text"
                placeholder="Juan García"
                value={ventaForm.clienteNombre}
                onChange={e => setVentaForm(p => ({ ...p, clienteNombre: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
              />
            </div>
            {/* Client email */}
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Email cliente *</label>
              <input
                type="email"
                placeholder="juan@email.com"
                value={ventaForm.clienteEmail}
                onChange={e => setVentaForm(p => ({ ...p, clienteEmail: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
              />
            </div>
            {/* Client phone */}
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Teléfono (WhatsApp)</label>
              <input
                type="tel"
                placeholder="+52 123 456 7890"
                value={ventaForm.clienteTelefono}
                onChange={e => setVentaForm(p => ({ ...p, clienteTelefono: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
              />
            </div>
            {/* Origin Custom Dropdown */}
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Campaña de origen *</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCampaignDropdownOpen(!isCampaignDropdownOpen)}
                  className="w-full flex items-center justify-between bg-white/5 border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors text-left"
                >
                  <span className={ventaForm.campanaOrigen ? "text-white" : "text-gray-400"}>
                    {ventaForm.campanaOrigen 
                      ? CAMPAIGN_OPTIONS.find(o => o.value === ventaForm.campanaOrigen)?.label || 'Seleccionado'
                      : 'Selecciona la campaña...'}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isCampaignDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCampaignDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsCampaignDropdownOpen(false)}></div>
                    <div className="absolute z-20 w-full mt-1.5 bg-[#161618] border border-white/10 rounded-lg shadow-xl overflow-hidden py-1.5 max-h-56 overflow-y-auto custom-scrollbar">
                      {CAMPAIGN_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setVentaForm(p => ({ ...p, campanaOrigen: opt.value }));
                            setIsCampaignDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                            ventaForm.campanaOrigen === opt.value
                              ? 'bg-primary/20 text-primary'
                              : 'text-gray-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* Notes */}
            <div className="col-span-2">
              <label className="text-[10px] text-gray-500 mb-1 block">Notas cortas</label>
              <textarea
                rows={2}
                placeholder="Contexto del cliente o de la venta..."
                value={ventaForm.notas}
                onChange={e => setVentaForm(p => ({ ...p, notas: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
              />
            </div>
            {/* Amount */}
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Importe total (USD)</label>
              <input
                type="number"
                placeholder="0"
                min="0"
                value={ventaForm.importe}
                onChange={e => setVentaForm(p => ({ ...p, importe: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
              />
            </div>
            {/* Date */}
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Fecha</label>
              <input
                type="date"
                value={ventaForm.fecha}
                onChange={e => setVentaForm(p => ({ ...p, fecha: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          {/* Priority delivery — only for web services */}
          {isWebVenta && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">⚡ Entrega (Web)</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (ventaForm.prioridad) {
                       // Deselecting priority
                       setVentaForm(p => ({ ...p, prioridad: false, importe: Math.max(0, parseFloat(p.importe || 0) - 100).toString() }));
                    }
                  }}
                  className={`flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all ${
                    !ventaForm.prioridad
                      ? 'bg-primary/10 border-primary/40 text-primary'
                      : 'bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <span className="text-xs font-bold">Estándar</span>
                  <span className="text-[10px] opacity-70">14 – 21 días hábiles</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!ventaForm.prioridad) {
                       // Selecting priority
                       setVentaForm(p => ({ ...p, prioridad: true, importe: (parseFloat(p.importe || 0) + 100).toString() }));
                    }
                  }}
                  className={`flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all ${
                    ventaForm.prioridad
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                      : 'bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <span className="text-xs font-bold">⚡ Prioritario</span>
                  <span className="text-[10px] opacity-70">2 días hábiles (+$100)</span>
                </button>
              </div>
            </div>
          )}

          {ventaError && (
            <p className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{ventaError}</p>
          )}

          <button
            onClick={() => {
              if (serviciosSeleccionados.length === 0) return setVentaError('Añade al menos un servicio a la venta.');

              const combinedServiceNames = serviciosSeleccionados.map(s => s.name).join(', ');
              const candidate = {
                ...ventaForm,
                clienteNombre: sanitizeText(ventaForm.clienteNombre),
                clienteEmail: sanitizeText(ventaForm.clienteEmail || ''),
                servicio: combinedServiceNames,
                importe: ventaForm.importe,
              };

              const { ok, data, errors } = validate(ventaSchema, candidate);
              if (!ok) {
                const firstError = errors.clienteNombre || errors.clienteEmail || errors.clienteTelefono || errors.importe || 'Revisa los datos del formulario';
                return setVentaError(firstError);
              }
              setVentaError('');

              addVenta({
                ...ventaForm,
                ...data,
                moneda: 'USD',
              }).then(res => {
                if (res && res.success) {
                  setServiciosSeleccionados([]);
                  setVentaForm(EMPTY_VENTA_FORM);
                  showRequestToast('Venta registrada', 'success');
                } else {
                  setVentaError('Error al guardar la venta en la base de datos.');
                }
              });
            }}
            className="w-full flex items-center justify-center gap-1.5 bg-primary hover:bg-primaryhover text-white text-xs font-semibold py-2 rounded-xl transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Registrar venta
          </button>
        </div>

        {/* Ventas table */}
        {ventas.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-white/5 mt-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  {['Fecha','Servicio','Cliente','Importe','Estado','Entrega',''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {ventas.map(v => (
                  <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5 text-gray-400">{v.fecha}</td>
                    <td className="px-4 py-2.5 text-white font-medium">{v.servicio}</td>
                    <td className="px-4 py-2.5">
                      <p className="text-white">{v.clienteNombre}</p>
                      <p className="text-gray-600 text-[10px]">{v.clienteEmail}</p>
                    </td>
                    <td className="px-4 py-2.5 text-white font-bold">${Number(v.importe).toLocaleString()} USD</td>
                    <td className="px-4 py-2.5">
                      {v.estado === 'pagado' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-green-400">
                          <Check className="w-3 h-3" /> Aprobado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-500">
                          <Clock className="w-3 h-3" /> Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {v.prioridad ? (
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                          </span>
                          <span className="text-[10px] font-semibold text-amber-400 tracking-tight">Prioritario (2d)</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-600">Estandar</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {confirmDeleteVenta === v.id ? (
                        <div className="flex items-center gap-1.5 justify-end animation-fade-in">
                          <button 
                            onClick={() => { removeVenta(v.id); setConfirmDeleteVenta(null); }} 
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[9px] px-2 py-1 rounded-md transition-all border border-red-500/10 flex items-center gap-1"
                          >
                            <Trash2 className="w-2.5 h-2.5" /> Sí, eliminar
                          </button>
                          <button 
                            onClick={() => setConfirmDeleteVenta(null)} 
                            className="bg-white/5 hover:bg-white/10 text-gray-400 text-[9px] px-2 py-1 rounded-md transition-all border border-white/5"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 justify-end">
                          {v.estado === 'pendiente' && (
                            <button
                              title="Aprobar venta"
                              onClick={() => approveVenta(v.id)}
                              className="w-6 h-6 rounded flex items-center justify-center text-green-500 hover:bg-green-500/10 transition-all"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button title="Eliminar" onClick={() => setConfirmDeleteVenta(v.id)} className="w-6 h-6 rounded flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-600 text-xs py-6">No hay ventas registradas aún.</p>
        )}
      </div>

      {/* Summary cards - balance final */}
      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1.5 mt-2 text-center">Resumen del Periodo</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Ingresos Totales', value: `$${totalIngresos.toLocaleString()}`, sub: 'Ventas pagadas', color: 'text-green-400', icon: <DollarSign className="w-3.5 h-3.5" /> },
          { label: 'Gastos Totales', value: `$${totalGastos.toLocaleString()}`, sub: `${gastos.length} registros`, color: 'text-red-400', icon: <TrendingUp className="w-3.5 h-3.5 rotate-180" /> },
          { label: 'Beneficio Neto', value: `$${beneficioNeto.toLocaleString()}`,
            sub: totalIngresos > 0 ? `Margen del ${Math.round((beneficioNeto / totalIngresos) * 100)}%` : 'Sin ventas',
            color: beneficioNeto >= 0 ? 'text-primary' : 'text-red-400', icon: <Package className="w-3.5 h-3.5" /> },
        ].map(({ label, value, sub, color, icon }) => (
          <div key={label} className="bg-cardbg border border-white/5 rounded-xl p-4 flex justify-between items-start group hover:border-white/10 transition-all">
            <div>
              <p className="text-gray-400 text-[10px] mb-1.5 uppercase tracking-wider font-semibold">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-gray-600 text-[10px] mt-0.5 font-medium">{sub}</p>
            </div>
            <div className={`p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-all ${color.replace('text-', 'text-opacity-50 text-')}`}>
              {icon}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
