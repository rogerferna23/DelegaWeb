import { Download, FileSpreadsheet, ChevronDown, Send } from 'lucide-react';

interface ExportModalProps {
  onClose: () => void;
  exportMode: string;
  setExportMode: (v: string) => void;
  exportMonth: string;
  setExportMonth: (v: string) => void;
  monthsFilled: number;
  yearComplete: boolean;
  totalsByMonth: Record<string, number>;
  handleExport: () => void;
  isSuperAdmin: boolean;
  MONTHS: string[];
}

export default function ExportModal({
  onClose, exportMode, setExportMode, exportMonth, setExportMonth,
  monthsFilled, yearComplete, totalsByMonth, handleExport, isSuperAdmin, MONTHS
}: ExportModalProps) {
  return (
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
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors" aria-label="Cerrar">
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
            {([['year', '📅 Año completo', `${monthsFilled} meses`], ['month', '🗓️ Un mes', 'Mes específico']] as const).map(([val, label, sub]) => (
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
  );
}
