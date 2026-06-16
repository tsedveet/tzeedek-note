/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Shield, KeyRound, ShieldCheck, RefreshCw } from 'lucide-react';
import { VaultTheme, VaultUser } from '@/types';
import { generateSalt, deriveKeys, encryptVault, decryptVault, cacheEncKey } from '@/lib/crypto-client';
import {
  fetchSalt,
  registerVault,
  loginVault,
  startGoogleLogin,
  googleRegister,
  googleLogin,
  VaultData,
  PendingGoogle,
} from '@/lib/api-client';

interface AuthScreenProps {
  theme: VaultTheme;
  setTheme: (t: VaultTheme) => void;
  onAuthSuccess: (user: VaultUser, data: VaultData, encKey: CryptoKey) => void;
  pendingGoogle?: PendingGoogle | null;
  initialError?: string;
  onCancelPendingGoogle?: () => void;
}

// Multicolour Google "G" mark (lucide has no brand logos).
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.86-.08-1.69-.22-2.49H12v4.72h6.46a5.52 5.52 0 0 1-2.39 3.62v3h3.86c2.26-2.08 3.59-5.15 3.59-8.85z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.86-3c-1.07.72-2.45 1.15-4.09 1.15-3.14 0-5.8-2.12-6.76-4.97H1.25v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.24 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.25a12 12 0 0 0 0 10.76l3.99-3.1z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.25 6.62l3.99 3.1C6.2 6.87 8.86 4.75 12 4.75z" />
    </svg>
  );
}

export default function AuthScreen({
  theme,
  setTheme,
  onAuthSuccess,
  pendingGoogle,
  initialError,
  onCancelPendingGoogle,
}: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);

  // Surface OAuth errors passed in from the redirect.
  useEffect(() => {
    if (initialError) setError(initialError);
  }, [initialError]);

  // Seed default demo data if registering for the first time
  const getDefaultDemoData = (userEmail: string): VaultData => {
    const timeNow = new Date().toISOString();
    return {
      notes: [
        {
          id: 'note-1',
          title: '🔐 Хувийн Сейфийн зааварчилгаа',
          content: `## VaultNote-д тавтай морилно уу! \n\nЭнэхүү систем нь **хэрэглэгчийн талын шифрлэлттэй (Zero-Knowledge Architecture)** бөгөөд таны хувийн өгөгдөл, тэмдэглэл болон нууц үгүүд зөвхөн таны төхөөрөмж дээр шифрлэгдэн хадгалагддаг.\n\n### Үндсэн боломжууд:\n1. **Тэмдэглэл (Notes)** - Маш хурдан, Markdown дэмжигчтэй, дуртай болон архивлах боломжтой.\n2. **Нууц үг (Passwords)** - Нууцлагдсан харагдац, хуулах хурдан үйлдэл болон аюулгүй байдлын индикатор бүхий менежер.\n3. **AI Промпт (AIPrompt)** - Идэвхтэй ашигладаг промптуудаа нэг дороос хялбар бөгөөд хурдан удирдах.\n\n_Өгөгдөл тань зөвхөн таны хяналтад байна. Тавтай ашиглаарай!_`,
          isPinned: true,
          isFavorite: true,
          isArchived: false,
          createdAt: timeNow,
          updatedAt: timeNow,
          tags: ['заавар']
        }
      ],
      passwords: [],
      prompts: [],
      logs: [
        {
          id: 'log-1',
          action: 'CRYPT_INIT',
          type: 'security' as const,
          timestamp: timeNow,
          details: 'AES-256 шифрлэлтийн алгоритмыг локал орчинд бэлтгэв.'
        },
        {
          id: 'log-2',
          action: 'USER_REGISTER',
          type: 'auth' as const,
          timestamp: timeNow,
          details: `Шинэ сейф амжилттай үүсгэгдэв: ${userEmail}`
        }
      ]
    };
  };

  const getThemeAccentClass = () => {
    switch (theme) {
      case 'emerald': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-500 hover:text-emerald-400';
      case 'voltage': return 'text-sky-400 bg-sky-500/10 border-sky-500/20 hover:border-sky-500/40 text-sky-500 hover:text-sky-400';
      case 'indigo': return 'text-violet-400 bg-violet-500/10 border-violet-500/20 hover:border-violet-500/40 text-violet-500 hover:text-violet-400';
      case 'minimal':
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20 hover:border-slate-500/40 text-slate-500 hover:text-slate-400';
    }
  };

  const getThemeButtonClass = () => {
    return 'bg-white hover:bg-neutral-150 text-black font-semibold shadow-xl transition-all duration-300 active:scale-[0.98]';
  };

  const getThemeFocusClass = () => {
    switch (theme) {
      case 'emerald': return 'focus:border-emerald-500 focus:bg-emerald-500/[0.04] focus:ring-1 focus:ring-emerald-500/20';
      case 'voltage': return 'focus:border-sky-500 focus:bg-sky-500/[0.04] focus:ring-1 focus:ring-sky-500/20';
      case 'indigo': return 'focus:border-violet-500 focus:bg-violet-500/[0.04] focus:ring-1 focus:ring-violet-500/20';
      case 'minimal':
      default: return 'focus:border-slate-400 focus:bg-slate-500/[0.04] focus:ring-1 focus:ring-slate-400/20';
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Имэйл болон нууц үгээ оруулна уу.');
      return;
    }

    if (password.length < 6) {
      setError('Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.');
      return;
    }

    setIsProcessing(true);
    setProcessStep(0);

    const stepCount = 4;
    // Visually advance the crypto-engine steps while the real PBKDF2/AES work runs.
    const stepTimer = setInterval(() => {
      setProcessStep((s) => Math.min(s + 1, stepCount - 1));
    }, 450);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (isRegister) {
        // Zero-knowledge registration: derive keys locally, encrypt the seed
        // vault in the browser, and send only ciphertext + auth hash up.
        const salt = generateSalt();
        const { authHash, encKey } = await deriveKeys(password, salt);
        const vaultData = getDefaultDemoData(normalizedEmail);
        const blob = await encryptVault(encKey, vaultData);
        const { user } = await registerVault({ email: normalizedEmail, salt, authHash, vault: blob });
        await cacheEncKey(encKey);

        clearInterval(stepTimer);
        setProcessStep(stepCount);
        onAuthSuccess(user, vaultData, encKey);
      } else {
        // Login: fetch the salt, re-derive keys, verify on the server, then
        // decrypt the returned ciphertext locally.
        const { salt } = await fetchSalt(normalizedEmail);
        const { authHash, encKey } = await deriveKeys(password, salt);
        const { user, vault } = await loginVault({ email: normalizedEmail, authHash });

        const vaultData: VaultData = vault
          ? await decryptVault<VaultData>(encKey, vault)
          : { notes: [], passwords: [], prompts: [], logs: [] };

        // Append a login log entry so the audit trail stays accurate.
        const loginLog = {
          id: `log-${Date.now()}`,
          action: 'USER_LOGIN',
          type: 'auth' as const,
          timestamp: new Date().toISOString(),
          details: 'Сейф амжилттай тайлагдлаа. Хэрэглэгчийн талын шифр тайлагдав.',
        };
        vaultData.logs = [loginLog, ...vaultData.logs];

        await cacheEncKey(encKey);

        clearInterval(stepTimer);
        setProcessStep(stepCount);
        onAuthSuccess(user, vaultData, encKey);
      }
    } catch (err) {
      clearInterval(stepTimer);
      setError(err instanceof Error ? err.message : 'Алдаа гарлаа. Дахин оролдоно уу.');
      setIsProcessing(false);
    }
  };

  // After Google sign-in, the user sets/enters their separate vault passphrase
  // (the zero-knowledge key) to finish unlocking.
  const handleGooglePassphrase = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!pendingGoogle) return;

    if (password.length < 6) {
      setError('Vault нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.');
      return;
    }

    setIsProcessing(true);
    setProcessStep(0);
    const stepCount = 4;
    const stepTimer = setInterval(() => {
      setProcessStep((s) => Math.min(s + 1, stepCount - 1));
    }, 450);

    try {
      if (pendingGoogle.isNewUser) {
        const salt = generateSalt();
        const { authHash, encKey } = await deriveKeys(password, salt);
        const vaultData = getDefaultDemoData(pendingGoogle.email);
        const blob = await encryptVault(encKey, vaultData);
        const { user } = await googleRegister({ salt, authHash, vault: blob });
        await cacheEncKey(encKey);
        clearInterval(stepTimer);
        setProcessStep(stepCount);
        onAuthSuccess(user, vaultData, encKey);
      } else {
        const salt = pendingGoogle.salt;
        if (!salt) throw new Error('Сейфийн мэдээлэл олдсонгүй.');
        const { authHash, encKey } = await deriveKeys(password, salt);
        const { user, vault } = await googleLogin({ authHash });

        const vaultData: VaultData = vault
          ? await decryptVault<VaultData>(encKey, vault)
          : { notes: [], passwords: [], prompts: [], logs: [] };

        const loginLog = {
          id: `log-${Date.now()}`,
          action: 'USER_LOGIN',
          type: 'auth' as const,
          timestamp: new Date().toISOString(),
          details: 'Google-ээр баталгаажиж, сейф амжилттай тайлагдлаа.',
        };
        vaultData.logs = [loginLog, ...vaultData.logs];

        await cacheEncKey(encKey);
        clearInterval(stepTimer);
        setProcessStep(stepCount);
        onAuthSuccess(user, vaultData, encKey);
      }
    } catch (err) {
      clearInterval(stepTimer);
      setError(err instanceof Error ? err.message : 'Алдаа гарлаа. Дахин оролдоно уу.');
      setIsProcessing(false);
    }
  };

  const stepsText = isRegister 
    ? ['Энтропи бодож байна...', 'Мастер шифрлэлтийн түлхүүр үүсгэж байна...', 'AES-256 локал хуваалтыг тусгаарлаж байна...', 'Нэвтрэлт бэлэн боллоо!']
    : ['Мастер түлхүүрийг декодлож байна...', 'Сейфийн аюулгүй байдлыг баталгаажуулж байна...', 'Сейфийг тайлж байна...', 'Амжилттай тайллаа!'];

  return (
    <div className="relative flex flex-col justify-center items-center py-6 px-4 md:px-0 w-full min-h-[580px] z-10">
      {/* Dynamic Theme switcher — centered above the card so it never clips the edge */}
      <div className="flex items-center space-x-1 p-1 mb-5 rounded-full glass-panel border border-white/10 bg-black/40 z-20">
        {(['emerald', 'voltage', 'indigo', 'minimal'] as VaultTheme[]).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`px-3 py-1 text-[10px] uppercase font-mono tracking-wider rounded-full transition-all duration-300 ${
              theme === t 
                ? 'bg-white/10 text-white font-medium shadow' 
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {isProcessing ? (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="w-full max-w-md glass-panel p-8 md:p-10 rounded-[28px] shadow-2xl border border-white/5 relative bg-black/60 overflow-hidden"
          >
            {/* Pulsing secure halo */}
            <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-[60px] opacity-20 ${
              theme === 'emerald' ? 'bg-emerald-500' : theme === 'voltage' ? 'bg-sky-500' : theme === 'indigo' ? 'bg-violet-500' : 'bg-slate-500'
            }`} />

            <div className="flex flex-col items-center justify-center space-y-8 my-4 relative z-10">
              <div className="relative flex items-center justify-center">
                <RefreshCw className={`w-14 h-14 animate-spin text-white/30`} />
                <div className="absolute flex items-center justify-center">
                  <KeyRound className={`w-6 h-6 animate-pulse ${
                    theme === 'emerald' ? 'text-emerald-400' : theme === 'voltage' ? 'text-sky-400' : theme === 'indigo' ? 'text-violet-400' : 'text-slate-400'
                  }`} />
                </div>
              </div>

              <div className="text-center space-y-3">
                <span className="text-[10px] tracking-[0.3em] font-mono text-white/40 uppercase">CRYPTO ENGINE WORKING</span>
                <h3 className="font-display text-xl text-white font-semibold">Сейфийн Түлхүүрийг Боловсруулж байна</h3>
                <p className="text-xs text-white/50 max-w-xs mx-auto">
                  Төхөөрөмж дээр локал Сандбокс шифрлэлтийг бэлтгэж байна. Хүлээгээрэй...
                </p>
              </div>

              {/* Progress Steps Indicators with High Cybersecurity Aesthetic */}
              <div className="w-full space-y-2.5 bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-left">
                {stepsText.map((step, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className={idx <= processStep ? 'text-white/85' : 'text-white/20'}>
                      {idx + 1}. {step}
                    </span>
                    {idx < processStep ? (
                      <span className="text-emerald-400 text-[10px]">[OK]</span>
                    ) : idx === processStep ? (
                      <span className="text-amber-400 text-[10px] animate-pulse">RUNNING</span>
                    ) : (
                      <span className="text-white/10 text-[10px]">WAIT</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : pendingGoogle ? (
          <motion.div
            key="google-passphrase"
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md glass-panel p-10 rounded-[32px] shadow-2xl relative bg-black/80 overflow-hidden border border-white/[0.08]"
          >
            <div className="flex flex-col items-center mb-6 relative z-10 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl glass-panel border border-white/10 mb-4 shadow bg-white/5">
                <KeyRound className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="font-display text-xl font-semibold tracking-wide text-white">
                {pendingGoogle.isNewUser ? 'Vault нууц үг үүсгэх' : 'Сейфээ тайлах'}
              </h2>
              <p className="text-xs text-white/45 mt-2 max-w-xs">
                {pendingGoogle.isNewUser
                  ? 'Энэ нь таны өгөгдлийг шифрлэх түлхүүр. Google ч, сервер ч үүнийг хардаггүй — мартаж болохгүй.'
                  : 'Сейфээ тайлахын тулд vault нууц үгээ оруулна уу.'}
              </p>
              <div className="inline-flex items-center space-x-2 bg-white/[0.04] px-3 py-1.5 rounded-full border border-white/10 mt-4 text-xs text-white/70 font-mono">
                <GoogleIcon className="w-3.5 h-3.5" />
                <span className="truncate max-w-[200px]">{pendingGoogle.email}</span>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-start space-x-2 relative z-10">
                <span className="mt-0.5 font-bold">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleGooglePassphrase} className="space-y-5 relative z-10">
              <div className="space-y-1.5 text-left">
                <label className="block text-[11px] font-mono uppercase tracking-widest text-white/50 pl-1">
                  Vault нууц үг
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4.5 w-4.5 text-white/30" />
                  </div>
                  <input
                    type="password"
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder={pendingGoogle.isNewUser ? 'Шинэ vault нууц үг' : 'Vault нууц үг'}
                    className={`block w-full pl-11 pr-4 py-3.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white text-sm placeholder-white/20 focus:outline-none transition-all duration-300 font-mono ${getThemeFocusClass()}`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 px-4 bg-white hover:bg-neutral-100 text-black font-semibold rounded-xl transition-all duration-300 font-sans tracking-wide cursor-pointer flex items-center justify-center space-x-2 text-sm active:scale-[0.98]"
              >
                <KeyRound className="w-4 h-4" />
                <span>{pendingGoogle.isNewUser ? 'Сейф үүсгэх' : 'Сейфийг тайлах'}</span>
              </button>
            </form>

            <button
              onClick={() => onCancelPendingGoogle?.()}
              className="w-full mt-3 py-3 px-4 bg-transparent hover:bg-white/[0.02] border border-white/[0.08] hover:border-white/20 text-white/70 font-medium rounded-xl transition-all duration-200 text-sm cursor-pointer relative z-10"
            >
              Болих / Өөр аккаунтаар нэвтрэх
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={isRegister ? 'register' : 'login'}
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md glass-panel p-10 rounded-[32px] shadow-2xl relative bg-black/80 overflow-hidden border border-white/[0.08]"
          >
            {/* Ambient decorative gradient nodes */}
            <div className={`absolute -top-24 -right-12 w-48 h-48 rounded-full blur-[80px] opacity-15 ${
              theme === 'emerald' ? 'bg-emerald-500' : theme === 'voltage' ? 'bg-sky-500' : theme === 'indigo' ? 'bg-violet-500' : 'bg-slate-500'
            }`} />
            <div className={`absolute -bottom-24 -left-12 w-48 h-48 rounded-full blur-[80px] opacity-15 ${
              theme === 'emerald' ? 'bg-emerald-500' : theme === 'voltage' ? 'bg-sky-500' : theme === 'indigo' ? 'bg-violet-500' : 'bg-slate-500'
            }`} />

            <div className="flex flex-col items-center mb-8 relative z-10 text-center">
              {/* Logo / Brand shield */}
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl glass-panel border border-white/10 mb-4 shadow bg-white/5">
                <Shield className={`w-5 h-5 ${
                  theme === 'emerald' ? 'text-emerald-400 text-glow-emerald' : theme === 'voltage' ? 'text-sky-400 text-glow-voltage' : theme === 'indigo' ? 'text-violet-400 text-glow-indigo' : 'text-slate-400'
                }`} />
              </div>
              <h2 className="font-display text-2xl font-semibold tracking-wider text-white">
                VAULT<span className={
                  theme === 'emerald' ? 'text-emerald-400' : theme === 'voltage' ? 'text-sky-400' : theme === 'indigo' ? 'text-violet-400' : 'text-slate-400'
                }>NOTE</span>
              </h2>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30 mt-1">
                Хувийн тэмдэглэл & Нууц үг хадгалах сан
              </p>
            </div>

            {/* Continue with Google */}
            <button
              type="button"
              onClick={() => startGoogleLogin()}
              className="w-full py-3.5 px-4 mb-5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center space-x-2.5 text-sm cursor-pointer active:scale-[0.98] relative z-10"
            >
              <GoogleIcon className="w-4 h-4" />
              <span>Google-ээр үргэлжлүүлэх</span>
            </button>

            {/* OR divider */}
            <div className="flex items-center gap-3 mb-5 relative z-10">
              <div className="h-[1px] flex-1 bg-white/10" />
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">эсвэл</span>
              <div className="h-[1px] flex-1 bg-white/10" />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-start space-x-2"
              >
                <span className="mt-0.5 font-bold">⚠️</span>
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-5 relative z-10">
              <div className="space-y-1.5 text-left">
                <label className="block text-[11px] font-mono uppercase tracking-widest text-white/50 pl-1">
                  Имэйл хаяг
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4.5 w-4.5 text-white/30" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="name@domain.com"
                    className={`block w-full pl-11 pr-4 py-3.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white text-sm placeholder-white/20 focus:outline-none transition-all duration-300 font-mono ${getThemeFocusClass()}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-[11px] font-mono uppercase tracking-widest text-white/50 pl-1">
                  Нууц үг
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4.5 w-4.5 text-white/30" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder={isRegister ? '••••••••' : 'Код оруулах'}
                    className={`block w-full pl-11 pr-4 py-3.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white text-sm placeholder-white/20 focus:outline-none transition-all duration-300 font-mono ${getThemeFocusClass()}`}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className={`w-full py-4 px-4 bg-white hover:bg-neutral-100 text-black font-semibold rounded-xl transition-all duration-300 font-sans tracking-wide cursor-pointer flex items-center justify-center space-x-2 text-sm active:scale-[0.98]`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isRegister ? 'Бүртгүүлэх' : 'Нэвтрэх'}</span>
                </button>
              </div>
            </form>

            {/* Selector switch */}
            <div className="mt-4 text-center space-y-4">
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
                className="w-full py-4 px-4 bg-transparent hover:bg-white/[0.02] border border-white/[0.08] hover:border-white/20 text-white font-medium rounded-xl transition-all duration-200 font-sans tracking-wide cursor-pointer flex items-center justify-center space-x-2 text-sm active:scale-[0.98]"
              >
                {isRegister ? 'Нэвтрэх' : 'Бүртгүүлэх'}
              </button>

              <div className="h-[1px] w-full bg-white/5" />

              {/* Secure Badge */}
              <div className="flex justify-center">
                <div className="inline-flex items-center space-x-2 bg-white/[0.04] px-3 py-1 rounded-full border border-white/5 text-[9px] font-mono tracking-widest text-white/50 uppercase">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>AES-256</span>
                  <span className="text-white/20">•</span>
                  <span>End-to-End Ready</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
