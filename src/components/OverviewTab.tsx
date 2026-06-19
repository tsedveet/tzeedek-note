/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Shield, Notebook, Key, Sparkles, Clock, AlertTriangle, Terminal, ChevronRight } from 'lucide-react';
import { Note, PasswordEntry, AIPrompt, VaultLog, VaultTheme } from '../types';

interface OverviewTabProps {
  notes: Note[];
  passwords: PasswordEntry[];
  prompts: AIPrompt[];
  logs: VaultLog[];
  theme: VaultTheme;
  onCreateShortcut: (type: 'note' | 'password' | 'prompt') => void;
}

export default function OverviewTab({ notes, passwords, prompts, logs, theme, onCreateShortcut }: OverviewTabProps) {
  const activeNotes = notes.filter(n => !n.isArchived).length;
  const activePasswords = passwords.filter(p => !p.isArchived).length;
  const activePrompts = prompts.filter(p => !p.isArchived).length;

  const totalItems = activeNotes + activePasswords + activePrompts;

  // Real security-health assessment from the user's actual passwords.
  const activePw = passwords.filter(p => !p.isArchived);
  const hasPasswords = activePw.length > 0;
  const weakPasswordsCount = activePw.filter(p => p.strength === 'weak').length;
  const mediumPasswordsCount = activePw.filter(p => p.strength === 'medium').length;
  const pwCounts = new Map<string, number>();
  activePw.forEach(p => pwCounts.set(p.passwordText, (pwCounts.get(p.passwordText) || 0) + 1));
  const reusedPasswordsCount = activePw.filter(p => (pwCounts.get(p.passwordText) || 0) > 1).length;

  const securityHealthScore = hasPasswords
    ? Math.max(0, Math.min(100, 100 - weakPasswordsCount * 20 - mediumPasswordsCount * 8 - reusedPasswordsCount * 12))
    : 0;

  const scoreHex = !hasPasswords
    ? '#52525b'
    : securityHealthScore >= 80 ? '#10B981' : securityHealthScore >= 50 ? '#F59E0B' : '#F43F5E';
  const scoreTextClass = !hasPasswords
    ? 'text-white/40'
    : securityHealthScore >= 80 ? 'text-emerald-400' : securityHealthScore >= 50 ? 'text-amber-400' : 'text-rose-400';

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
      case 'emerald': return 'border-emerald-500/15';
      case 'voltage': return 'border-sky-500/15';
      case 'indigo': return 'border-violet-500/15';
      case 'minimal':
      default: return 'border-slate-500/15';
    }
  };

  const getThemeGlowClass = () => {
    switch (theme) {
      case 'emerald': return 'glow-emerald';
      case 'voltage': return 'glow-voltage';
      case 'indigo': return 'glow-indigo';
      case 'minimal':
      default: return '';
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Top Banner introducing system state */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className={`text-[10px] font-mono tracking-[0.25em] ${getThemeTextClass()} font-semibold block`}>
            СЕЙФИЙН ҮНДСЭН ХЯНАЛТ
          </span>
          <h1 className="text-3xl font-display font-light text-white tracking-tight mt-1">
            Команд <span className="font-medium">төв</span>
          </h1>
        </div>
        
        {/* Simple Time Card */}
        <div className="flex items-center space-x-3 bg-white/[0.03] border border-white/5 py-2 px-4 rounded-xl font-mono text-xs text-white/60">
          <Clock className="w-4 h-4 text-white/30" />
          <span>СЕЙФИЙН ХУГАЦАА: 2026-06-15</span>
        </div>
      </div>

      {/* Grid of primary high-tech key stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total stats item */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-mono tracking-widest text-white/40 uppercase">МЭДЭЭЛЭЛ СЕЙФТ</span>
            <div className="w-8 h-8 rounded-lg glass-panel border border-white/10 flex items-center justify-center">
              <Shield className={`w-4 h-4 ${getThemeTextClass()}`} />
            </div>
          </div>
          <div>
            <span className="text-4xl font-display font-light text-white leading-none block">
              {totalItems}
            </span>
            <span className="text-xs text-white/40 mt-1 block">Нийт хадгалагдсан зүйлс</span>
          </div>
        </div>

        {/* Notes counter */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[140px] glass-panel-hover cursor-pointer" onClick={() => onCreateShortcut('note')}>
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-mono tracking-widest text-white/40 uppercase">ТЭМДЭГЛЭЛ</span>
            <div className="w-8 h-8 rounded-lg glass-panel border border-white/10 flex items-center justify-center">
              <Notebook className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-4xl font-display font-light text-white leading-none block">
                {activeNotes}
              </span>
              <span className="text-xs text-white/40 font-mono">+ Үүсгэх</span>
            </div>
            <span className="text-xs text-white/40 mt-1 block">Шифрлэгдсэн тэмдэглэл</span>
          </div>
        </div>

        {/* Passwords counter */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[140px] glass-panel-hover cursor-pointer" onClick={() => onCreateShortcut('password')}>
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-mono tracking-widest text-white/40 uppercase font-mono">НУУЦ ҮГҮҮД</span>
            <div className="w-8 h-8 rounded-lg glass-panel border border-white/10 flex items-center justify-center">
              <Key className="w-4 h-4 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-4xl font-display font-light text-white leading-none block">
                {activePasswords}
              </span>
              <span className="text-xs text-white/40 font-mono">+ Үүсгэх</span>
            </div>
            <span className="text-xs text-white/40 mt-1 block">Аюулгүй нууц үгсийн бүртгэл</span>
          </div>
        </div>

        {/* AI Prompts counter */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[140px] glass-panel-hover cursor-pointer" onClick={() => onCreateShortcut('prompt')}>
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-mono tracking-widest text-white/40 uppercase font-mono">AI ПРОМПТ</span>
            <div className="w-8 h-8 rounded-lg glass-panel border border-white/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-4xl font-display font-light text-white leading-none block">
                {activePrompts}
              </span>
              <span className="text-xs text-white/40 font-mono">+ Нэмэх</span>
            </div>
            <span className="text-xs text-white/40 mt-1 block">AI загварчлалууд хадгалсан</span>
          </div>
        </div>
      </div>

      {/* Main core layout: Dial Score (Security evaluation) and activity logs terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Storage status & Security Assessment Circle */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-3xl flex flex-col justify-between bg-black/40 min-h-[360px]">
          <div>
            <span className="text-xs font-mono text-white/40 tracking-wider block">НУУЦЛАЛЫН ҮНЭЛГЭЭ</span>
            <h3 className="text-md text-white font-medium tracking-tight mt-1">Системийн Эрүүл Мэнд</h3>
          </div>

          {/* Interactive Circle visual assessment */}
          <div className="my-6 flex flex-col items-center justify-center relative">
            <div className="relative flex items-center justify-center w-40 h-40">
              {/* Outer pulsing ring */}
              <div className={`absolute inset-0 rounded-full border border-dashed opacity-25 animate-spin-reverse ${getThemeBorderClass()}`} style={{ animationDuration: '30s' }} />
              
              {/* Radial gradient backing the score */}
              <div className="absolute inset-4 rounded-full bg-black/50 border border-white/5 flex flex-col items-center justify-center z-10 shadow-inner">
                {hasPasswords ? (
                  <>
                    <span className={`text-3xl font-display font-medium tracking-tight ${scoreTextClass}`}>{securityHealthScore}%</span>
                    <span className="text-[9px] font-mono text-white/30 tracking-widest mt-0.5">
                      {securityHealthScore >= 80 ? 'SECURE' : securityHealthScore >= 50 ? 'OK' : 'RISK'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-display font-light text-white/40">—</span>
                    <span className="text-[8px] font-mono text-white/30 tracking-widest mt-1 text-center px-2">НУУЦ ҮГ АЛГА</span>
                  </>
                )}
              </div>

              {/* Dynamic SVG Ring tracker */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="rgba(255, 255, 255, 0.02)"
                  strokeWidth="5"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke={scoreHex}
                  strokeWidth="5"
                  strokeDasharray={`${(hasPasswords ? securityHealthScore : 0) * 2.63} 1000`}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-1000 opacity-80"
                />
              </svg>
            </div>
          </div>

          <div className="space-y-2.5 bg-black/30 p-3.5 rounded-xl border border-white/5 text-xs text-white/60">
            <div className="flex items-center justify-between">
              <span className="font-mono">AES Зэрэглэл:</span>
              <span className="text-emerald-400 font-semibold">[ ИДЭВХТЭЙ ]</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono">Нийт нууц үг:</span>
              <span className="text-white/70 font-semibold">{activePw.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono">Сул нууц үг:</span>
              <span className={weakPasswordsCount > 0 ? 'text-rose-400 font-semibold animate-pulse' : 'text-white/40'}>
                {weakPasswordsCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono">Дундаж хүч:</span>
              <span className={mediumPasswordsCount > 0 ? 'text-amber-400/80 font-semibold' : 'text-white/40'}>
                {mediumPasswordsCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono">Давхардсан:</span>
              <span className={reusedPasswordsCount > 0 ? 'text-amber-400 font-semibold' : 'text-white/40'}>
                {reusedPasswordsCount}
              </span>
            </div>
          </div>
        </div>

        {/* Security Logs Hacker-CLI Terminal Console */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-3xl bg-black/45 flex flex-col justify-between min-h-[360px] relative">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-mono text-white/40 tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" /> ХАМГААЛАЛТЫН ТҮЛХҮҮР БҮРТГЭЛҮҮД
              </span>
              <h3 className="text-md text-white font-medium tracking-tight mt-1">Клиент Сейфийн Логууд</h3>
            </div>
            <div className="font-mono text-[10px] text-white/30">
              AUDIT TRAIL
            </div>
          </div>

          {/* Holographic system rows */}
          <div className="my-4 grow overflow-y-auto max-h-[220px] pr-2 space-y-2.5 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-white/20 italic py-10 text-center">Одоогоор идэвхтэй үйлдэл бүртгэгдээгүй байна...</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex flex-col md:flex-row md:items-start md:space-x-4 p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:border-white/10 transition">
                  <div className="flex justify-between md:block shrink-0">
                    <span className="text-[10px] text-white/40 block">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-bold inline-block md:mt-1 ${
                      log.type === 'security' ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20' :
                      log.type === 'auth' ? 'bg-sky-400/10 text-sky-300 border border-sky-400/20' :
                      log.type === 'decrypt' ? 'bg-violet-400/10 text-violet-300 border border-violet-400/20' :
                      'bg-slate-400/10 text-slate-300 border border-slate-400/20'
                    }`}>
                      {log.action}
                    </span>
                  </div>
                  <div className="text-white/80 text-xs break-all mt-1.5 md:mt-0">
                    {log.details}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Interactive tips footer */}
          <div className="bg-white/[0.02] p-3 rounded-2xl border border-white/5 flex items-center justify-between text-xs text-white/55">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Зөвлөмж: Олон сувгаар ижил нууц үг бүү ашиглаарай.</span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
