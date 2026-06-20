/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, FileText, KeyRound, Sparkles, Star, Archive, Settings,
  ShieldCheck, LogOut, ChevronLeft, ChevronRight, User, Search
} from 'lucide-react';

import { Note, PasswordEntry, AIPrompt, VaultLog, VaultTab, VaultTheme, VaultUser } from '@/types';
import OverviewTab from './OverviewTab';
import NotesTab from './NotesTab';
import PasswordsTab from './PasswordsTab';
import PromptsTab from './PromptsTab';
import FavoritesTab from './FavoritesTab';
import ArchiveTab from './ArchiveTab';
import SettingsTab from './SettingsTab';
import CommandPalette from './CommandPalette';
import { useConfirm } from './ConfirmProvider';
import { useToast } from './ToastProvider';
import { encryptVault, decryptVault } from '@/lib/crypto-client';

interface DashboardProps {
  user: VaultUser;
  notes: Note[];
  passwords: PasswordEntry[];
  prompts: AIPrompt[];
  logs: VaultLog[];
  theme: VaultTheme;
  setTheme: (t: VaultTheme) => void;
  onUpdateAppStore: (
    updatedNotes: Note[], 
    updatedPasswords: PasswordEntry[], 
    updatedPrompts: AIPrompt[], 
    updatedLogs: VaultLog[],
    logMsg?: string
  ) => void;
  onLogOut: () => void;
  onClearAllData: () => void;
  onLock: () => void;
  onChangePassphrase: (current: string, next: string) => Promise<void>;
  autoLockMin: number;
  setAutoLockMin: (m: number) => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  encKey: CryptoKey | null;
}

export default function Dashboard({
  user,
  notes,
  passwords,
  prompts,
  logs,
  theme,
  setTheme,
  onUpdateAppStore,
  onLogOut,
  onClearAllData,
  onLock,
  onChangePassphrase,
  autoLockMin,
  setAutoLockMin,
  saveStatus,
  encKey
}: DashboardProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<VaultTab>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Ctrl/⌘+K opens the global search palette; Esc closes it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Helper custom state writers
  const handleUpdateNotes = (updated: Note[], logMsg: string) => {
    const timeNow = new Date().toISOString();
    const newLog: VaultLog = {
      id: `log-${Date.now()}`,
      action: 'UPDATE_NOTES',
      type: 'security',
      timestamp: timeNow,
      details: logMsg
    };
    onUpdateAppStore(updated, passwords, prompts, [newLog, ...logs], logMsg);
  };

  const handleUpdatePasswords = (updated: PasswordEntry[], logMsg: string) => {
    const timeNow = new Date().toISOString();
    const newLog: VaultLog = {
      id: `log-${Date.now()}`,
      action: 'UPDATE_PASSWORDS',
      type: 'security',
      timestamp: timeNow,
      details: logMsg
    };
    onUpdateAppStore(notes, updated, prompts, [newLog, ...logs], logMsg);
  };

  const handleUpdatePrompts = (updated: AIPrompt[], logMsg: string) => {
    const timeNow = new Date().toISOString();
    const newLog: VaultLog = {
      id: `log-${Date.now()}`,
      action: 'UPDATE_PROMPTS',
      type: 'system',
      timestamp: timeNow,
      details: logMsg
    };
    onUpdateAppStore(notes, passwords, updated, [newLog, ...logs], logMsg);
  };

  const handleRestoreItem = (id: string, type: 'note' | 'password' | 'prompt') => {
    if (type === 'note') {
      const updated = notes.map(n => n.id === id ? { ...n, isArchived: false } : n);
      handleUpdateNotes(updated, `Архиваас тэмдэглэл сэргээв: ID ${id}`);
    } else if (type === 'password') {
      const updated = passwords.map(p => p.id === id ? { ...p, isArchived: false } : p);
      handleUpdatePasswords(updated, `Архиваас нууц үг сэргээв: ID ${id}`);
    } else if (type === 'prompt') {
      const updated = prompts.map(pr => pr.id === id ? { ...pr, isArchived: false } : pr);
      handleUpdatePrompts(updated, `Архиваас AI промпт сэргээв: ID ${id}`);
    }
  };

  const handleDeletePermanent = async (id: string, type: 'note' | 'password' | 'prompt') => {
    const ok = await confirm({
      title: 'Бүрмөсөн устгах',
      message: 'Та үүнийг сэргээх боломжгүйгээр бүрмөсөн устгах уу?',
      confirmText: 'Устгах',
      danger: true,
    });
    if (!ok) return;

    if (type === 'note') {
      const updated = notes.filter(n => n.id !== id);
      handleUpdateNotes(updated, `Тэмдэглэл бүрмөсөн устгав: ID ${id}`);
    } else if (type === 'password') {
      const updated = passwords.filter(p => p.id !== id);
      handleUpdatePasswords(updated, `Нууц үг бүрмөсөн устгав: ID ${id}`);
    } else if (type === 'prompt') {
      const updated = prompts.filter(p => p.id !== id);
      handleUpdatePrompts(updated, `AI промпт бүрмөсөн устгав: ID ${id}`);
    }
  };

  // Encrypted backup: the file holds only AES-GCM ciphertext, decryptable with
  // the same vault passphrase (i.e. while signed in to this account).
  const handleExportBackup = async () => {
    if (!encKey) return;
    try {
      const blob = await encryptVault(encKey, { notes, passwords, prompts });
      const file = {
        app: 'tzeedek-note',
        version: 1,
        exportedAt: new Date().toISOString(),
        email: user.email,
        iv: blob.iv,
        ciphertext: blob.ciphertext,
      };
      const href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(file, null, 2));
      const a = document.createElement('a');
      a.setAttribute('href', href);
      a.setAttribute('download', `tzeedek-note-backup-${user.email.replace(/[@.]/g, '_')}.vault.json`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast('Шифрлэгдсэн backup татагдлаа', 'success');
    } catch (err) {
      console.error('export error', err);
      toast('Backup үүсгэхэд алдаа гарлаа', 'error');
    }
  };

  const handleImportBackup = async (file: File) => {
    if (!encKey) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed?.iv || !parsed?.ciphertext) {
        toast('Буруу backup файл байна', 'error');
        return;
      }
      const data = await decryptVault<{ notes?: Note[]; passwords?: PasswordEntry[]; prompts?: AIPrompt[] }>(
        encKey,
        { iv: parsed.iv, ciphertext: parsed.ciphertext },
      );
      const rand = () => Math.random().toString(36).slice(2, 8);
      const importedNotes = (data.notes || []).map((n) => ({ ...n, id: `note-${Date.now()}-${rand()}` }));
      const importedPasswords = (data.passwords || []).map((p) => ({ ...p, id: `pass-${Date.now()}-${rand()}` }));
      const importedPrompts = (data.prompts || []).map((p) => ({ ...p, id: `prompt-${Date.now()}-${rand()}` }));
      const count = importedNotes.length + importedPasswords.length + importedPrompts.length;

      const importLog: VaultLog = {
        id: `log-${Date.now()}`,
        action: 'IMPORT',
        type: 'system',
        timestamp: new Date().toISOString(),
        details: `Backup-аас ${count} зүйл сэргээв`,
      };

      onUpdateAppStore(
        [...importedNotes, ...notes],
        [...importedPasswords, ...passwords],
        [...importedPrompts, ...prompts],
        [importLog, ...logs],
        'Backup сэргээв',
      );
      toast(`Сэргээлээ: ${count} зүйл нэмэгдлээ`, 'success');
    } catch (err) {
      console.error('import error', err);
      toast('Тайлж чадсангүй — backup өөр нууц үгээр шифрлэгдсэн байж магадгүй', 'error');
    }
  };

  const getThemeTextClass = () => {
    switch (theme) {
      case 'emerald': return 'text-emerald-400';
      case 'voltage': return 'text-sky-400';
      case 'indigo': return 'text-violet-400';
      case 'minimal':
      default: return 'text-slate-400';
    }
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'notes', label: 'Тэмдэглэл', icon: FileText },
    { id: 'passwords', label: 'Нууц үг', icon: KeyRound },
    { id: 'prompts', label: 'AI Prompt', icon: Sparkles },
    { id: 'favorites', label: 'Дуртай', icon: Star },
    { id: 'archive', label: 'Архив', icon: Archive },
    { id: 'settings', label: 'Тохиргоо', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden p-3 md:p-4 bg-transparent text-white font-sans">
      
      {/* DESKTOP SIDEBAR */}
      <motion.aside
        animate={{ width: isSidebarCollapsed ? 80 : 260 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex flex-col justify-between glass-panel border border-white/5 rounded-2xl h-full p-4 relative shrink-0 z-20 overflow-hidden bg-black/60"
      >
        <div className="space-y-6">
          {/* Header branding lock */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} border-b border-white/5 pb-4 px-1`}>
            {!isSidebarCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-left">
                <h2 className="font-display text-md font-semibold tracking-wider text-white">
                  tzeedek<span className={getThemeTextClass()}>-note</span>
                </h2>
                <span className="text-[8px] font-mono tracking-[0.15em] text-white/30 uppercase">SECURITY DESK</span>
              </motion.div>
            )}

            {/* Collapse Trigger arrow absolute button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition cursor-pointer"
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Links list */}
          <nav className="space-y-1.5">
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as VaultTab)}
                  className={`w-full flex items-center py-2.5 px-3 rounded-xl transition cursor-pointer relative ${
                    isActive 
                      ? 'bg-white/10 text-white font-medium border border-white/10' 
                      : 'text-white/50 hover:text-white/90 hover:bg-white/[0.03]'
                  } ${isSidebarCollapsed ? 'justify-center' : 'justify-start space-x-3'}`}
                  title={item.label}
                >
                  <Icon className={`w-4 h-4 ${isActive ? getThemeTextClass() : ''}`} />
                  {!isSidebarCollapsed && (
                    <motion.span 
                      initial={{ opacity: 0, x: -5 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      className="text-xs tracking-wide"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User info panel */}
        <div className="space-y-4 border-t border-white/5 pt-4">
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'} bg-black/40 p-2 rounded-xl border border-white/5`}>
            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-white/60" />
            </div>
            {!isSidebarCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-left overflow-hidden grow pr-1">
                <span className="text-[10px] font-mono text-white/45 truncate block leading-none">{user.email}</span>
                <span className="text-[8px] font-mono text-emerald-400 mt-1 uppercase tracking-widest block font-bold">CLIENT SYNC</span>
              </motion.div>
            )}
          </div>

          <button
            onClick={onLock}
            className={`w-full flex items-center py-2 px-3 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 rounded-xl transition cursor-pointer border border-transparent hover:border-rose-500/15 ${
              isSidebarCollapsed ? 'justify-center' : 'justify-start space-x-3'
            }`}
            title="Сейфийг түгжих"
          >
            <LogOut className="w-4 h-4" />
            {!isSidebarCollapsed && <span className="text-xs font-medium">Түгжих</span>}
          </button>
        </div>
      </motion.aside>

      {/* MOBILE TOP BAR: brand + quick views + lock (navigation lives at the bottom) */}
      <div className="md:hidden fixed top-3 left-3 right-3 h-14 glass-panel border border-white/5 bg-black/80 rounded-xl flex items-center justify-between pl-4 pr-2 z-40">
        <h2 className="font-display text-sm font-semibold tracking-wider text-white">
          tzeedek<span className={getThemeTextClass()}>-note</span>
        </h2>
        <div className="flex items-center space-x-0.5">
          <button
            onClick={() => setPaletteOpen(true)}
            className="p-2 rounded-lg text-white/50 hover:text-white transition"
            title="Хайх"
          >
            <Search className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`p-2 rounded-lg transition ${activeTab === 'favorites' ? `bg-white/10 ${getThemeTextClass()}` : 'text-white/50 hover:text-white'}`}
            title="Дуртай"
          >
            <Star className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`p-2 rounded-lg transition ${activeTab === 'archive' ? `bg-white/10 ${getThemeTextClass()}` : 'text-white/50 hover:text-white'}`}
            title="Архив"
          >
            <Archive className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={onLock}
            className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
            title="Сейфийг түгжих"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* STAGE AREA: Rendering Active Tabs with Transition Animations */}
      <main className="grow flex flex-col h-full overflow-hidden relative md:pl-4 pt-16 pb-20 md:pt-0 md:pb-0">
        
        {/* Top Header line detailing cryptographic connection status */}
        <div className="hidden md:flex justify-between items-center py-2 mb-4 border-b border-white/[0.04] px-1 z-10 shrink-0">
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-white/35">ОРЧИН:</span>
            <span className="text-white/70 font-semibold">[ ЛОКАЛ САНДБОКС ]</span>
            {saveStatus !== 'idle' && (
              <span
                className={`flex items-center gap-1.5 ${
                  saveStatus === 'error' ? 'text-rose-400' : saveStatus === 'saved' ? 'text-emerald-400' : 'text-white/40'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    saveStatus === 'error' ? 'bg-rose-400' : saveStatus === 'saved' ? 'bg-emerald-400' : 'bg-white/40 animate-pulse'
                  }`}
                />
                {saveStatus === 'saving' ? 'Хадгалж байна…' : saveStatus === 'saved' ? 'Хадгалагдлаа' : 'Хадгалах алдаа'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 hover:text-white/80 text-[11px] font-mono transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Хайх</span>
              <kbd className="text-[9px] border border-white/10 rounded px-1">⌘K</kbd>
            </button>
            <div className="flex items-center space-x-1 bg-emerald-500/[0.04] px-3 py-1 rounded-full border border-emerald-500/10 text-[10px] font-mono tracking-wider text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5 object-contain" />
              <span>AES-256 CODER KEY DERIVATION SECURED</span>
            </div>
          </div>
        </div>

        {/* Stage Component Box */}
        <div className="grow overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 h-full w-full overflow-y-auto pr-1"
            >
              {activeTab === 'overview' && (
                <OverviewTab 
                  notes={notes}
                  passwords={passwords}
                  prompts={prompts}
                  logs={logs}
                  theme={theme}
                  onCreateShortcut={(t) => {
                    setActiveTab(t === 'note' ? 'notes' : t === 'password' ? 'passwords' : 'prompts');
                  }}
                />
              )}
              {activeTab === 'notes' && (
                <NotesTab 
                  notes={notes}
                  onUpdateNotes={handleUpdateNotes}
                  theme={theme}
                />
              )}
              {activeTab === 'passwords' && (
                <PasswordsTab 
                  passwords={passwords}
                  onUpdatePasswords={handleUpdatePasswords}
                  theme={theme}
                />
              )}
              {activeTab === 'prompts' && (
                <PromptsTab 
                  prompts={prompts}
                  onUpdatePrompts={handleUpdatePrompts}
                  theme={theme}
                />
              )}
              {activeTab === 'favorites' && (
                <FavoritesTab 
                  notes={notes}
                  passwords={passwords}
                  prompts={prompts}
                  theme={theme}
                  onNavigateTab={(tab) => {
                    setActiveTab(tab as VaultTab);
                  }}
                />
              )}
              {activeTab === 'archive' && (
                <ArchiveTab 
                  notes={notes}
                  passwords={passwords}
                  prompts={prompts}
                  theme={theme}
                  onRestoreItem={handleRestoreItem}
                  onDeletePermanentItem={handleDeletePermanent}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsTab 
                  user={user}
                  theme={theme}
                  setTheme={setTheme}
                  onClearAllData={onClearAllData}
                  onLogOut={onLogOut}
                  onExportBackup={handleExportBackup}
                  onImportBackup={handleImportBackup}
                  onChangePassphrase={onChangePassphrase}
                  autoLockMin={autoLockMin}
                  setAutoLockMin={setAutoLockMin}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>

      {/* MOBILE BOTTOM NAVIGATION (app-style tab bar) */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 h-16 glass-panel border border-white/10 bg-black/85 rounded-2xl flex items-center justify-around px-1 z-40">
        {sidebarItems
          .filter((i) => ['overview', 'notes', 'passwords', 'prompts', 'settings'].includes(i.id))
          .map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as VaultTab)}
                className="flex flex-col items-center justify-center gap-1 w-[19%] py-1.5 rounded-xl transition active:scale-95"
              >
                <Icon className={`w-5 h-5 transition ${isActive ? getThemeTextClass() : 'text-white/40'}`} />
                <span className={`text-[9px] font-mono tracking-tight whitespace-nowrap ${isActive ? 'text-white/85' : 'text-white/35'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
      </nav>

      {/* Global search (Ctrl/⌘+K) */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        notes={notes}
        passwords={passwords}
        prompts={prompts}
        onNavigate={(tab) => setActiveTab(tab)}
      />

    </div>
  );
}
