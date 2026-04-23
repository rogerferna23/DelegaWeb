import { DollarSign, TrendingUp, Package } from 'lucide-react';

interface Props { totalIngresos: number; totalGastos: number; gastosCount: number; beneficioNeto: number }

export default function ReporteSummaryCards({ totalIngresos, totalGastos, gastosCount, beneficioNeto }: Props) {
  const cards = [
    {
      label: 'Ingresos Totales',
      value: `$${totalIngresos.toLocaleString()}`,
      sub: 'Ventas pagadas',
      color: 'text-green-400',
      icon: <DollarSign className="w-3.5 h-3.5" />,
    },
    {
      label: 'Gastos Totales',
      value: `$${totalGastos.toLocaleString()}`,
      sub: `${gastosCount} registros`,
      color: 'text-red-400',
      icon: <TrendingUp className="w-3.5 h-3.5 rotate-180" />,
    },
    {
      label: 'Beneficio Neto',
      value: `$${beneficioNeto.toLocaleString()}`,
      sub: totalIngresos > 0 ? `Margen del ${Math.round((beneficioNeto / totalIngresos) * 100)}%` : 'Sin ventas',
      color: beneficioNeto >= 0 ? 'text-primary' : 'text-red-400',
      icon: <Package className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <>
      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1.5 mt-2 text-center">Resumen del Periodo</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {cards.map(({ label, value, sub, color, icon }) => (
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
    </>
  );
}
