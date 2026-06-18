/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Lightweight toast notifications, replacing native alert(). Use via useToast():
 *
 *   const toast = useToast();
 *   toast('Хадгаллаа', 'success');
 */

'use client';

import React, { createContext, useContext, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

type ToastFn = (message: string, type?: ToastType) => void;

const ToastContext = createContext<ToastFn | null>(null);

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const ICONS = {
  success: <Check className="w-4 h-4 text-emerald-400" />,
  error: <AlertTriangle className="w-4 h-4 text-rose-400" />,
  info: <Info className="w-4 h-4 text-sky-400" />,
};

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastFn>(
    (message, type = 'info') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => remove(id), 3200);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] flex flex-col items-center gap-2 pointer-events-none w-full max-w-[90vw] sm:max-w-sm px-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#0f0f13] border border-white/10 shadow-2xl text-sm text-white/90"
            >
              <span className="shrink-0">{ICONS[t.type]}</span>
              <span className="grow leading-snug break-words">{t.message}</span>
              <button
                onClick={() => remove(t.id)}
                className="shrink-0 text-white/30 hover:text-white transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
