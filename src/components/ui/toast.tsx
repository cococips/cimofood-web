"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Flame,
  Info,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info" | "spicy";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = React.useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = toast.duration ?? 4200;

      setToasts((prev) => [...prev, { ...toast, id, duration }]);

      if (duration > 0) {
        window.setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}

      {/* Floating Toast Viewport */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-[60] flex flex-col gap-2.5 pointer-events-none"
      >
        {toasts.map((item) => {
          const styles: Record<
            ToastType,
            { container: string; icon: React.ReactNode }
          > = {
            success: {
              container:
                "bg-white border-emerald-500/40 shadow-lg shadow-emerald-950/10",
              icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
            },
            error: {
              container:
                "bg-white border-red-500/40 shadow-lg shadow-red-950/10",
              icon: <XCircle className="h-5 w-5 text-[#DC2626] shrink-0" />,
            },
            warning: {
              container:
                "bg-[#FFFBEB] border-amber-500/50 shadow-lg shadow-amber-950/10",
              icon: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
            },
            info: {
              container:
                "bg-white border-sky-500/40 shadow-lg shadow-sky-950/10",
              icon: <Info className="h-5 w-5 text-sky-600 shrink-0" />,
            },
            spicy: {
              container:
                "bg-gradient-to-r from-[#EA580C] to-[#C2410C] text-white border-orange-400/40 shadow-xl shadow-orange-950/20",
              icon: <Flame className="h-5 w-5 text-amber-300 fill-amber-300 shrink-0" />,
            },
          };

          const current = styles[item.type];

          return (
            <div
              key={item.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 transition-all duration-200",
                current.container
              )}
            >
              <div className="mt-0.5">{current.icon}</div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-bold",
                    item.type === "spicy" ? "text-white" : "text-stone-900"
                  )}
                >
                  {item.title}
                </p>
                {item.description && (
                  <p
                    className={cn(
                      "mt-0.5 text-xs leading-relaxed",
                      item.type === "spicy" ? "text-orange-100" : "text-stone-600"
                    )}
                  >
                    {item.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(item.id)}
                aria-label="Tutup notifikasi"
                className={cn(
                  "rounded-lg p-1 transition-colors cursor-pointer",
                  item.type === "spicy"
                    ? "text-orange-100 hover:bg-white/15"
                    : "text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast wajib digunakan di dalam ToastProvider");
  }
  return ctx;
}

