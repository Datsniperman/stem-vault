'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useRef,
} from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'demo';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, type === 'demo' ? 7000 : 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        role="log"
        aria-live="polite"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none"
      >
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() =>
            setToasts(prev => prev.filter(t => t.id !== toast.id))
          } />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);

  const typeStyles: Record<ToastType, string> = {
    success: 'border-l-amber bg-surface text-warm-white',
    error: 'border-l-red-500 bg-surface text-warm-white',
    info: 'border-l-dim bg-surface text-warm-white',
    demo: 'border-l-amber-muted bg-surface-raised text-warm-white',
  };

  const typeLabel: Record<ToastType, string> = {
    success: 'SUCCESS',
    error: 'ERROR',
    info: 'INFO',
    demo: 'DEMO MODE',
  };

  return (
    <div
      className={`
        pointer-events-auto border border-border-warm border-l-4 p-4 shadow-2xl
        font-body text-sm ${typeStyles[toast.type]}
        animate-[fade-slide-in_0.3s_ease-out_forwards]
      `}
    >
      <div className="flex justify-between items-start gap-3">
        <div>
          <span className="font-mono text-[10px] text-amber tracking-widest block mb-1">
            {typeLabel[toast.type]}
          </span>
          <p className="leading-snug">{toast.message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-dim hover:text-warm-white transition-colors shrink-0 mt-0.5"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
