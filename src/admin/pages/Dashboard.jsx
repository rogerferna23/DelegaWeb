import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { DollarSign, TrendingUp, Package, Users } from 'lucide-react';
import { useAdminVentas, useAdminVendors } from '../AdminDataContext';
import { SERVICES_CATALOG } from '../../constants/services';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-cardbg border border-white/10 rounded-lg px-3 py-2 text-xs">
        <p className="text-gray-400 mb-1">{label}</p>
        <p className="text-primary font-semibold">${payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { ventas } = useAdminVentas();
  const { vendors } = useAdminVendors();

  const { salesData, topProducts, statCards } = useMemo(() => {
    // 1. Calculate sales per month
    const currentMonthIndex = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyRevenue = Array(12).fill(0);
    const lastMonthRevenue = Array(12).fill(0); // Optional: filter by year if needed

    let totalRevenue = 0;
    
    ventas.forEach(v => {
      if (v.estado === 'pagado') {
        const d = new Date(v.fecha);
        const month = d.getMonth();
        const year = d.getFullYear();
        
        if (year === currentYear) monthlyRevenue[month] += parseFloat(v.importe || 0);
        if (year === currentYear - 1) lastMonthRevenue[month] += parseFloat(v.importe || 0);
        
        totalRevenue += parseFloat(v.importe || 0);
      }
    });

    // Chart data for current year up to current month (or all year)
    const salesData = MONTHS.slice(0, currentMonthIndex + 1).map((mes, index) => ({
      mes,
      ventas: monthlyRevenue[index]
    }));

    // 2. Stats
    const currentMonthRev = monthlyRevenue[currentMonthIndex];
    const prevMonthRev = currentMonthIndex > 0 ? monthlyRevenue[currentMonthIndex - 1] : lastMonthRevenue[11];
    
    let changePct = 0;
    if (prevMonthRev > 0) {
      changePct = Math.round(((currentMonthRev - prevMonthRev) / prevMonthRev) * 100);
    } else if (currentMonthRev > 0) {
      changePct = 100;
    }

    const _statCards = [
      { 
        label: 'Ventas Totales', 
        value: '$' + totalRevenue.toLocaleString(), 
        change: 'Histórico global', 
        icon: DollarSign, 
        positive: null 
      },
      { 
        label: 'Ingresos Mensuales', 
        value: '$' + currentMonthRev.toLocaleString(), 
        change: `${changePct >= 0 ? '+' : ''}${changePct}% vs mes anterior`, 
        icon: TrendingUp, 
        positive: changePct > 0 ? true : changePct < 0 ? false : null 
      },
      { 
        label: 'Productos Activos', 
        value: SERVICES_CATALOG.length.toString(), 
        change: 'En catálogo', 
        icon: Package, 
        positive: null 
      },
      { 
        label: 'Vendedores', 
        value: vendors.length.toString(), 
        change: 'Registrados', 
        icon: Users, 
        positive: null 
      },
    ];

    // 3. Top Products
    const prodStats = SERVICES_CATALOG.map(s => ({ ...s, salesCount: 0, revenue: 0 }));
    
    ventas.forEach(v => {
      if (v.estado === 'pagado' && v.servicio) {
        prodStats.forEach(p => {
          if (v.servicio.toLowerCase().includes(p.name.toLowerCase())) {
            p.salesCount += 1;
            if (v.servicio === p.name) {
              p.revenue += parseFloat(v.importe || 0);
            } else {
              p.revenue += p.price; // Approximate mapping if composite service string
            }
          }
        });
      }
    });

    const _topProducts = prodStats
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p, idx) => ({
        rank: idx + 1,
        name: p.name,
        sales: p.salesCount,
        revenue: '$' + p.revenue.toLocaleString(),
        growth: '+0%' // Could be dynamic if we tracked correctly
      }));

    return { salesData, topProducts: _topProducts, statCards: _statCards };
  }, [ventas, vendors]);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-bold text-white">Panel de Administración</h1>
        <p className="text-gray-500 text-xs mt-0.5">Bienvenido de vuelta</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {statCards.map(({ label, value, change, icon: Icon, positive }) => (
          <div
            key={label}
            className="bg-cardbg border border-white/5 rounded-xl p-4 flex flex-col gap-3 hover:border-white/10 transition-colors"
          >
            <div className="flex items-start justify-between">
              <p className="text-gray-400 text-xs">{label}</p>
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className={`text-[10px] mt-0.5 ${positive === true ? 'text-green-400' : positive === false ? 'text-red-400' : 'text-gray-500'}`}>
                {change}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {/* Area chart */}
        <div className="xl:col-span-2 bg-cardbg border border-white/5 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-primary mb-4">Ventas Totales (Este Año)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={salesData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="ventas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="mes" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 10 }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={v => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`}
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f97316', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="ventas" stroke="#f97316" strokeWidth={2} fill="url(#ventas)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top products */}
        <div className="bg-cardbg border border-white/5 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-white mb-0.5 flex items-center gap-1.5">
            🏆 <span>Productos Más Vendidos</span>
          </h2>
          <p className="text-gray-500 text-[10px] mb-4">Top 5 Histórico</p>
          <div className="space-y-2.5">
            {topProducts.map(({ rank, name, sales, revenue, growth }) => (
              <div key={rank} className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  rank === 1 ? 'bg-primary text-white' :
                  rank === 2 ? 'bg-gray-600 text-white' :
                  rank === 3 ? 'bg-[#cd7f32] text-white' :
                  'bg-background text-gray-400 border border-white/10'
                }`}>
                  {rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-medium truncate">{name}</p>
                  <p className="text-[10px] text-gray-500">{sales} ventas</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-white">{revenue}</p>
                  <p className="text-[10px] text-green-400">{growth}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

