import React, { useState, useMemo } from 'react';
import { Package, Search, Calendar, ShoppingCart, Wrench, Megaphone, Users, Rocket, DollarSign } from 'lucide-react';
import { useAdminVentas } from '../AdminDataContext';
import { SERVICES_CATALOG } from '../../constants/services';

export default function Productos() {
  const { ventas } = useAdminVentas();
  const [search, setSearch] = useState('');

  // Default date range: start of current month to today
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  // Transform data
  const aggregatedData = useMemo(() => {
    // 1. Filter sales by date and status
    const validSales = ventas.filter(v => {
      if (v.estado !== 'pagado') return false;
      return v.fecha >= dateFrom && v.fecha <= dateTo;
    });

    // 2. Count sales and revenue per catalog item
    return SERVICES_CATALOG.map(service => {
      let count = 0;
      let revenue = 0;

      validSales.forEach(sale => {
        // A single sale might have multiple services concatenated (e.g. "Landing Pages, Plan Pro")
        if (sale.servicio && sale.servicio.toLowerCase().includes(service.name.toLowerCase())) {
          count++;
          // If the sale is a single item, use its exact revenue. 
          // If combined, we estimate using the base price
          if (sale.servicio === service.name) {
             revenue += parseFloat(sale.importe || 0);
          } else {
             revenue += service.price;
          }
        }
      });

      return {
        ...service,
        salesCount: count,
        totalRevenue: revenue
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue); // Sort by highest revenue
  }, [ventas, dateFrom, dateTo]);

  // Search filter
  const filteredProducts = aggregatedData.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-lg font-bold text-white">Rendimiento de Productos</h1>
          <p className="text-gray-500 text-xs mt-0.5">Analíticas de ventas por servicio y periodo</p>
        </div>
        
        {/* Date Filters */}
        <div className="flex flex-col md:flex-row items-end md:items-center gap-3">
          {/* Shortcuts with Active States */}
          <div className="flex items-center gap-1 p-1 bg-white/[0.03] backdrop-blur-md rounded-xl border border-white/5 shadow-inner">
            {[
              { 
                label: 'Este mes', 
                getDateRange: () => {
                  const now = new Date();
                  return {
                    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
                    to: now.toISOString().split('T')[0]
                  };
                }
              },
              { 
                label: 'Mes anterior', 
                getDateRange: () => {
                  const now = new Date();
                  return {
                    from: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0],
                    to: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
                  };
                }
              },
              { 
                label: 'Todo el año', 
                getDateRange: () => {
                  const now = new Date();
                  return {
                    from: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
                    to: now.toISOString().split('T')[0]
                  };
                }
              }
            ].map(preset => {
              const range = preset.getDateRange();
              const isActive = dateFrom === range.from && dateTo === range.to;
              
              return (
                <button
                  key={preset.label}
                  onClick={() => {
                    setDateFrom(range.from);
                    setDateTo(range.to);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    isActive 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 bg-cardbg border border-white/5 p-2 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-gray-500 ml-1" />
              <div className="flex flex-col">
                <label className="text-[9px] text-gray-500 mb-0.5 uppercase tracking-wider font-semibold">Desde</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="bg-background border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary/40 [color-scheme:dark]"
                />
              </div>
            </div>
            <span className="text-gray-600 block pt-4">-</span>
            <div className="flex flex-col">
              <label className="text-[9px] text-gray-500 mb-0.5 uppercase tracking-wider font-semibold">Hasta</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="bg-background border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary/40 [color-scheme:dark]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Summary */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o categoría..."
            className="w-full bg-cardbg border border-white/5 hover:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/40 transition-all"
          />
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-400">Total Ingresos Periodo</p>
          <p className="text-lg font-bold text-green-400">
            ${filteredProducts.reduce((sum, p) => sum + p.totalRevenue, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Grid of Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((service, index) => (
          <div
            key={index}
            className={`relative flex flex-col gap-3 rounded-2xl p-5 border transition-all duration-300
              ${service.isPremium 
                 ? 'bg-gradient-to-br from-amber-500/5 via-cardbg to-cardbg border-amber-500/30'
                 : service.highlight
                    ? 'bg-primary/5 border-primary/30'
                    : 'bg-cardbg border-white/5 hover:border-white/10'
              }`}
          >
            {/* Header: Icon & Badges */}
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                ${service.isPremium ? 'bg-amber-500/20 text-amber-500' 
                : service.highlight ? 'bg-primary/20 text-primary' 
                : 'bg-white/5 text-gray-400'}`}>
                {React.cloneElement(service.icon, { className: 'w-5 h-5' })}
              </div>
              <div className="flex flex-col gap-1 items-end">
                 <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                   service.isPremium ? 'bg-amber-500/10 text-amber-500' : 'bg-white/5 text-gray-400'
                 }`}>
                   {service.category}
                 </span>
                 {service.isMonthly && <span className="text-[9px] text-gray-500 tracking-wider">RECURRENTE</span>}
              </div>
            </div>

            {/* Title & Base Price */}
            <div>
              <h3 className={`text-sm font-bold leading-tight mb-1 ${
                service.isPremium ? 'text-amber-400' : service.highlight ? 'text-primary' : 'text-white'
              }`}>
                {service.name}
              </h3>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                Precio base: <span className="text-gray-300 font-medium">${service.price}</span>
              </p>
            </div>

            <div className={`h-px w-full my-1 ${
              service.isPremium ? 'bg-amber-500/10' : service.highlight ? 'bg-primary/10' : 'bg-white/5'
            }`} />

            {/* Analytics Bottom Section */}
            <div className="flex items-end justify-between mt-auto">
              <div>
                <p className="text-[10px] text-gray-500 mb-0.5">Ventas cerradas</p>
                <div className="flex items-center gap-1.5">
                  <span className={`text-2xl font-black ${service.salesCount > 0 ? 'text-white' : 'text-gray-600'}`}>
                    {service.salesCount}
                  </span>
                  <Package className={`w-4 h-4 ${service.salesCount > 0 ? 'text-gray-400' : 'text-gray-600'}`} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 mb-0.5">Ingresos generados</p>
                <div className="flex items-center justify-end gap-1">
                  <DollarSign className={`w-3.5 h-3.5 ${service.totalRevenue > 0 ? 'text-green-500' : 'text-gray-600'}`} />
                  <span className={`text-lg font-bold ${service.totalRevenue > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                    {service.totalRevenue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Empty state overlay mask logic if not sold recently */}
            {service.salesCount === 0 && (
               <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-semibold text-gray-500 bg-background/80 px-2 py-0.5 rounded border border-white/5 backdrop-blur-sm shadow-sm z-10">
                 Sin ventas
               </div>
            )}
          </div>
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center text-xs text-gray-500 p-10 bg-cardbg rounded-xl border border-white/5 mt-4">
          No se encontraron productos que coincidan con la búsqueda.
        </div>
      )}
    </div>
  );
}
