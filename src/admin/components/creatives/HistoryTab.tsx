import { Download, RefreshCw, Video, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { useCreatives } from '../../hooks/useCreatives';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatusBadge({ type, status }: { type: string; status?: string }) {
  const s = type === 'image' ? 'completed' : (status ?? 'processing');
  const styles: Record<string, string> = {
    completed:  'bg-green-500/10 text-green-400 border-green-500/20',
    processing: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    failed:     'bg-red-500/10 text-red-400 border-red-500/20',
  };
  const labels: Record<string, string> = {
    completed:  'Completado',
    processing: 'Procesando',
    failed:     'Fallido',
  };
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold border ${styles[s] ?? styles.processing}`}>
      {labels[s] ?? 'Procesando'}
    </span>
  );
}

export default function HistoryTab() {
  const { creatives, loading, error, refetch } = useCreatives();

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center gap-3 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs">Cargando historial...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 flex flex-col items-center gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-xs text-red-400">{error}</p>
        <button onClick={() => refetch()} className="text-primary text-xs font-bold hover:underline">
          Reintentar
        </button>
      </div>
    );
  }

  if (creatives.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-600 text-xs">Aún no has generado ningún creativo.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="bg-cardbg border border-white/5 rounded-2xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[48px_1fr_140px_100px_1fr_80px] gap-4 px-5 py-3 border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          <div />
          <div>Nombre</div>
          <div>Modelo</div>
          <div className="text-center">Estado</div>
          <div>Fecha</div>
          <div className="text-center">Acciones</div>
        </div>

        {/* Table Rows */}
        {creatives.map((item, idx) => (
          <div
            key={item.id}
            className={`grid grid-cols-[48px_1fr_140px_100px_1fr_80px] gap-4 px-5 py-3.5 items-center transition-colors hover:bg-white/[0.02] ${
              idx < creatives.length - 1 ? 'border-b border-white/[0.03]' : ''
            }`}
          >
            {/* Thumbnail */}
            <div className="w-9 h-9 rounded-lg bg-white/5 overflow-hidden flex items-center justify-center flex-shrink-0">
              {item.url && item.type === 'image' ? (
                <img src={item.url} alt="" className="w-full h-full object-cover" />
              ) : item.type === 'video' ? (
                <Video className="w-4 h-4 text-gray-600" />
              ) : (
                <ImageIcon className="w-4 h-4 text-gray-600" />
              )}
            </div>

            {/* Name */}
            <div className="text-sm font-medium text-white truncate" title={item.name}>
              {item.name}
            </div>

            {/* Model */}
            <div className="text-sm text-gray-400">
              {item.type === 'image' ? 'DALL-E 3' : 'Runway ML'}
              {item.dimensions && (
                <span className="ml-1.5 text-[10px] text-gray-600">{item.dimensions}</span>
              )}
              {item.duration && (
                <span className="ml-1.5 text-[10px] text-gray-600">{item.duration}s</span>
              )}
            </div>

            {/* Status */}
            <div className="text-center">
              <StatusBadge type={item.type} status={item.status} />
            </div>

            {/* Date */}
            <div className="text-xs text-gray-500">
              {formatDate(item.created_at)}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => refetch()}
                className="p-1.5 text-gray-600 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                title="Actualizar"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-gray-600 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                  title="Descargar"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  disabled
                  className="p-1.5 text-gray-700 cursor-not-allowed rounded-lg"
                  title="No disponible aún"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
