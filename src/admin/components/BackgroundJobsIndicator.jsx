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
      {/* Badge compacto: esquina inferior-derecha */}
      {hasActivity && (
        <div className="fixed bottom-4 right-4 z-40">
          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-cardbg border border-white/10 shadow-lg hover:border-primary/40 transition-all"
              title="Procesos en segundo plano"
            >
              {runningJobs.length > 0 ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                  <span className="text-[11px] font-medium text-white">
                    {runningJobs.length} en curso
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-[11px] font-medium text-white">
                    {unseenFinishedJobs.length} listo{unseenFinishedJobs.length === 1 ? '' : 's'}
                  </span>
                </>
              )}
            </button>
          ) : (
            <div className="w-80 bg-cardbg border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                <span className="text-[11px] font-bold text-white uppercase tracking-wide">
                  Procesos
                </span>
                <button
                  onClick={() => setExpanded(false)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
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

  return (
    <div className="px-4 py-2.5 border-b border-white/5 last:border-b-0 flex items-start gap-2.5">
      {job.status === 'running' && (
        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin mt-0.5 shrink-0" />
      )}
      {job.status === 'success' && (
        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
      )}
      {job.status === 'error' && (
        <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-white truncate">{job.label}</p>
        <p className="text-[9px] text-gray-500 mt-0.5">
          {job.status === 'running' ? `En curso · ${elapsedSec}s` : `Duración ${elapsedSec}s`}
        </p>
        {job.error && (
          <p className="text-[9px] text-red-300 mt-0.5 line-clamp-2">{job.error}</p>
        )}
      </div>
      {onClear && job.status !== 'running' && (
        <button
          onClick={onClear}
          className="text-gray-500 hover:text-white transition-colors"
          title="Quitar de la lista"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
