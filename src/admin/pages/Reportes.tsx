import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { FileSpreadsheet, Send } from 'lucide-react';
import { useAdminVendors, useAdminGastos, useAdminVentas } from '../AdminDataContext';
import { exportToExcel } from '../../utils/exportExcel';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import CustomTooltip from './reportes/CustomTooltip';
import ExportModal from './reportes/ExportModal';
import GastosSection from './reportes/GastosSection';
import VentasSection from './reportes/VentasSection';
import ReporteSummaryCards from './reportes/ReporteSummaryCards';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'] as const;
type Month = typeof MONTHS[number];

const PRODUCTS = [
  { name: 'Landing Page Premium', category: 'Web', price: 300, sales: 48, revenue: 14400, growth: 12, status: 'Activo' },
  { name: 'E-Commerce Starter', category: 'Web', price: 500, sales: 35, revenue: 17500, growth: 8, status: 'Activo' },
  { name: 'Portafolio Profesional', category: 'Web', price: 200, sales: 29, revenue: 5800, growth: 22, status: 'Activo' },
  { name: 'Campaña Google Ads', category: 'Marketing', price: 300, sales: 24, revenue: 7200, growth: 5, status: 'Activo' },
  { name: 'Sitio Corporativo', category: 'Web', price: 750, sales: 18, revenue: 13500, growth: 15, status: 'Activo' },
  { name: 'SEO Básico', category: 'Marketing', price: 150, sales: 12, revenue: 1800, growth: -3, status: 'Pausado' },
  { name: 'Branding Completo', category: 'Diseño', price: 600, sales: 8, revenue: 4800, growth: 0, status: 'Activo' },
];

export default function Reportes() {
  const { vendors, totalRevenue } = useAdminVendors();
  const { gastos, addGasto, removeGasto, totalsByMonth, totalGastos } = useAdminGastos();
  const { ventas, addVenta, removeVenta, approveVenta, totalVentas } = useAdminVentas();
  const { currentUser, requestAdminAction } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const toast = useToast();

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMode, setExportMode] = useState<'year' | 'month'>('year');
  const [exportMonth, setExportMonth] = useState<string>(MONTHS[0]);

  const showRequestToast = (msg: string) => {
    toast.success(msg);
  };

  // Ingresos por mes (ventas pagadas)
  const ingresosPerMonth = useMemo<Record<string, number>>(() => {
    const acc: Record<string, number> = {};
    MONTHS.forEach(m => { acc[m] = 0; });
    ventas.forEach(v => {
      if (v.estado === 'pagado') {
        const d = new Date(v.fecha);
        const idx = d.getMonth();
        if (!isNaN(idx) && idx >= 0 && idx < 12) {
          // Si importe es null/corrupto, parseFloat devuelve NaN — lo descartamos
          // para no contaminar la suma con NaN propagado en el resto de cálculos.
          const amount = parseFloat(String(v.importe ?? '0'));
          if (!isNaN(amount)) acc[MONTHS[idx]] += amount;
        }
      }
    });
    return acc;
  }, [ventas]);

  const categoryData = useMemo(() => {
    const getCategoria = (s: string | null | undefined): string => {
      if (!s) return 'Otros';
      const str = s.toLowerCase();
      if (str.includes('web') || str.includes('landing') || str.includes('ecommerce') || str.includes('sitio')) return 'Web';
      if (str.includes('seo') || str.includes('campaña') || str.includes('ads') || str.includes('marketing')) return 'Marketing';
      if (str.includes('diseño') || str.includes('branding') || str.includes('marca')) return 'Diseño';
      if (str.includes('coaching') || str.includes('starter') || str.includes('pro') || str.includes('elite')) return 'Planes/Consultoría';
      return 'Otros';
    };
    const map: Record<string, number> = { Web: 0, Marketing: 0, Diseño: 0, 'Planes/Consultoría': 0, Otros: 0 };
    ventas.forEach(v => {
      if (v.estado === 'pagado') map[getCategoria(v.servicio)] += parseFloat(String(v.importe) || '0');
    });
    return Object.entries(map).map(([categoria, ingresos]) => ({ categoria, ingresos })).filter(i => i.ingresos > 0);
  }, [ventas]);

  const totalIngresos = Object.values(ingresosPerMonth).reduce((a: number, b: number) => a + b, 0);
  const beneficioNeto = totalIngresos - totalGastos;
  const chartData = MONTHS.map(m => ({ mes: m, ingresos: ingresosPerMonth[m] || 0, gastos: (totalsByMonth as Record<string, number>)[m] || 0 }));
  const monthsFilled = MONTHS.filter(m => ingresosPerMonth[m] > 0 || (totalsByMonth as Record<string, number>)[m] > 0).length || 1;
  const yearComplete = monthsFilled === 12;

  const handleExport = async () => {
    if (isSuperAdmin) {
      exportToExcel({ mode: exportMode, selectedMonth: exportMonth as Month, gastosList: gastos, totalsByMonth, ingresosPerMonth, vendors, products: PRODUCTS });
      setShowExportModal(false);
    } else {
      const result = await requestAdminAction({
        action: 'download_report',
        metadata: { export_mode: exportMode, export_month: exportMonth },
      });
      setShowExportModal(false);
      if (result.success) showRequestToast('Solicitud de descarga enviada al superadmin 🔔');
    }
  };

  // Suppress unused warning — totalRevenue is used by exportToExcel indirectly via vendors
  void totalRevenue;

  return (
    <div className="relative">
      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          exportMode={exportMode} setExportMode={(v) => setExportMode(v as 'year' | 'month')}
          exportMonth={exportMonth} setExportMonth={setExportMonth}
          monthsFilled={monthsFilled} yearComplete={yearComplete}
          totalsByMonth={totalsByMonth as Record<string, number>} handleExport={handleExport}
          isSuperAdmin={isSuperAdmin} MONTHS={[...MONTHS]}
        />
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
            className={`flex items-center gap-1.5 text-white font-semibold px-3 py-2 rounded-lg text-xs transition-all ${isSuperAdmin ? 'bg-green-600 hover:bg-green-700' : 'bg-primary/80 hover:bg-primary'}`}>
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
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v}`} domain={[0, 'auto']} />
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
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v}`} domain={[0, 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="ingresos" name="Ingresos" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <GastosSection
        gastos={gastos} addGasto={addGasto} removeGasto={removeGasto} totalGastos={totalGastos}
        isSuperAdmin={isSuperAdmin} requestAdminAction={requestAdminAction} showRequestToast={showRequestToast}
      />

      <VentasSection
        ventas={ventas} addVenta={addVenta as unknown as (v: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>}
        removeVenta={removeVenta} approveVenta={approveVenta}
        totalVentas={totalVentas} showRequestToast={showRequestToast}
      />

      <ReporteSummaryCards
        totalIngresos={totalIngresos} totalGastos={totalGastos}
        gastosCount={gastos.length} beneficioNeto={beneficioNeto}
      />
    </div>
  );
}
