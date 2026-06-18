/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Ctrl/⌘+K command palette: search across notes, passwords and prompts, or
 * jump to any section. Selecting a result navigates to its tab.
 */

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, FileText, KeyRound, Sparkles, CornerDownLeft } from 'lucide-react';
import { Note, PasswordEntry, AIPrompt, VaultTab } from '@/types';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  notes: Note[];
  passwords: PasswordEntry[];
  prompts: AIPrompt[];
  onNavigate: (tab: VaultTab) => void;
}

interface Result {
  key: string;
  tab: VaultTab;
  type: 'note' | 'password' | 'prompt';
  title: string;
  subtitle: string;
}

const QUICK: [VaultTab, string][] = [
  ['overview', 'Overview'],
  ['notes', 'Тэмдэглэл'],
  ['passwords', 'Нууц үг'],
  ['prompts', 'AI Prompt'],
  ['favorites', 'Дуртай'],
  ['archive', 'Архив'],
  ['settings', 'Тохиргоо'],
];

export default function CommandPalette({ open, onClose, notes, passwords, prompts, onNavigate }: CommandPaletteProps) {
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const out: Result[] = [];
    notes
      .filter((n) => !n.isArchived)
      .forEach((n) => {
        if (n.title.toLowerCase().includes(term) || n.content.toLowerCase().includes(term))
          out.push({ key: `note-${n.id}`, tab: 'notes', type: 'note', title: n.title || 'Гарчиггүй тэмдэглэл', subtitle: 'Тэмдэглэл' });
      });
    passwords
      .filter((p) => !p.isArchived)
      .forEach((p) => {
        if (p.title.toLowerCase().includes(term) || p.username.toLowerCase().includes(term))
          out.push({ key: `pw-${p.id}`, tab: 'passwords', type: 'password', title: p.title, subtitle: p.username });
      });
    prompts
      .filter((p) => !p.isArchived)
      .forEach((p) => {
        if (
          p.title.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.promptText.toLowerCase().includes(term)
        )
          out.push({ key: `pr-${p.id}`, tab: 'prompts', type: 'prompt', title: p.title, subtitle: p.category });
      });
    return out.slice(0, 12);
  }, [q, notes, passwords, prompts]);

  const go = (tab: VaultTab) => {
    onNavigate(tab);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[95] flex items-start justify-center p-4 pt-[12vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl rounded-2xl bg-[#0f0f13] border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5">
              <Search className="w-4 h-4 text-white/30 shrink-0" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Тэмдэглэл, нууц үг, промпт хайх…"
                className="grow bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
              />
              <kbd className="text-[10px] font-mono text-white/30 border border-white/10 rounded px-1.5 py-0.5 shrink-0">ESC</kbd>
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-2">
              {q.trim() === '' ? (
                <div className="px-2 py-1">
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest px-2">Хурдан очих</span>
                  <div className="mt-1.5 space-y-0.5">
                    {QUICK.map(([tab, label]) => (
                      <button
                        key={tab}
                        onClick={() => go(tab)}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-white transition cursor-pointer"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-white/30 font-mono">Илэрц олдсонгүй</div>
              ) : (
                results.map((r) => {
                  const Icon = r.type === 'note' ? FileText : r.type === 'password' ? KeyRound : Sparkles;
                  return (
                    <button
                      key={r.key}
                      onClick={() => go(r.tab)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition text-left group cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-white/40 shrink-0" />
                      <div className="min-w-0 grow">
                        <div className="text-sm text-white truncate">{r.title}</div>
                        <div className="text-[11px] text-white/35 truncate">{r.subtitle}</div>
                      </div>
                      <CornerDownLeft className="w-3.5 h-3.5 text-white/20 opacity-0 group-hover:opacity-100 transition shrink-0" />
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
