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
  loadCachedEncKey,
  clearCachedEncKey,
} from '@/lib/crypto-client';
import {
  fetchSession,
  saveVault,
  logoutVault,
  deleteVault,
  VaultData,
} from '@/lib/api-client';
import VaultBackground from './VaultBackground';
import CinematicHero from './CinematicHero';
import AuthScreen from './AuthScreen';
import Dashboard from './Dashboard';
import ConfirmProvider from './ConfirmProvider';

export default function VaultApp() {
  const [booting, setBooting] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [theme, setTheme] = useState<VaultTheme>('emerald');
  const [user, setUser] = useState<VaultUser | null>(null);
  const [encKey, setEncKey] = useState<CryptoKey | null>(null);

  // Core App Store States (loaded on auth, decrypted client-side)
  const [notes, setNotes] = useState<Note[]>([]);
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [logs, setLogs] = useState<VaultLog[]>([]);

  // Restore theme + try to resume an existing session (cookie + cached enc key).
  useEffect(() => {
    const savedTheme = localStorage.getItem('vault_active_theme') as VaultTheme | null;
    if (savedTheme) setTheme(savedTheme);

    (async () => {
      try {
        const cachedKey = await loadCachedEncKey();
        const session = await fetchSession();
        if (session && session.vault && cachedKey) {
          const data = await decryptVault<VaultData>(cachedKey, session.vault);
          setUser(session.user);
          setEncKey(cachedKey);
          setNotes(data.notes || []);
          setPasswords(data.passwords || []);
          setPrompts(data.prompts || []);
          setLogs(data.logs || []);
          setIsLoggedIn(true);
        } else if (session && !cachedKey) {
          // Server session exists but the in-browser key is gone — require re-login.
          await logoutVault();
        }
      } catch {
        clearCachedEncKey();
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const handleThemeChange = (newTheme: VaultTheme) => {
    setTheme(newTheme);
    localStorage.setItem('vault_active_theme', newTheme);
  };

  const handleAuthSuccess = (activeUser: VaultUser, data: VaultData, key: CryptoKey) => {
    setUser(activeUser);
    setEncKey(key);
    setNotes(data.notes);
    setPasswords(data.passwords);
    setPrompts(data.prompts);
    setLogs(data.logs);
    setIsLoggedIn(true);
  };

  // Central persistence writer — re-encrypts the whole vault and pushes it to Neon.
  const handleUpdateAppStore = (
    updatedNotes: Note[],
    updatedPasswords: PasswordEntry[],
    updatedPrompts: AIPrompt[],
    updatedLogs: VaultLog[],
  ) => {
    setNotes(updatedNotes);
    setPasswords(updatedPasswords);
    setPrompts(updatedPrompts);
    setLogs(updatedLogs);

    if (!encKey) return;
    const data: VaultData = {
      notes: updatedNotes,
      passwords: updatedPasswords,
      prompts: updatedPrompts,
      logs: updatedLogs,
    };
    encryptVault(encKey, data)
      .then((blob) => saveVault(blob))
      .catch((err) => console.error('Сейфийг хадгалахад алдаа гарлаа:', err));
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
          logs: [lockLog, ...logs],
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
    setUser(null);
    setEncKey(null);
    setNotes([]);
    setPasswords([]);
    setPrompts([]);
    setLogs([]);
  };

  return (
    <ConfirmProvider>
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Living Cinematic Ambient Background visible on both views */}
      <VaultBackground theme={theme} />

      {booting ? (
        <div className="relative z-10 flex flex-col items-center space-y-4 text-white/50">
          <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
          <span className="text-[11px] font-mono tracking-[0.3em] uppercase">Сейфийг ачааллаж байна…</span>
        </div>
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
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
    </ConfirmProvider>
  );
}
