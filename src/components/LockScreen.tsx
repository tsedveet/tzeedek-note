/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shown when the vault is soft-locked (auto-lock or manual lock). The server
 * session stays valid — only the in-browser encryption key is cleared — so the
 * user re-unlocks with just their vault passphrase, no full re-login.
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, KeyRound, Shield } from 'lucide-react';
import { VaultTheme, VaultUser } from '../types';

interface LockScreenProps {
  user: VaultUser;
  theme: VaultTheme;
  onUnlock: (passphrase: string) => Promise<void>;
  onLogout: () => void;
}

export default function LockScreen({ user, theme, onUnlock, onLogout }: LockScreenProps) {
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const accent =
    theme === 'emerald' ? 'text-emerald-400' : theme === 'voltage' ? 'text-sky-400' : theme === 'indigo' ? 'text-violet-400' : 'text-slate-400';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pass) return;
    setBusy(true);
    setError('');
    try {
      await onUnlock(pass);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Нууц үг буруу байна.');
      setBusy(false);
      setPass('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      className="w-full max-w-md mx-auto p-4 z-10"
    >
      <div className="glass-panel p-10 rounded-[32px] bg-black/80 border border-white/[0.08] shadow-2xl text-center relative overflow-hidden">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl glass-panel border border-white/10 flex items-center justify-center mb-4 bg-white/5">
            <Lock className={`w-6 h-6 ${accent}`} />
          </div>
          <h2 className="font-display text-xl font-semibold text-white">Сейф түгжээтэй байна</h2>
          <p className="text-xs text-white/40 font-mono mt-2 truncate max-w-[260px]">{user.email}</p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">{error}</div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <KeyRound className="h-4.5 w-4.5 text-white/30" />
            </div>
            <input
              type="password"
              autoFocus
              value={pass}
              onChange={(e) => {
                setPass(e.target.value);
                setError('');
              }}
              placeholder="Vault нууц үг"
              className="w-full pl-11 pr-4 py-3.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/20 transition font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3.5 bg-white hover:bg-neutral-100 text-black font-semibold rounded-xl text-sm transition active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {busy ? (
              'Тайлж байна…'
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Тайлах</span>
              </>
            )}
          </button>
        </form>

        <button
          onClick={onLogout}
          className="mt-4 text-[11px] text-white/35 hover:text-white/70 font-mono transition cursor-pointer"
        >
          Өөр хаягаар нэвтрэх
        </button>
      </div>
    </motion.div>
  );
}
