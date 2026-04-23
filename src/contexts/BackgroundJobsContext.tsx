import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

// =====================================================================
// BackgroundJobsContext
// =====================================================================

export type JobStatus = 'running' | 'success' | 'error';

export interface Job {
  key: string;
  label: string;
  status: JobStatus;
  startedAt: number;
  finishedAt?: number;
  result?: unknown;
  error?: string;
  seen?: boolean;
}

interface JobOptions {
  label?: string;
}

interface BackgroundJobsValue {
  jobs: Record<string, Job>;
  runningJobs: Job[];
  unseenFinishedJobs: Job[];
  startJob: <T>(key: string, runner: () => Promise<T>, options?: JobOptions) => Promise<T>;
  clearJob: (key: string) => void;
  markJobSeen: (key: string) => void;
}

const BackgroundJobsContext = createContext<BackgroundJobsValue | null>(null);

export function BackgroundJobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Record<string, Job>>({});
  const runningPromisesRef = useRef<Record<string, Promise<unknown>>>({});

  const startJob = useCallback(<T,>(
    key: string,
    runner: () => Promise<T>,
    options: JobOptions = {},
  ): Promise<T> => {
    const existing = runningPromisesRef.current[key];
    if (existing) {
      return existing as Promise<T>;
    }

    const startedAt = Date.now();
    setJobs(prev => ({
      ...prev,
      [key]: { key, label: options.label ?? key, status: 'running', startedAt, seen: false },
    }));

    const promise = (async (): Promise<T> => {
      try {
        const result = await runner();
        setJobs(prev => ({
          ...prev,
          [key]: {
            ...(prev[key] ?? { key, label: options.label ?? key, startedAt }),
            status: 'success',
            finishedAt: Date.now(),
            result,
            error: undefined,
          },
        }));
        return result;
      } catch (err) {
        const message = (err as { message?: string })?.message || String(err) || 'Error desconocido';
        setJobs(prev => ({
          ...prev,
          [key]: {
            ...(prev[key] ?? { key, label: options.label ?? key, startedAt }),
            status: 'error',
            finishedAt: Date.now(),
            error: message,
          },
        }));
        throw err;
      } finally {
        delete runningPromisesRef.current[key];
      }
    })();

    runningPromisesRef.current[key] = promise;
    return promise;
  }, []);

  const clearJob = useCallback((key: string) => {
    setJobs(prev => {
      if (!prev[key]) return prev;
      const { [key]: _removed, ...rest } = prev;
      return rest;
    });
    delete runningPromisesRef.current[key];
  }, []);

  const markJobSeen = useCallback((key: string) => {
    setJobs(prev => {
      if (!prev[key] || prev[key].seen) return prev;
      return { ...prev, [key]: { ...prev[key], seen: true } };
    });
  }, []);

  const runningJobs = useMemo(
    () => Object.values(jobs).filter(j => j.status === 'running'),
    [jobs],
  );
  const unseenFinishedJobs = useMemo(
    () => Object.values(jobs).filter(
      j => (j.status === 'success' || j.status === 'error') && !j.seen,
    ),
    [jobs],
  );

  const value = useMemo<BackgroundJobsValue>(() => ({
    jobs, runningJobs, unseenFinishedJobs, startJob, clearJob, markJobSeen,
  }), [jobs, runningJobs, unseenFinishedJobs, startJob, clearJob, markJobSeen]);

  return (
    <BackgroundJobsContext.Provider value={value}>
      {children}
    </BackgroundJobsContext.Provider>
  );
}

export function useBackgroundJobs(): BackgroundJobsValue {
  const ctx = useContext(BackgroundJobsContext);
  if (!ctx) throw new Error('useBackgroundJobs debe usarse dentro de <BackgroundJobsProvider>');
  return ctx;
}

interface UseJobReturn<T = unknown> {
  job: Job | undefined;
  isRunning: boolean;
  isSuccess: boolean;
  isError: boolean;
  result: T | undefined;
  error: string | undefined;
  start: (runner: () => Promise<T>, options?: JobOptions) => Promise<T>;
  clear: () => void;
  markSeen: () => void;
}

export function useJob<T = unknown>(key: string): UseJobReturn<T> {
  const { jobs, startJob, clearJob, markJobSeen } = useBackgroundJobs();
  const job = jobs[key];

  const start = useCallback(
    (runner: () => Promise<T>, options?: JobOptions) => startJob<T>(key, runner, options),
    [key, startJob],
  );
  const clear    = useCallback(() => clearJob(key),    [key, clearJob]);
  const markSeen = useCallback(() => markJobSeen(key), [key, markJobSeen]);

  return {
    job,
    isRunning: job?.status === 'running',
    isSuccess: job?.status === 'success',
    isError:   job?.status === 'error',
    result:    job?.status === 'success' ? (job.result as T) : undefined,
    error:     job?.status === 'error'   ? job.error         : undefined,
    start,
    clear,
    markSeen,
  };
}
