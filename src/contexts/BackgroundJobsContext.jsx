// =====================================================================
// BackgroundJobsContext
// =====================================================================
// Contexto global para procesos asíncronos largos (generación de IA,
// exportaciones, etc.). El problema que resuelve: cuando un componente
// desmonta (al cambiar de ruta), su useState se pierde y con él el
// resultado de cualquier `await` en vuelo.
//
// Uso típico en componentes:
//
//   const { job, start } = useJob('nuevacampana:guide');
//   const isRunning = job?.status === 'running';
//   const result = job?.status === 'success' ? job.result : null;
//
//   const handleClick = () => {
//     start(async () => {
//       const { data, error } = await supabase.functions.invoke('ai-chat', { body });
//       if (error) throw error;
//       return data.result;
//     });
//   };
//
// Si el usuario navega a otra sección, el job sigue corriendo en el
// provider (que vive a nivel root). Al volver, `job.result` ya está listo.
// =====================================================================

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const BackgroundJobsContext = createContext(null);

/**
 * Estructura de un job:
 * {
 *   key: string,            // identificador único ('nuevacampana:guide')
 *   label: string,          // etiqueta visible en el indicador global
 *   status: 'running' | 'success' | 'error',
 *   startedAt: number,      // Date.now() al iniciar
 *   finishedAt?: number,    // Date.now() al terminar
 *   result?: any,           // payload devuelto por el runner
 *   error?: string,         // mensaje de error si falló
 *   seen?: boolean,         // true si el usuario ya "vio" el resultado
 * }
 */

export function BackgroundJobsProvider({ children }) {
  const [jobs, setJobs] = useState({});
  // Promesas en vuelo — si el mismo key se pide dos veces, devolvemos la misma.
  const runningPromisesRef = useRef({});

  /**
   * Inicia un job identificado por `key`. Si ya hay uno corriendo con el
   * mismo key, devuelve el promise existente (evita duplicados).
   *
   * @param {string} key - identificador único (ej. 'nuevacampana:guide')
   * @param {() => Promise<any>} runner - función async que hace el trabajo
   * @param {{ label?: string }} [options]
   * @returns {Promise<any>}
   */
  const startJob = useCallback((key, runner, options = {}) => {
    if (runningPromisesRef.current[key]) {
      return runningPromisesRef.current[key];
    }

    const startedAt = Date.now();
    setJobs(prev => ({
      ...prev,
      [key]: {
        key,
        label: options.label || key,
        status: 'running',
        startedAt,
        seen: false,
      },
    }));

    const promise = (async () => {
      try {
        const result = await runner();
        setJobs(prev => ({
          ...prev,
          [key]: {
            ...(prev[key] || { key, label: options.label || key, startedAt }),
            status: 'success',
            finishedAt: Date.now(),
            result,
            error: undefined,
          },
        }));
        return result;
      } catch (err) {
        const message = err?.message || String(err) || 'Error desconocido';
        setJobs(prev => ({
          ...prev,
          [key]: {
            ...(prev[key] || { key, label: options.label || key, startedAt }),
            status: 'error',
            finishedAt: Date.now(),
            error: message,
          },
        }));
        // Re-lanzamos para que el caller pueda hacer .catch si quiere.
        throw err;
      } finally {
        delete runningPromisesRef.current[key];
      }
    })();

    runningPromisesRef.current[key] = promise;
    return promise;
  }, []);

  /** Borra un job del registro (útil para reiniciar UI). */
  const clearJob = useCallback((key) => {
    setJobs(prev => {
      if (!prev[key]) return prev;
      const { [key]: _removed, ...rest } = prev;
      return rest;
    });
    delete runningPromisesRef.current[key];
  }, []);

  /** Marca un job como ya-visto (para que el indicador global no siga anunciándolo). */
  const markJobSeen = useCallback((key) => {
    setJobs(prev => {
      if (!prev[key] || prev[key].seen) return prev;
      return { ...prev, [key]: { ...prev[key], seen: true } };
    });
  }, []);

  // Derivadas útiles.
  const runningJobs = useMemo(
    () => Object.values(jobs).filter(j => j.status === 'running'),
    [jobs]
  );
  const unseenFinishedJobs = useMemo(
    () => Object.values(jobs).filter(
      j => (j.status === 'success' || j.status === 'error') && !j.seen
    ),
    [jobs]
  );

  const value = useMemo(() => ({
    jobs,
    runningJobs,
    unseenFinishedJobs,
    startJob,
    clearJob,
    markJobSeen,
  }), [jobs, runningJobs, unseenFinishedJobs, startJob, clearJob, markJobSeen]);

  return (
    <BackgroundJobsContext.Provider value={value}>
      {children}
    </BackgroundJobsContext.Provider>
  );
}

/**
 * Hook base. Devuelve todas las herramientas del contexto.
 * Normalmente preferirás useJob(key) para un job específico.
 */
export function useBackgroundJobs() {
  const ctx = useContext(BackgroundJobsContext);
  if (!ctx) {
    throw new Error('useBackgroundJobs debe usarse dentro de <BackgroundJobsProvider>');
  }
  return ctx;
}

/**
 * Hook pensado para componentes. Encapsula la lógica de un job concreto.
 *
 * @param {string} key - identificador único del job
 * @returns {{
 *   job: object | undefined,
 *   isRunning: boolean,
 *   isSuccess: boolean,
 *   isError: boolean,
 *   result: any,
 *   error: string | undefined,
 *   start: (runner: () => Promise<any>, options?: { label?: string }) => Promise<any>,
 *   clear: () => void,
 * }}
 */
export function useJob(key) {
  const { jobs, startJob, clearJob, markJobSeen } = useBackgroundJobs();
  const job = jobs[key];

  const start = useCallback(
    (runner, options) => startJob(key, runner, options),
    [key, startJob]
  );

  const clear = useCallback(() => clearJob(key), [key, clearJob]);
  const markSeen = useCallback(() => markJobSeen(key), [key, markJobSeen]);

  return {
    job,
    isRunning: job?.status === 'running',
    isSuccess: job?.status === 'success',
    isError: job?.status === 'error',
    result: job?.status === 'success' ? job.result : undefined,
    error: job?.status === 'error' ? job.error : undefined,
    start,
    clear,
    markSeen,
  };
}
