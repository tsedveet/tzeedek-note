/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Note, PasswordEntry, AIPrompt, VaultLog, VaultTheme, VaultUser } from '@/types';
import {
  decryptVault,
  encryptVault,
  deriveKeys,
  cacheEncKey,
  loadCachedEncKey,
  clearCachedEncKey,
} from '@/lib/crypto-client';
import {
  fetchSession,
  fetchSalt,
  saveVault,
  logoutVault,
  deleteVault,
  VaultData,
  PendingGoogle,
} from '@/lib/api-client';
import LockScreen from './LockScreen';
import VaultBackground from './VaultBackground';
import CinematicHero from './CinematicHero';
import AuthScreen from './AuthScreen';
import Dashboard from './Dashboard';
import ConfirmProvider from './ConfirmProvider';
import ToastProvider from './ToastProvider';

// Cap the audit trail so the encrypted vault blob never grows without bound.
const MAX_LOGS = 50;

export default function VaultApp() {
  const [booting, setBooting] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [theme, setTheme] = useState<VaultTheme>('emerald');
  const [user, setUser] = useState<VaultUser | null>(null);
  const [encKey, setEncKey] = useState<CryptoKey | null>(null);
  const [pendingGoogle, setPendingGoogle] = useState<PendingGoogle | null>(null);
  const [authError, setAuthError] = useState('');
  const [autoLockMin, setAutoLockMin] = useState(15); // 0 = never
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [locked, setLocked] = useState(false);

  // Core App Store States (loaded on auth, decrypted client-side)
  const [notes, setNotes] = useState<Note[]>([]);
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [logs, setLogs] = useState<VaultLog[]>([]);

  // Restore theme + try to resume an existing session (cookie + cached enc key).
  useEffect(() => {
    const savedTheme = localStorage.getItem('vault_active_theme') as VaultTheme | null;
    if (savedTheme) setTheme(savedTheme);
    const savedLock = localStorage.getItem('vault_autolock_min');
    if (savedLock !== null) setAutoLockMin(Number(savedLock));

    // Surface OAuth redirect results (?google=1 / ?auth_error=...) then clean URL.
    const params = new URLSearchParams(window.location.search);
    const oauthErr = params.get('auth_error');
    if (oauthErr) setAuthError(oauthErr);
    if (oauthErr || params.get('google')) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    (async () => {
      try {
        const cachedKey = await loadCachedEncKey();
        const session = await fetchSession();
        if (session?.user && session.vault && cachedKey) {
          const data = await decryptVault<VaultData>(cachedKey, session.vault);
          setUser(session.user);
          setEncKey(cachedKey);
          setNotes(data.notes || []);
          setPasswords(data.passwords || []);
          setPrompts(data.prompts || []);
          setLogs(data.logs || []);
          setIsLoggedIn(true);
        } else if (session?.pendingGoogle) {
          // Signed in with Google; awaiting the vault passphrase.
          setPendingGoogle(session.pendingGoogle);
        } else if (session?.user) {
          // Server session valid but the in-browser key is gone → show the lock screen.
          setUser(session.user);
          setLocked(true);
        }
      } catch {
        clearCachedEncKey();
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  // Auto-lock the vault after a period of inactivity. The latest data is already
  // saved on every edit, so locking just clears the session + in-memory keys.
  useEffect(() => {
    if (!isLoggedIn || locked || autoLockMin <= 0) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => softLock(), autoLockMin * 60 * 1000);
    };
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, locked, autoLockMin]);

  // Soft lock: clear the in-browser key + data but keep the server session, so
  // the user re-unlocks with just the vault passphrase. Edits are already saved.
  const softLock = () => {
    clearCachedEncKey();
    setEncKey(null);
    setNotes([]);
    setPasswords([]);
    setPrompts([]);
    setLogs([]);
    setLocked(true);
  };

  const handleUnlock = async (passphrase: string) => {
    if (!user) throw new Error('Хэрэглэгч олдсонгүй.');
    const { salt } = await fetchSalt(user.email);
    const { encKey: key } = await deriveKeys(passphrase, salt);
    const session = await fetchSession();
    if (!session?.vault) throw new Error('Сейф олдсонгүй. Дахин нэвтэрнэ үү.');
    const data = await decryptVault<VaultData>(key, session.vault); // wrong passphrase → throws
    setEncKey(key);
    setNotes(data.notes || []);
    setPasswords(data.passwords || []);
    setPrompts(data.prompts || []);
    setLogs(data.logs || []);
    await cacheEncKey(key);
    setUser(session.user ?? user);
    setIsLoggedIn(true);
    setLocked(false);
  };

  const handleThemeChange = (newTheme: VaultTheme) => {
    setTheme(newTheme);
    localStorage.setItem('vault_active_theme', newTheme);
  };

  const handleAutoLockChange = (min: number) => {
    setAutoLockMin(min);
    localStorage.setItem('vault_autolock_min', String(min));
  };

  const handleAuthSuccess = (activeUser: VaultUser, data: VaultData, key: CryptoKey) => {
    setUser(activeUser);
    setEncKey(key);
    setNotes(data.notes);
    setPasswords(data.passwords);
    setPrompts(data.prompts);
    setLogs(data.logs);
    setIsLoggedIn(true);
    setPendingGoogle(null);
    setAuthError('');
  };

  // User backed out of the Google passphrase step — clear the pending identity.
  const handleCancelPendingGoogle = async () => {
    await logoutVault();
    setPendingGoogle(null);
    setAuthError('');
  };

  // Central persistence writer — re-encrypts the whole vault and pushes it to Neon.
  const handleUpdateAppStore = (
    updatedNotes: Note[],
    updatedPasswords: PasswordEntry[],
    updatedPrompts: AIPrompt[],
    updatedLogs: VaultLog[],
  ) => {
    // Keep only the most recent entries so the vault stays small.
    const trimmedLogs = updatedLogs.slice(0, MAX_LOGS);
    setNotes(updatedNotes);
    setPasswords(updatedPasswords);
    setPrompts(updatedPrompts);
    setLogs(trimmedLogs);

    if (!encKey) return;
    const data: VaultData = {
      notes: updatedNotes,
      passwords: updatedPasswords,
      prompts: updatedPrompts,
      logs: trimmedLogs,
    };
    setSaveStatus('saving');
    encryptVault(encKey, data)
      .then((blob) => saveVault(blob))
      .then(() => {
        setSaveStatus('saved');
        window.setTimeout(() => setSaveStatus((s) => (s === 'saved' ? 'idle' : s)), 1600);
      })
      .catch((err) => {
        console.error('Сейфийг хадгалахад алдаа гарлаа:', err);
        setSaveStatus('error');
      });
  };

  const handleLogOut = async () => {
    if (encKey) {
      const lockLog: VaultLog = {
        id: `log-${Date.now()}`,
        action: 'VAULT_LOCKED',
        type: 'security',
        timestamp: new Date().toISOString(),
        details: 'Сейф гар аргаар амжилттай хаагдлаа. Санах ойг цэвэрлэв.',
      };
      try {
        const blob = await encryptVault(encKey, {
          notes,
          passwords,
          prompts,
          logs: [lockLog, ...logs].slice(0, MAX_LOGS),
        });
        await saveVault(blob);
      } catch (err) {
        console.error('Гарахын өмнө хадгалахад алдаа гарлаа:', err);
      }
    }

    await logoutVault();
    resetState();
  };

  const handleClearAllData = async () => {
    try {
      await deleteVault();
    } catch (err) {
      console.error('Сейфийг устгахад алдаа гарлаа:', err);
    }
    resetState();
  };

  const resetState = () => {
    clearCachedEncKey();
    setIsLoggedIn(false);
    setLocked(false);
    setUser(null);
    setEncKey(null);
    setNotes([]);
    setPasswords([]);
    setPrompts([]);
    setLogs([]);
  };

  return (
    <ToastProvider>
    <ConfirmProvider>
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Living Cinematic Ambient Background visible on both views */}
      <VaultBackground theme={theme} />

      {booting ? (
        <div className="relative z-10 flex flex-col items-center space-y-4 text-white/50">
          <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
          <span className="text-[11px] font-mono tracking-[0.3em] uppercase">Сейфийг ачааллаж байна…</span>
        </div>
      ) : locked && user ? (
        <LockScreen user={user} theme={theme} onUnlock={handleUnlock} onLogout={handleLogOut} />
      ) : (
        <AnimatePresence mode="wait">
          {!isLoggedIn ? (
            <motion.div
              key="login-page"
              initial={{ opacity: 0, scale: 0.98, filter: 'blur(5px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-7xl mx-auto p-4 md:p-8"
            >
              {/* Split layout: left side visual display, right side auth form */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch min-h-[580px]">
                {/* LEFT SIDE: Cinematic Visual Mandala Shield info screen */}
                <div className="hidden lg:block lg:col-span-7 h-full">
                  <CinematicHero theme={theme} />
                </div>

                {/* RIGHT SIDE: Compact auth card floating */}
                <div className="col-span-1 lg:col-span-5 flex items-center justify-center">
                  <AuthScreen
                    theme={theme}
                    setTheme={handleThemeChange}
                    onAuthSuccess={handleAuthSuccess}
                    pendingGoogle={pendingGoogle}
                    initialError={authError}
                    onCancelPendingGoogle={handleCancelPendingGoogle}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard-page"
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-screen"
            >
              {user && (
                <Dashboard
                  user={user}
                  notes={notes}
                  passwords={passwords}
                  prompts={prompts}
                  logs={logs}
                  theme={theme}
                  setTheme={handleThemeChange}
                  onUpdateAppStore={handleUpdateAppStore}
                  onLogOut={handleLogOut}
                  onClearAllData={handleClearAllData}
                  onLock={softLock}
                  autoLockMin={autoLockMin}
                  setAutoLockMin={handleAutoLockChange}
                  saveStatus={saveStatus}
                  encKey={encKey}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
    </ConfirmProvider>
    </ToastProvider>
  );
}
