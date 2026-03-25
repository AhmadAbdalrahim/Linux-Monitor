"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleToast = (e: any) => {
      const { message, type } = e.detail;
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    };

    window.addEventListener("show-toast", handleToast);
    return () => window.removeEventListener("show-toast", handleToast);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto flex items-center gap-3 rounded-xl border p-4 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-right-8
            ${toast.type === "success" ? "border-[#3fb950]/30 bg-[#3fb950]/10 text-[#3fb950]" : ""}
            ${toast.type === "error" ? "border-[#f85149]/30 bg-[#f85149]/10 text-[#f85149]" : ""}
            ${toast.type === "info" ? "border-[#58a6ff]/30 bg-[#58a6ff]/10 text-[#58a6ff]" : ""}
            backdrop-blur-md min-w-[300px]
          `}
        >
          {toast.type === "success" && <CheckCircle className="h-5 w-5 shrink-0" />}
          {toast.type === "error" && <XCircle className="h-5 w-5 shrink-0" />}
          {toast.type === "info" && <Info className="h-5 w-5 shrink-0" />}
          
          <p className="flex-1 text-sm font-medium text-[var(--text)]">{toast.message}</p>
          
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="rounded-lg p-1 hover:bg-black/5 transition-colors"
          >
            <X className="h-4 w-4 text-[var(--text-muted)]" />
          </button>
        </div>
      ))}
    </div>
  );
}
