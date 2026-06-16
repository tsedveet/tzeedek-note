/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Star, Notebook, Key, Sparkles, FileText, ChevronRight, Eye, Copy, ArrowUpRight } from 'lucide-react';
import { Note, PasswordEntry, AIPrompt, VaultTheme } from '../types';

interface FavoritesTabProps {
  notes: Note[];
  passwords: PasswordEntry[];
  prompts: AIPrompt[];
  theme: VaultTheme;
  onNavigateTab: (tab: 'notes' | 'passwords' | 'prompts') => void;
}

export default function FavoritesTab({ notes, passwords, prompts, theme, onNavigateTab }: FavoritesTabProps) {
  const favoriteNotes = notes.filter(n => n.isFavorite && !n.isArchived);
  const favoritePasswords = passwords.filter(p => p.isFavorite && !p.isArchived);
  const favoritePrompts = prompts.filter(p => p.isFavorite && !p.isArchived);

  const totalFavs = favoriteNotes.length + favoritePasswords.length + favoritePrompts.length;

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
          ОНЦЛОХ ТҮЛХҮҮРҮҮД
        </span>
        <h1 className="text-3xl font-display font-light text-white tracking-tight mt-1">
          Дуртай <span className="font-medium">зүйлс</span>
        </h1>
      </div>

      {totalFavs === 0 ? (
        <div className="glass-panel p-20 rounded-3xl text-center space-y-4 max-w-lg mx-auto bg-black/20 mt-10">
          <Star className="w-12 h-12 text-white/10 mx-auto animate-pulse" />
          <div className="space-y-1">
            <h4 className="text-md text-white/70 font-display">Дуртай зүйлс одоогоор алга</h4>
            <p className="text-xs text-white/35 font-mono max-w-xs mx-auto">
              Та дурын тэмдэглэл, нууц үг эсвэл промпт хуудаснаас од дарж энэхүү түргэн дуудлагын самбарт нэмээрэй.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Notes favorited */}
          {favoriteNotes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs font-mono tracking-widest text-white/50 uppercase flex items-center gap-1.5 font-semibold">
                  <Notebook className="w-4 h-4 text-emerald-400" /> Онцлох тэмдэглэлүүд ({favoriteNotes.length})
                </h3>
                <button
                  onClick={() => onNavigateTab('notes')}
                  className="text-white/40 hover:text-white text-xs font-mono flex items-center space-x-1 hover:underline cursor-pointer"
                >
                  <span>Бүгдийг харах</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteNotes.map(n => (
                  <div
                    key={n.id}
                    onClick={() => onNavigateTab('notes')}
                    className="glass-panel p-5 rounded-2xl bg-black/40 border border-white/5 cursor-pointer glass-panel-hover text-left flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="text-sm font-medium text-white truncate">{n.title}</h4>
                      <p className="text-xs text-white/40 mt-2 line-clamp-2">{n.content.replace(/[#*_\-\[\]]/g, '')}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/[0.03] flex justify-between items-center">
                      <span className="text-[10px] font-mono text-white/30">{new Date(n.updatedAt).toLocaleDateString()}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">NOTE</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Passwords favorited */}
          {favoritePasswords.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs font-mono tracking-widest text-white/50 uppercase flex items-center gap-1.5 font-semibold">
                  <Key className="w-4 h-4 text-sky-400" /> Онцлох нууц үгүүд ({favoritePasswords.length})
                </h3>
                <button
                  onClick={() => onNavigateTab('passwords')}
                  className="text-white/40 hover:text-white text-xs font-mono flex items-center space-x-1 hover:underline cursor-pointer"
                >
                  <span>Бүгдийг харах</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoritePasswords.map(p => (
                  <div
                    key={p.id}
                    onClick={() => onNavigateTab('passwords')}
                    className="glass-panel p-5 rounded-2xl bg-black/40 border border-white/5 cursor-pointer glass-panel-hover text-left"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium text-white truncate">{p.title}</h4>
                        <span className="text-[11px] font-mono text-white/40 block mt-1 truncate">{p.username}</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">PASSWORD</span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/[0.03] flex justify-between items-center text-[10px] font-mono text-white/30">
                      <span>СҮҮЛД: {new Date(p.updatedAt).toLocaleDateString()}</span>
                      <span className="text-emerald-400">[ SECURED ]</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prompts favorited */}
          {favoritePrompts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs font-mono tracking-widest text-white/50 uppercase flex items-center gap-1.5 font-semibold">
                  <Sparkles className="w-4 h-4 text-violet-400" /> Онцлох AI промптууд ({favoritePrompts.length})
                </h3>
                <button
                  onClick={() => onNavigateTab('prompts')}
                  className="text-white/40 hover:text-white text-xs font-mono flex items-center space-x-1 hover:underline cursor-pointer"
                >
                  <span>Бүгдийг харах</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoritePrompts.map(pr => (
                  <div
                    key={pr.id}
                    onClick={() => onNavigateTab('prompts')}
                    className="glass-panel p-5 rounded-2xl bg-black/40 border border-white/5 cursor-pointer glass-panel-hover text-left flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="text-sm font-medium text-white truncate max-w-[130px]">{pr.title}</h4>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 shrink-0">{pr.category}</span>
                      </div>
                      <p className="text-xs text-white/40 mt-2 line-clamp-2">{pr.description}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/[0.03] text-[10px] font-mono text-white/30">
                      <span>PROMPT ENTIRE</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
