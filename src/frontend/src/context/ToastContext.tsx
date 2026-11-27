import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

export type ToastTipo = 'success' | 'error' | 'info'

interface ToastItem {
    id: string
    tipo: ToastTipo
    mensaje: string
}

interface ToastContextValue {
    mostrarToast: (mensaje: string, tipo?: ToastTipo) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([])

    const cerrarToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    const mostrarToast = useCallback(
        (mensaje: string, tipo: ToastTipo = 'info') => {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
            setToasts((prev) => [...prev, { id, tipo, mensaje }])
            setTimeout(() => {
                cerrarToast(id)
            }, 4500)
        },
        [cerrarToast]
    )

    return (
        <ToastContext.Provider value={{ mostrarToast }}>
            {children}
            <div
                aria-live="polite"
                className="pointer-events-none fixed top-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
            >
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        role="status"
                        className={`pointer-events-auto flex items-start gap-2.5 rounded-2xl p-3.5 text-xs font-semibold shadow-lg ring-1 transition-all ${
                            t.tipo === 'success'
                                ? 'bg-emerald-50 text-emerald-900 ring-emerald-300'
                                : t.tipo === 'error'
                                  ? 'bg-red-50 text-red-900 ring-red-300'
                                  : 'bg-white text-marino ring-beige'
                        }`}
                    >
                        {t.tipo === 'success' ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700 mt-0.5" />
                        ) : t.tipo === 'error' ? (
                            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                        ) : (
                            <Info className="h-4 w-4 shrink-0 text-cafe mt-0.5" />
                        )}
                        <span className="flex-1 leading-relaxed">{t.mensaje}</span>
                        <button
                            type="button"
                            onClick={() => cerrarToast(t.id)}
                            aria-label="Cerrar notificación"
                            className="rounded-lg p-0.5 opacity-70 hover:opacity-100 cursor-pointer"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext)
    if (!ctx) {
        return {
            mostrarToast: () => {},
        }
    }
    return ctx
}
