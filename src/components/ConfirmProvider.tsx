/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * A promise-based confirmation dialog that matches the VaultNote aesthetic,
 * replacing the native window.confirm() popups. Use via the useConfirm() hook:
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ message: '...', danger: true })) { ... }
 */

'use client';

import React, { createContext, useContext, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
}

export default function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ options: ConfirmOptions; resolve: (v: boolean) => void } | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => setState({ options, resolve }));
  }, []);

  const close = (result: boolean) => {
    state?.resolve(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {state && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => close(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-sm rounded-3xl bg-[#0f0f13] border border-white/10 shadow-2xl p-6 text-center"
            >
              <div
                className={`mx-auto mb-4 w-12 h-12 rounded-2xl flex items-center justify-center border ${
                  state.options.danger ? 'bg-rose-500/10 border-rose-500/20' : 'bg-amber-400/10 border-amber-400/20'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 ${state.options.danger ? 'text-rose-400' : 'text-amber-400'}`} />
              </div>

              {state.options.title && (
                <h3 className="font-display text-lg text-white font-semibold mb-1.5">{state.options.title}</h3>
              )}
              <p className="text-sm text-white/60 leading-relaxed mb-6">{state.options.message}</p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => close(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-medium transition cursor-pointer"
                >
                  {state.options.cancelText || 'Болих'}
                </button>
                <button
                  autoFocus
                  onClick={() => close(true)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer active:scale-[0.98] ${
                    state.options.danger
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-white hover:bg-neutral-100 text-black'
                  }`}
                >
                  {state.options.confirmText || 'Тийм'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}
