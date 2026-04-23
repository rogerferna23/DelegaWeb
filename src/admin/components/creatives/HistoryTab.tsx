import { RefreshCw, Copy, Download } from 'lucide-react';
import { DEMO_HISTORY } from '../../data/modelsData';

export default function HistoryTab() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-cardbg border border-white/5 rounded-2xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[48px_1fr_1fr_80px_100px_1fr_100px] gap-4 px-5 py-3 border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          <div></div>
          <div>Nombre</div>
          <div>Modelo</div>
          <div className="text-center">Créditos</div>
          <div className="text-center">Estado</div>
          <div>Fecha</div>
          <div className="text-center">Acciones</div>
        </div>

        {/* Table Rows */}
        {DEMO_HISTORY.map((item, idx) => (
          <div
            key={item.id}
            className={`grid grid-cols-[48px_1fr_1fr_80px_100px_1fr_100px] gap-4 px-5 py-3.5 items-center transition-colors hover:bg-white/[0.02] ${
              idx < DEMO_HISTORY.length - 1 ? 'border-b border-white/[0.03]' : ''
            }`}
          >
            {/* Thumbnail */}
            <div>
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.thumbGradient} flex-shrink-0`} />
            </div>

            {/* Name */}
            <div className="text-sm font-medium text-white truncate">
              {item.name}
            </div>

            {/* Model */}
            <div className="text-sm text-gray-400">
              {item.model}
            </div>

            {/* Credits */}
            <div className="text-center text-sm font-bold text-white">
              {item.credits}
            </div>

            {/* Status */}
            <div className="text-center">
              <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                {item.status}
              </span>
            </div>

            {/* Date */}
            <div className="text-xs text-gray-500">
              {item.date}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-2">
              <button
                className="p-1.5 text-gray-600 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                title="Regenerar"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                className="p-1.5 text-gray-600 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                title="Copiar"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                className="p-1.5 text-gray-600 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                title="Descargar"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
