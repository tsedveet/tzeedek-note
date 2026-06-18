/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KeyRound, Eye, EyeOff, Copy, Check, Shield, AlertTriangle, Plus, Trash2, Edit3, Save, ExternalLink, Star, Archive, Search, RefreshCw, Sparkles, X } from 'lucide-react';
import { PasswordEntry, VaultTheme } from '../types';
import { useConfirm } from './ConfirmProvider';
import { useToast } from './ToastProvider';

interface PasswordsTabProps {
  passwords: PasswordEntry[];
  onUpdatePasswords: (updated: PasswordEntry[], logMsg: string) => void;
  theme: VaultTheme;
}

export default function PasswordsTab({ passwords, onUpdatePasswords, theme }: PasswordsTabProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPassId, setSelectedPassId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Editor / Creator drawer overlay trigger
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');

  // Input states
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [passwordText, setPasswordText] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Password Generator states
  const [genLength, setGenLength] = useState(16);
  const [genUpper, setGenUpper] = useState(true);
  const [genLower, setGenLower] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);

  const filteredPasswords = passwords.filter(p => {
    if (p.isArchived) return false;
    return p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (p.websiteUrl && p.websiteUrl.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const getThemeTextClass = () => {
    switch (theme) {
      case 'emerald': return 'text-emerald-400';
      case 'voltage': return 'text-sky-400';
      case 'indigo': return 'text-violet-400';
      case 'minimal':
      default: return 'text-slate-400';
    }
  };

  const getThemeBorderClass = () => {
    switch (theme) {
      case 'emerald': return 'border-emerald-500/20';
      case 'voltage': return 'border-sky-500/20';
      case 'indigo': return 'border-violet-500/20';
      case 'minimal':
      default: return 'border-slate-500/20';
    }
  };

  const getThemeButtonClass = () => {
    switch (theme) {
      case 'emerald': return 'bg-emerald-600 hover:bg-emerald-500 text-black font-semibold';
      case 'voltage': return 'bg-sky-600 hover:bg-sky-500 text-black font-semibold';
      case 'indigo': return 'bg-violet-600 hover:bg-violet-500 text-white font-semibold';
      case 'minimal':
      default: return 'bg-slate-300 hover:bg-white text-black font-semibold';
    }
  };

  // Safe trigger for clipboard copy. Sensitive values (passwords) are wiped
  // from the clipboard after 20s so they don't linger.
  const handleCopyText = (text: string, id: string, sensitive = false) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
    if (sensitive) {
      toast('Нууц үг хуулагдлаа · 20 секундэд clipboard цэвэрлэгдэнэ', 'success');
      window.setTimeout(() => {
        navigator.clipboard.writeText('').catch(() => {});
      }, 20000);
    }
  };

  const toggleReveal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRevealedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Password passwordStrength checker
  const checkStrength = (pass: string): 'weak' | 'medium' | 'strong' => {
    if (pass.length < 8) return 'weak';
    let score = 0;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    
    if (pass.length >= 12 && score >= 3) return 'strong';
    if (pass.length >= 8 && score >= 2) return 'medium';
    return 'weak';
  };

  // Built-in Generator algorithm
  const handleGeneratePassword = () => {
    let chars = '';
    if (genUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (genLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (genNumbers) chars += '0123456789';
    if (genSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // Use a cryptographically secure RNG rather than Math.random() for real entropy.
    let generated = '';
    const randomValues = new Uint32Array(genLength);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < genLength; i++) {
      generated += chars[randomValues[i] % chars.length];
    }
    setPasswordText(generated);
  };

  const handleOpenCreate = () => {
    setTitle('');
    setUsername('');
    setPasswordText('');
    setWebsiteUrl('');
    setNotes('');
    setDrawerMode('create');
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (p: PasswordEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPassId(p.id);
    setTitle(p.title);
    setUsername(p.username);
    setPasswordText(p.passwordText);
    setWebsiteUrl(p.websiteUrl || '');
    setNotes(p.notes || '');
    setDrawerMode('edit');
    setIsDrawerOpen(true);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !username || !passwordText) {
      toast('Шаардлагатай талбаруудыг бүрэн бөглөнө үү.', 'error');
      return;
    }

    const calculatedStrength = checkStrength(passwordText);

    if (drawerMode === 'create') {
      const newEntry: PasswordEntry = {
        id: `pass-${Date.now()}`,
        title,
        username,
        passwordText,
        strength: calculatedStrength,
        websiteUrl: websiteUrl || undefined,
        isFavorite: false,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: notes || undefined
      };

      const updated = [newEntry, ...passwords];
      onUpdatePasswords(updated, `Шинэ нууц үг хадгалав: ${title}`);
    } else {
      const updated = passwords.map(prev => {
        if (prev.id === selectedPassId) {
          return {
            ...prev,
            title,
            username,
            passwordText,
            strength: calculatedStrength,
            websiteUrl: websiteUrl || undefined,
            notes: notes || undefined,
            updatedAt: new Date().toISOString()
          };
        }
        return prev;
      });

      onUpdatePasswords(updated, `Нууц үгийн материалыг засав: ${title}`);
    }

    setIsDrawerOpen(false);
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = passwords.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p);
    const item = passwords.find(p => p.id === id);
    onUpdatePasswords(updated, `Нууц үгийг дуртайд тэмдэглэв: ${item?.title}`);
  };

  const handleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = passwords.map(p => p.id === id ? { ...p, isArchived: true } : p);
    const item = passwords.find(p => p.id === id);
    onUpdatePasswords(updated, `Нууц үгийг архивлав: ${item?.title}`);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Нууц үг устгах',
      message: 'Та энэ нууц үгийн картыг устгахдаа итгэлтэй байна уу? Сейфнээс бүрмөсөн устах болно.',
      confirmText: 'Устгах',
      danger: true,
    });
    if (!ok) return;

    const updated = passwords.filter(p => p.id !== id);
    const item = passwords.find(p => p.id === id);
    onUpdatePasswords(updated, `Нууц үгийг бүрмөсөн устгав: ${item?.title}`);
  };

  return (
    <div className="space-y-6 pb-10 relative">
      
      {/* Top Banner Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className={`text-[10px] font-mono tracking-[0.25em] ${getThemeTextClass()} font-semibold block`}>
            НУУЦЛАЛТАЙ МЕНЕЖЕР
          </span>
          <h1 className="text-3xl font-display font-light text-white tracking-tight mt-1">
            Аюулгүй <span className="font-medium">нууц үгс</span>
          </h1>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Хайх..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/10 transition font-mono w-48 md:w-60"
            />
          </div>

          <button
            onClick={handleOpenCreate}
            className={`px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer`}
          >
            <Plus className="w-4 h-4" />
            <span>Шинэ нууц үг нэмэх</span>
          </button>
        </div>
      </div>

      {/* Main passwords list grid layout styling */}
      {filteredPasswords.length === 0 ? (
        <div className="glass-panel p-20 rounded-3xl text-center space-y-4 max-w-lg mx-auto bg-black/20 mt-10">
          <KeyRound className="w-12 h-12 text-white/10 mx-auto animate-pulse" />
          <div className="space-y-1">
            <h4 className="text-md text-white/70 font-display">Хадгалсан нууц үг олдсонгүй</h4>
            <p className="text-xs text-white/35 font-mono">
              Та шинээр нууц үг шифрлэн хадгалах уу эсвэл хайлтын нэршлээ шалгана уу.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className={`px-4 py-2 text-xs rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium cursor-pointer`}
          >
            Шинэ нууц үг үүсгэх
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {filteredPasswords.map((p) => {
            const isRevealed = !!revealedIds[p.id];
            const isCopied = copiedId === p.id;
            return (
              <div
                key={p.id}
                className="glass-panel p-5 rounded-2xl relative overflow-hidden bg-black/40 text-left border border-white/5 flex flex-col justify-between min-h-[200px] glass-panel-hover"
              >
                <div>
                  {/* Top line category & favorites */}
                  <div className="flex items-start justify-between gap-1">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono tracking-widest text-white/30 uppercase">CREDENTIAL CARD</span>
                      <h3 className="text-sm font-medium text-white truncate max-w-[150px]" title={p.title}>
                        {p.title}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => handleToggleFavorite(p.id, e)}
                        className={`p-1 rounded-lg transition ${p.isFavorite ? 'text-rose-400' : 'text-white/20 hover:text-rose-400'}`}
                      >
                        <Star className={`w-3.5 h-3.5 ${p.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => handleArchive(p.id, e)}
                        className="p-1 rounded-lg text-white/20 hover:text-white/60 transition"
                        title="Архивлах"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleOpenEdit(p, e)}
                        className="p-1 rounded-lg text-white/20 hover:text-white/60 transition"
                        title="Засах"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(p.id, e)}
                        className="p-1 rounded-lg text-white/20 hover:text-rose-400 transition"
                        title="Устгах"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Username line */}
                  <div className="mt-4 space-y-1">
                    <span className="text-[10px] font-mono text-white/25 block">НЭВТРЭХ ХЭРЭГЛЭГЧ:</span>
                    <span className="text-xs text-white/80 font-mono select-all block truncate">
                      {p.username}
                    </span>
                  </div>

                  {/* Password reveal & copy container */}
                  <div className="mt-3.5 bg-black/40 p-2 py-1.5 rounded-xl border border-white/5 flex items-center justify-between">
                    <span className="text-xs font-mono text-white/90 select-all font-semibold tracking-wider truncate mr-2">
                      {isRevealed ? p.passwordText : '••••••••••••••••'}
                    </span>

                    <div className="flex items-center space-x-1 grow-0 shrink-0">
                      <button
                        onClick={(e) => toggleReveal(p.id, e)}
                        className="p-1.5 text-white/40 hover:text-white transition"
                        title={isRevealed ? 'Нуух' : 'Харах'}
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleCopyText(p.passwordText, p.id, true)}
                        className="p-1.5 text-white/40 hover:text-white transition"
                        title="Нууц үг хуулах"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card footer: Strength Indicator & Links */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.03]">
                  {/* Password Strength */}
                  <div className="flex items-center space-x-1.5 text-[10px] font-mono">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      p.strength === 'strong' ? 'bg-emerald-500' :
                      p.strength === 'medium' ? 'bg-amber-400' :
                      'bg-rose-500 animate-pulse'
                    }`} />
                    <span className={
                      p.strength === 'strong' ? 'text-emerald-400' :
                      p.strength === 'medium' ? 'text-amber-400' :
                      'text-rose-400'
                    }>
                      {p.strength === 'strong' ? 'Хүчтэй' : p.strength === 'medium' ? 'Дундаж' : 'Сул байна!'}
                    </span>
                  </div>

                  {/* website URL */}
                  {p.websiteUrl ? (
                    <a
                      href={`https://${p.websiteUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-white/40 hover:text-white flex items-center space-x-1 hover:underline shrink-0"
                    >
                      <span className="truncate max-w-[100px]">{p.websiteUrl}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="text-[10px] font-mono text-white/10 italic">Вэб хаяггүй</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DRAWER OVERLAY: Create/Edit Credentials Dialog */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop click lock */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Body Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl p-6 md:p-8 rounded-3xl bg-[#0f0f13] shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                <div>
                  <h3 className="font-display text-lg text-white font-semibold">
                    {drawerMode === 'create' ? 'Шинэ Нууц Үг Бэлтгэх' : 'Бүртгэл Засаж Шинэчлэх'}
                  </h3>
                  <p className="text-[11px] font-mono text-white/30 uppercase tracking-widest mt-0.5">
                    AES-256 SECURED CLIENT INJECTOR
                  </p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form & Generator Combo Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form column */}
                <form onSubmit={handleSavePassword} className="space-y-4 text-left">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 pl-1">Хэрэглээний Нэр (Title)</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Жишээ: Gmail, Facebook"
                      className="block w-full bg-black/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/10 transition font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 pl-1">Хэрэглэгчийн Нэр (Username/Email)</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username эсвэл имэйл"
                      className="block w-full bg-black/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/10 transition font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 pl-1">Аюулгүй Нууц үг (Password)</label>
                    <input
                      type="text"
                      required
                      value={passwordText}
                      onChange={(e) => setPasswordText(e.target.value)}
                      placeholder="Кодоо энд оруулна уу"
                      className="block w-full bg-black/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/10 transition font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 pl-1">Вэб хаяг холбоос (Сонголтоор)</label>
                    <input
                      type="text"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="google.com"
                      className="block w-full bg-black/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/10 transition font-mono"
                    />
                  </div>

                  <div className="pt-4 flex items-center space-x-3">
                    <button
                      type="submit"
                      className={`px-5 py-2.5 rounded-xl transition cursor-pointer text-xs ${getThemeButtonClass()}`}
                    >
                      <span>Шифрлэн хадгалах</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDrawerOpen(false)}
                      className="px-4 py-2.5 bg-white/5 border border-white/5 hover:bg-white/10 text-white rounded-xl text-xs transition cursor-pointer"
                    >
                      Болих
                    </button>
                  </div>
                </form>

                {/* Generator column */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4 text-left">
                  <div className="flex items-center space-x-1.5 text-white/50 border-b border-white/5 pb-2.5">
                    <RefreshCw className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono tracking-widest font-semibold uppercase">Код Үүсгэгч (Engine)</span>
                  </div>

                  {/* Range select length */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-mono text-white/40">
                      <span>УРТ:</span>
                      <span className="text-white font-medium">{genLength} тэмдэгт</span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={32}
                      value={genLength}
                      onChange={(e) => setGenLength(Number(e.target.value))}
                      className="w-full accent-white h-1 bg-white/10 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Character checkers */}
                  <div className="space-y-2.5 font-mono text-[10px] text-white/70">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input type="checkbox" checked={genUpper} onChange={(e) => setGenUpper(e.target.checked)} className="rounded border-white/10 bg-black/40 text-emerald-500 w-3.5 h-3.5" />
                      <span>ТОМ ҮСЭГ (A-Z)</span>
                    </label>

                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input type="checkbox" checked={genLower} onChange={(e) => setGenLower(e.target.checked)} className="rounded border-white/10 bg-black/40 text-emerald-500 w-3.5 h-3.5" />
                      <span>ЖИЖИГ ҮСЭГ (a-z)</span>
                    </label>

                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input type="checkbox" checked={genNumbers} onChange={(e) => setGenNumbers(e.target.checked)} className="rounded border-white/10 bg-black/40 text-emerald-500 w-3.5 h-3.5" />
                      <span>ТООНУУД (0-9)</span>
                    </label>

                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input type="checkbox" checked={genSymbols} onChange={(e) => setGenSymbols(e.target.checked)} className="rounded border-white/10 bg-black/40 text-emerald-500 w-3.5 h-3.5" />
                      <span>ТУСГАЙ ТЭМДЭГТҮҮД (!@#)</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-mono transition cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Санамсаргүй Нууц үг гаргах</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
