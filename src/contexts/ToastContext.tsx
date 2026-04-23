import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

// =============================================================================
// ToastContext — sistema de notificaciones global.
// =============================================================================

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastOptions {
  duration?: number;
}

interface ToastApi {
  success: (msg: string, opts?: ToastOptions) => number;
  error:   (msg: string, opts?: ToastOptions) => number;
  warning: (msg: string, opts?: ToastOptions) => number;
  info:    (msg: string, opts?: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

const STYLES: Record<ToastType, string> = {
  success: 'bg-green-500/10 border-green-500/20 text-green-400',
  error:   'bg-red-500/10 border-red-500/20 text-red-400',
  warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  info:    'bg-blue-500/10 border-blue-500/20 text-blue-400',
};

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((type: ToastType, message: string, options: ToastOptions = {}): number => {
    const id = nextId++;
    const duration = options.duration ?? (type === 'error' ? 5500 : 3500);
    setToasts((prev) => [...prev, { id, type, message, duration }]);

    if (duration > 0) {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        timersRef.current.delete(id);
      }, duration);
      timersRef.current.set(id, timer);
    }
    return id;
  }, []);

  const api = useMemo<ToastApi>(() => ({
    success: (msg, opts) => show('success', msg, opts),
    error:   (msg, opts) => show('error',   msg, opts),
    warning: (msg, opts) => show('warning', msg, opts),
    info:    (msg, opts) => show('info',    msg, opts),
    dismiss,
  }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="region"
        aria-label="Notificaciones"
        className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none max-w-sm"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          const isAlert = t.type === 'error';
          return (
            <div
              key={t.id}
              role={isAlert ? 'alert' : 'status'}
              aria-live={isAlert ? 'assertive' : 'polite'}
              className={`pointer-events-auto flex items-start gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium shadow-lg border backdrop-blur-sm animate-in slide-in-from-right-4 duration-300 ${STYLES[t.type]}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="flex-1 leading-relaxed">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Cerrar notificación"
                className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>. Añádelo en main.tsx.');
  }
  return ctx;
}
