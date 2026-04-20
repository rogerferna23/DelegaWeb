// =====================================================================
// BackgroundJobsIndicator
// =====================================================================
// Badge flotante en la esquina inferior-derecha que muestra los jobs
// (de BackgroundJobsContext) que están corriendo o que terminaron y el
// usuario todavía no ha "visto". Da al usuario certeza de que un proceso
// que lanzó en otra sección sigue vivo aunque haya navegado.
//
// Comportamiento:
//   · Si hay >=1 job corriendo → muestra spinner + conteo.
//   · Si un job termina (success o error) → aparece un toast durante 6s.
//   · Click en el badge → expande lista con todos los jobs activos.
// =====================================================================

import { useEffect, useRef, useState } from 'react';
import { useBackgroundJobs } from '../../contexts/BackgroundJobsContext';
import { Loader2, CheckCircle2, XCircle, X } from 'lucide-react';

export default function BackgroundJobsIndicator() {
  const { runningJobs, unseenFinishedJobs, markJobSeen, clearJob } = useBackgroundJobs();
  const [expanded, setExpanded] = useState(false);
  const [toasts, setToasts] = useState([]);
  const alreadyToastedRef = useRef(new Set());

  // Cuando aparece un job recién terminado y aún no ha sido "toasteado",
  // disparamos el toast y lo marcamos.
  useEffect(() => {
    unseenFinishedJobs.forEach((job) => {
      if (alreadyToastedRef.current.has(job.key)) return;
      alreadyToastedRef.current.add(job.key);

      setToasts((prev) => [
        ...prev,
        {
          id: `${job.key}-${job.finishedAt}`,
          key: job.key,
          label: job.label,
          status: job.status,
          error: job.error,
        },
      ]);

      // Auto-dismiss después de 6s
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== `${job.key}-${job.finishedAt}`));
        markJobSeen(job.key);
      }, 6000);
    });
  }, [unseenFinishedJobs, markJobSeen]);

  const dismissToast = (id, key) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    markJobSeen(key);
  };

  const hasActivity = runningJobs.length > 0 || unseenFinishedJobs.length > 0;

  return (
    <>
      {/* Badge compacto: encima del botón flotante del Asistente IA
          (bottom-6 right-6, ~52px). Lo ponemos en bottom-24 right-6 para
          que queden alineados verticalmente sin solaparse. */}
      {hasActivity && (
        <div className="fixed bottom-24 right-6 z-[55]">
          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              className="group flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-full bg-cardbg/90 backdrop-blur-md border border-white/10 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.5)] hover:border-primary/50 hover:bg-cardbg transition-all duration-200"
              title="Procesos en segundo plano"
            >
              {runningJobs.length > 0 ? (
                <>
                  <span className="relative flex items-center justify-center w-5 h-5">
                    <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                    <Loader2 className="w-3.5 h-3.5 text-primary animate-spin relative" />
                  </span>
                  <span className="text-[11px] font-medium text-white whitespace-nowrap">
                    {runningJobs.length} en curso
                  </span>
                </>
              ) : (
                <>
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-500/15">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  </span>
                  <span className="text-[11px] font-medium text-white whitespace-nowrap">
                    {unseenFinishedJobs.length} listo{unseenFinishedJobs.length === 1 ? '' : 's'}
                  </span>
                </>
              )}
            </button>
          ) : (
            <div className="w-80 bg-cardbg/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-background/40">
                <div className="flex items-center gap-2">
                  {runningJobs.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                    Procesos en segundo plano
                  </span>
                </div>
                <button
                  onClick={() => setExpanded(false)}
                  className="text-gray-500 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto scrollbar-hide">
                {runningJobs.map((job) => (
                  <JobRow key={job.key} job={job} />
                ))}
                {unseenFinishedJobs.map((job) => (
                  <JobRow
                    key={job.key}
                    job={job}
                    onDismiss={() => {
                      markJobSeen(job.key);
                    }}
                    onClear={() => clearJob(job.key)}
                  />
                ))}
                {!hasActivity && (
                  <div className="px-4 py-6 text-center text-[11px] text-gray-500">
                    No hay procesos activos
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toasts: notificaciones transitorias cuando un job termina */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border shadow-lg animate-fade-in min-w-[260px] max-w-sm ${
              t.status === 'success'
                ? 'bg-teal-500/10 border-teal-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            {t.status === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-white leading-tight">
                {t.status === 'success' ? 'Proceso completado' : 'Proceso con error'}
              </p>
              <p className="text-[10px] text-gray-300 mt-0.5 truncate">{t.label}</p>
              {t.error && (
                <p className="text-[10px] text-red-300 mt-0.5 line-clamp-2">{t.error}</p>
              )}
            </div>
            <button
              onClick={() => dismissToast(t.id, t.key)}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function JobRow({ job, onClear }) {
  const elapsedSec = job.finishedAt
    ? Math.round((job.finishedAt - job.startedAt) / 1000)
    : Math.round((Date.now() - job.startedAt) / 1000);

  const iconWrap =
    job.status === 'running'
      ? 'bg-primary/15'
      : job.status === 'success'
      ? 'bg-teal-500/15'
      : 'bg-red-500/15';

  return (
    <div className="px-4 py-3 border-b border-white/5 last:border-b-0 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">
      <span className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${iconWrap}`}>
        {job.status === 'running' && (
          <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
        )}
        {job.status === 'success' && (
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
        )}
        {job.status === 'error' && (
          <XCircle className="w-3.5 h-3.5 text-red-400" />
        )}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-white truncate leading-tight">{job.label}</p>
        <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-wider">
          {job.status === 'running' ? `En curso · ${elapsedSec}s` : `Duración ${elapsedSec}s`}
        </p>
        {job.error && (
          <p className="text-[10px] text-red-300 mt-1 line-clamp-2 leading-snug">{job.error}</p>
        )}
      </div>
      {onClear && job.status !== 'running' && (
        <button
          onClick={onClear}
          className="text-gray-500 hover:text-white transition-colors p-1 -m-1 hover:bg-white/5 rounded"
          title="Quitar de la lista"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
