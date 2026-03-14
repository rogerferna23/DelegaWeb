import React, { useMemo, useState } from 'react';
import { useAdminGastos, useAdminVentas } from '../AdminDataContext';
import {
  ArrowDownRight, ArrowUpRight, ChevronRight, Folder, FolderOpen,
  FileSpreadsheet, Receipt, CheckCircle, Clock
} from 'lucide-react';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Returns "2026-02" key for grouping
const getMonthKey = (date) => date ? date.slice(0, 7) : null;
const getMonthLabel = (key) => {
  if (!key) return '';
  const [y, m] = key.split('-');
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
};

export default function Transacciones() {
  const { gastos } = useAdminGastos();
  const { ventas } = useAdminVentas();
  
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

  // 1. Normalize and combine transactions
  const combinedTransactions = useMemo(() => {
    const all = [];
    
    // Process Sales (Ingresos)
    ventas.forEach(v => {
      // Solo sumamos para el balance las pagadas, pero podemos mostrar todas
      // o decidir mostrar solo las aprobadas. Mostraremos todas con su estado.
      all.push({
        id: `v_${v.id}`,
        type: 'ingreso',
        date: v.fecha,
        amount: parseFloat(v.importe) || 0,
        description: `Venta: ${v.servicio} (${v.clienteNombre})`,
        status: v.estado === 'pagado' ? 'completado' : 'pendiente',
        originalItem: v
      });
    });

    // Process Expenses (Salidas)
    gastos.forEach(g => {
      all.push({
        id: `g_${g.id}`,
        type: 'gasto',
        date: g.date,
        amount: parseFloat(g.amount) || 0,
        description: g.description,
        status: 'completado', // Gastos are always considered completed for now
        originalItem: g
      });
    });

    // Sort descending (newest first)
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [ventas, gastos]);


  // 2. Group by month using the "2026-02" format
  const groupedTransactions = useMemo(() => {
    const map = {};
    combinedTransactions.forEach(t => {
      const key = getMonthKey(t.date);
      if (!key) return;
      if (!map[key]) map[key] = { 
        key, 
        entries: [], 
        totalIngresos: 0, 
        totalGastos: 0 
      };
      map[key].entries.push(t);
      
      // Calculate subtotals (only summing completed income)
      if (t.type === 'ingreso' && t.status === 'completado') {
        map[key].totalIngresos += t.amount;
      } else if (t.type === 'gasto') {
        map[key].totalGastos += t.amount;
      }
    });
    
    // Return object values sorted by month descending (newest month first)
    return Object.values(map).sort((a, b) => b.key.localeCompare(a.key));
  }, [combinedTransactions]);

  // Total summary calculation
  const totalIngresos = combinedTransactions
    .filter(t => t.type === 'ingreso' && t.status === 'completado')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalGastos = combinedTransactions
    .filter(t => t.type === 'gasto')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const beneficioNeto = totalIngresos - totalGastos;

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-white">Transacciones</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Registro cronológico unificado de ingresos y gastos
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Ingresos Totales (Completados)', value: `$${totalIngresos.toLocaleString()} USD`, icon: ArrowUpRight, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Gastos Totales', value: `$${totalGastos.toLocaleString()} USD`, icon: ArrowDownRight, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Beneficio Neto Global', value: `$${beneficioNeto.toLocaleString()} USD`, icon: FileSpreadsheet,
            color: beneficioNeto >= 0 ? 'text-primary' : 'text-red-400',
            bg: beneficioNeto >= 0 ? 'bg-primary/10' : 'bg-red-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-cardbg border border-white/5 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-[10px] mb-1.5">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Ledger section */}
      <div className="bg-cardbg border border-white/5 rounded-xl overflow-hidden mb-3">
        {/* Month accordions */}
        <div className="divide-y divide-white/5">
          {groupedTransactions.length === 0 && (
            <div className="px-5 py-8 text-center text-xs text-gray-500">
              No hay transacciones registradas aún.
            </div>
          )}
          {groupedTransactions.map(({ key, entries, totalIngresos: mesIngreso, totalGastos: mesGasto }) => {
            const isOpen = openMonths.has(key);
            const isCurrent = key === currentMonthKey;
            const balanceMes = mesIngreso - mesGasto;
            
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
                    <span className="hidden sm:inline-block text-[9px] font-medium bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full mr-2">
                      Mes actual
                    </span>
                  )}
                  
                  <div className="text-right flex items-center gap-4">
                    <div className="hidden sm:block">
                       <span className="text-[10px] text-gray-500 mr-1.5">Ingresos:</span>
                       <span className="text-xs font-semibold text-green-400">${mesIngreso.toLocaleString()}</span>
                    </div>
                    <div className="hidden sm:block">
                       <span className="text-[10px] text-gray-500 mr-1.5">Gastos:</span>
                       <span className="text-xs font-semibold text-red-400">${mesGasto.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 mr-1.5 hidden sm:inline-block">Balance:</span>
                      <span className={`text-xs font-bold ${balanceMes >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${balanceMes.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <ChevronRight className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>

                {/* Ledger table */}
                {isOpen && (
                  <div className="border-t border-white/5 bg-background/30 slide-down">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/5">
                            {['Tipo', 'Fecha', 'Descripción', 'Estado', 'Importe'].map(h => (
                              <th key={h} className="px-5 py-2 text-left text-[10px] font-medium text-gray-600 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                          {entries.map(t => (
                            <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-5 py-2.5 w-10">
                                {t.type === 'ingreso' ? (
                                  <div className="w-6 h-6 rounded-md bg-green-500/10 flex items-center justify-center text-green-400" title="Ingreso (Venta)">
                                    <ArrowDownRight className="w-3.5 h-3.5" />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-md bg-red-500/10 flex items-center justify-center text-red-400" title="Gasto (Salida)">
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  </div>
                                )}
                              </td>
                              <td className="px-5 py-2.5">
                                <span className="text-xs text-gray-400 whitespace-nowrap">{fmtDate(t.date)}</span>
                              </td>
                              <td className="px-5 py-2.5 min-w-[200px]">
                                <span className="text-xs text-white">{t.description}</span>
                              </td>
                              <td className="px-5 py-2.5">
                                {t.type === 'ingreso' && t.status === 'pendiente' ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                                    <Clock className="w-3 h-3" /> Pendiente
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                                    <CheckCircle className="w-3 h-3 text-green-500/50" /> Completado
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-2.5 text-right w-24">
                                <span className={`text-xs font-semibold ${t.type === 'ingreso' ? 'text-green-400' : 'text-red-400'}`}>
                                  {t.type === 'ingreso' ? '+' : '-'}${t.amount.toLocaleString()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
