/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Archive, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';
import { Note, PasswordEntry, AIPrompt, VaultTheme } from '../types';

interface ArchiveTabProps {
  notes: Note[];
  passwords: PasswordEntry[];
  prompts: AIPrompt[];
  theme: VaultTheme;
  onRestoreItem: (id: string, type: 'note' | 'password' | 'prompt') => void;
  onDeletePermanentItem: (id: string, type: 'note' | 'password' | 'prompt') => void;
}

export default function ArchiveTab({ notes, passwords, prompts, theme, onRestoreItem, onDeletePermanentItem }: ArchiveTabProps) {
  const archivedNotes = notes.filter(n => n.isArchived);
  const archivedPasswords = passwords.filter(p => p.isArchived);
  const archivedPrompts = prompts.filter(p => p.isArchived);

  const totalArchived = archivedNotes.length + archivedPasswords.length + archivedPrompts.length;

  const getThemeTextClass = () => {
    switch (theme) {
      case 'emerald': return 'text-emerald-400';
      case 'voltage': return 'text-sky-400';
      case 'indigo': return 'text-violet-400';
      case 'minimal':
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6 pb-10 text-left">
      <div>
        <span className={`text-[10px] font-mono tracking-[0.25em] ${getThemeTextClass()} font-semibold block`}>
          ХАДГАЛАЛТЫН АР ТАЛ
        </span>
        <h1 className="text-3xl font-display font-light text-white tracking-tight mt-1">
          Сейфийн <span className="font-medium">архив</span>
        </h1>
      </div>

      {totalArchived === 0 ? (
        <div className="glass-panel p-20 rounded-3xl text-center space-y-4 max-w-lg mx-auto bg-black/20 mt-10">
          <Archive className="w-12 h-12 text-white/10 mx-auto animate-pulse" />
          <div className="space-y-1">
            <h4 className="text-md text-white/70 font-display">Архив хоосон байна</h4>
            <p className="text-xs text-white/35 font-mono max-w-xs mx-auto">
              Архивлагдсан тэмдэглэл болон хувийн бусад материалууд энд цуглах болно.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 max-w-3xl">
          
          {/* List archived items row by row */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono tracking-widest text-white/30 uppercase block">ХАДГАЛАГДСАН ЖАГСААЛТ:</span>
            
            {archivedNotes.map(n => (
              <div key={n.id} className="glass-panel p-4 rounded-xl relative flex justify-between items-center bg-black/40 border border-white/5">
                <div className="text-left space-y-1 pr-4">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase">📝 Тэмдэглэл</span>
                  <h4 className="text-sm font-medium text-white truncate max-w-[300px]">{n.title}</h4>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => onRestoreItem(n.id, 'note')}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-white/60 hover:text-white transition cursor-pointer"
                    title="Сэргээх"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeletePermanentItem(n.id, 'note')}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-rose-400 hover:text-rose-300 transition cursor-pointer"
                    title="Устгах"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {archivedPasswords.map(p => (
              <div key={p.id} className="glass-panel p-4 rounded-xl relative flex justify-between items-center bg-black/40 border border-white/5">
                <div className="text-left space-y-1 pr-4">
                  <span className="text-[10px] font-mono text-sky-400 uppercase">🔑 Нууц үг</span>
                  <h4 className="text-sm font-medium text-white truncate max-w-[300px]">{p.title}</h4>
                  <p className="text-xs text-white/30 font-mono">{p.username}</p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => onRestoreItem(p.id, 'password')}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-white/60 hover:text-white transition cursor-pointer"
                    title="Сэргээх"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeletePermanentItem(p.id, 'password')}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-rose-400 hover:text-rose-300 transition cursor-pointer"
                    title="Устгах"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {archivedPrompts.map(pr => (
              <div key={pr.id} className="glass-panel p-4 rounded-xl relative flex justify-between items-center bg-black/40 border border-white/5">
                <div className="text-left space-y-1 pr-4">
                  <span className="text-[10px] font-mono text-violet-400 uppercase">🤖 AI Промпт - {pr.category}</span>
                  <h4 className="text-sm font-medium text-white truncate max-w-[300px]">{pr.title}</h4>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => onRestoreItem(pr.id, 'prompt')}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-white/60 hover:text-white transition cursor-pointer"
                    title="Сэргээх"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeletePermanentItem(pr.id, 'prompt')}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-rose-400 hover:text-rose-300 transition cursor-pointer"
                    title="Устгах"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

          </div>
        </div>
      )}

    </div>
  );
}
