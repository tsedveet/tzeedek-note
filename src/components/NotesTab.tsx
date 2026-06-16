/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Pin, Star, Archive, Trash2, Edit3, Eye, FileText, ChevronRight, X, Sparkles } from 'lucide-react';
import { Note, VaultTheme } from '../types';
import { useConfirm } from './ConfirmProvider';

interface NotesTabProps {
  notes: Note[];
  onUpdateNotes: (updated: Note[], logMsg: string) => void;
  theme: VaultTheme;
}

export default function NotesTab({ notes, onUpdateNotes, theme }: NotesTabProps) {
  const confirm = useConfirm();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(notes[0]?.id || null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // New Note staging state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');

  // Find selected note
  const activeNote = notes.find(n => n.id === selectedNoteId);

  // Filter notes to display (active, matches search, matches tag)
  const filteredNotes = notes.filter(n => {
    if (n.isArchived) return false;
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? n.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  // Sort notes: pinned go first, then newest first
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Unique tags list for filter chip rendering
  const allTags = Array.from(new Set(notes.flatMap(n => n.tags || [])));

  const handleSelectNote = (note: Note) => {
    setSelectedNoteId(note.id);
    setIsEditing(false);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags.join(', '));
  };

  const handleCreateNote = () => {
    const timeNow = new Date().toISOString();
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: '',
      content: '',
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      createdAt: timeNow,
      updatedAt: timeNow,
      tags: []
    };

    const updated = [newNote, ...notes];
    onUpdateNotes(updated, 'Шинэ тэмдэглэл үүсгэв');
    setSelectedNoteId(newNote.id);
    // Leave the fields empty so the placeholders show — no text to delete first.
    setEditTitle('');
    setEditContent('');
    setEditTags('');
    setIsEditing(true);
  };

  const handleSaveNote = () => {
    if (!selectedNoteId) return;
    
    const parsedTags = editTags
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    const updated = notes.map(n => {
      if (n.id === selectedNoteId) {
        return {
          ...n,
          title: editTitle || 'Гарчиггүй тэмдэглэл',
          content: editContent,
          tags: parsedTags,
          updatedAt: new Date().toISOString()
        };
      }
      return n;
    });

    onUpdateNotes(updated, `Тэмдэглэл засаж хадгалав: ${editTitle}`);
    setIsEditing(false);
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n);
    const n = notes.find(item => item.id === id);
    onUpdateNotes(updated, `Тэмдэглэлийг хадав: ${n?.title}`);
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notes.map(n => n.id === id ? { ...n, isFavorite: !n.isFavorite } : n);
    const n = notes.find(item => item.id === id);
    onUpdateNotes(updated, `Тэмдэглэлийг дуртайд нэмэв/хасав: ${n?.title}`);
  };

  const handleArchiveNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notes.map(n => n.id === id ? { ...n, isArchived: true } : n);
    const n = notes.find(item => item.id === id);
    onUpdateNotes(updated, `Тэмдэглэлийг архивлав: ${n?.title}`);
    if (selectedNoteId === id) {
      setSelectedNoteId(null);
    }
  };

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Тэмдэглэл устгах',
      message: 'Та энэ тэмдэглэлийг устгахдаа итгэлтэй байна уу? Сейфээс бүрмөсөн устах болно.',
      confirmText: 'Устгах',
      danger: true,
    });
    if (!ok) return;

    const updated = notes.filter(n => n.id !== id);
    const n = notes.find(item => item.id === id);
    onUpdateNotes(updated, `Тэмдэглэлийг бүрмөсөн устгав: ${n?.title}`);
    if (selectedNoteId === id) {
      setSelectedNoteId(updated[0]?.id || null);
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

  const getThemeFocusBorder = () => {
    switch (theme) {
      case 'emerald': return 'focus:border-emerald-500/35';
      case 'voltage': return 'focus:border-sky-500/35';
      case 'indigo': return 'focus:border-violet-500/35';
      case 'minimal':
      default: return 'focus:border-slate-500/35';
    }
  };

  // Safe manual simplified mockup markdown renderer to present the user luxurious typography
  const renderSimpleMarkdown = (text: string) => {
    if (!text) return <p className="text-white/30 italic">Агуулга хоосон байна.</p>;
    
    const lines = text.split('\n');
    return (
      <div className="space-y-4 text-white/80 leading-relaxed font-sans text-sm">
        {lines.map((line, idx) => {
          // Headers
          if (line.startsWith('## ')) {
            return <h3 key={idx} className="text-lg font-semibold tracking-tight text-white mt-6 mb-2 border-b border-white/5 pb-1">{line.slice(3)}</h3>;
          }
          if (line.startsWith('### ')) {
            return <h4 key={idx} className="text-md font-medium tracking-tight text-white mt-4 mb-1">{line.slice(4)}</h4>;
          }
          if (line.startsWith('# ')) {
            return <h2 key={idx} className="text-2xl font-semibold tracking-tight text-white mt-8 mb-4">{line.slice(2)}</h2>;
          }
          // Bullets
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return <li key={idx} className="list-disc pl-2 ml-4 text-white/75">{line.slice(2)}</li>;
          }
          // Blockquotes
          if (line.startsWith('> ') || line.startsWith('_')) {
            return <blockquote key={idx} className="border-l-2 border-white/20 pl-4 py-1 italic my-3 bg-white/[0.01] text-white/50">{line.replace(/^>\s*/, '').replace(/_/g, '')}</blockquote>;
          }
          // Todo list item
          if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
            const checked = line.includes('[x]');
            return (
              <div key={idx} className="flex items-center space-x-2 my-1">
                <input type="checkbox" checked={checked} readOnly className="rounded border-white/10 bg-black/40 text-emerald-500 w-3.5 h-3.5 focus:ring-0" />
                <span className={checked ? 'line-through text-white/40' : 'text-white/80'}>{line.slice(6)}</span>
              </div>
            );
          }
          // Empty spacing
          if (line.trim() === '') {
            return <div key={idx} className="h-2" />;
          }
          return <p key={idx} className="my-1.5">{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-160px)] min-h-[580px]">
      
      {/* LEFT COLUMN: Dual search and list partition */}
      <div className="lg:col-span-4 flex flex-col space-y-4 h-full">
        {/* Actions panel */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative grow">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Тэмдэглэл хайх..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/10 transition font-mono"
            />
          </div>
          <button
            onClick={handleCreateNote}
            className="px-3.5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 transition rounded-xl text-white flex items-center justify-center cursor-pointer"
            title="Шинэ тэмдэглэл үүсгэх"
          >
            <Plus className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Tags Filter row */}
        {allTags.length > 0 && (
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 select-none scrollbar-none">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 text-[10px] uppercase font-mono tracking-wider rounded-lg transition shrink-0 ${
                !selectedTag ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              БҮГД
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1 text-[10px] uppercase font-mono tracking-wider rounded-lg transition shrink-0 flex items-center space-x-1.5 ${
                  selectedTag === tag ? 'bg-white/15 text-white border border-white/10' : 'text-white/40 hover:text-white/70'
                }`}
              >
                <span>#{tag}</span>
              </button>
            ))}
          </div>
        )}

        {/* List of notes */}
        <div className="grow overflow-y-auto space-y-3 pr-1">
          {sortedNotes.length === 0 ? (
            <div className="glass-panel p-10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 h-48 bg-black/20">
              <FileText className="w-8 h-8 text-white/20" />
              <p className="text-xs text-white/30 font-mono">Төгс тохирох тэмдэглэл олдсонгүй</p>
            </div>
          ) : (
            sortedNotes.map((note) => {
              const isSelected = selectedNoteId === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={`group glass-panel p-4 rounded-xl cursor-pointer text-left transition relative overflow-hidden ${
                    isSelected ? 'border-white/15 bg-white/[0.04]' : 'glass-panel-hover'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <h3 className="text-sm font-medium text-white group-hover:text-white transition line-clamp-1">
                      {note.title}
                    </h3>
                    <div className="flex items-center space-x-1 shrink-0 opacity-40 group-hover:opacity-100 transition">
                      {note.isPinned && (
                        <button onClick={(e) => handleTogglePin(note.id, e)} className="p-0.5 text-amber-400 hover:text-amber-300">
                          <Pin className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                      <button onClick={(e) => handleToggleFavorite(note.id, e)} className={`p-0.5 ${note.isFavorite ? 'text-rose-400' : 'text-white/30 hover:text-rose-400'}`}>
                        <Star className={`w-3.5 h-3.5 ${note.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-white/40 line-clamp-2 mt-2 font-sans">
                    {note.content ? note.content.replace(/[#*_\-\[\]]/g, '') : 'Хоосон агуулга...'}
                  </p>

                  <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-white/[0.03]">
                    <span className="text-[10px] font-mono text-white/30">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center space-x-1">
                      {note.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.03] text-white/50 border border-white/5">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active editor or detail view */}
      <div className="lg:col-span-8 glass-panel rounded-3xl bg-black/40 border border-white/5 flex flex-col h-full overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeNote ? (
            <motion.div
              key={activeNote.id}
              initial={{ opacity: 0, filter: 'blur(5px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
              {/* Note Header Toolbar */}
              <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/30">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleTogglePin(activeNote.id, e)}
                    className={`p-2 rounded-xl transition ${activeNote.isPinned ? 'bg-amber-500/10 text-amber-400' : 'hover:bg-white/5 text-white/40 hover:text-white'}`}
                    title="Pin тэмдэглэл"
                  >
                    <Pin className={`w-4 h-4 ${activeNote.isPinned ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => handleToggleFavorite(activeNote.id, e)}
                    className={`p-2 rounded-xl transition ${activeNote.isFavorite ? 'bg-rose-500/10 text-rose-400' : 'hover:bg-white/5 text-white/40 hover:text-white'}`}
                    title="Дуртайд нэмэх"
                  >
                    <Star className={`w-4 h-4 ${activeNote.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => handleArchiveNote(activeNote.id, e)}
                    className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition"
                    title="Архивлах"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteNote(activeNote.id, e)}
                    className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-rose-400 transition"
                    title="Бүрмөсөн устгах"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (isEditing) {
                        handleSaveNote();
                      } else {
                        setEditTitle(activeNote.title);
                        setEditContent(activeNote.content);
                        setEditTags(activeNote.tags.join(', '));
                        setIsEditing(true);
                      }
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition flex items-center space-x-1.5 ${
                      isEditing 
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-black font-semibold' 
                        : 'bg-white/5 border border-white/10 hover:bg-white/10 text-white'
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Хадгалж харах</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Засварлах</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Note Content Area */}
              <div className="grow p-6 md:p-8 overflow-y-auto">
                {isEditing ? (
                  <div className="space-y-5 h-full flex flex-col">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Гарчиг оруулах..."
                      className="w-full bg-transparent border-none text-2xl font-semibold tracking-tight text-white focus:outline-none focus:ring-0 placeholder-white/20 font-sans"
                    />

                    {/* Tag editing */}
                    <div className="flex items-center space-x-2 bg-black/20 px-3.5 py-2 rounded-xl border border-white/5">
                      <span className="text-[10px] font-mono text-white/30 shrink-0 uppercase tracking-widest">Tags (Таслалаар):</span>
                      <input
                        type="text"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder="заавар, хувийн, зорилго"
                        className="w-full bg-transparent border-none text-xs text-white focus:outline-none focus:ring-0 placeholder-white/15 font-mono py-0 pl-1"
                      />
                    </div>

                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Тэмдэглэлээ энд шифрлэн хадгална уу..."
                      className="w-full grow bg-transparent border-none text-sm text-white focus:outline-none focus:ring-0 placeholder-white/15 font-sans leading-relaxed resize-none mt-2 min-h-[250px]"
                    />
                  </div>
                ) : (
                  <div className="space-y-6 select-text text-left">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-semibold tracking-tight text-white font-sans">
                        {activeNote.title}
                      </h2>
                      <div className="flex items-center space-x-3 text-[10px] font-mono text-white/35">
                        <span>ҮҮСГЭСЭН: {new Date(activeNote.createdAt).toLocaleString()}</span>
                        <span>•</span>
                        <span>ӨӨРЧЛӨЛТ: {new Date(activeNote.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Active note Tags banner layout */}
                    {activeNote.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {activeNote.tags.map(tag => (
                          <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white/[0.03] text-white/60 border border-white/5">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="h-[1px] w-full bg-white/5" />

                    {/* Styled rendering output */}
                    <div className="mt-4">
                      {renderSimpleMarkdown(activeNote.content)}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center p-12 text-center space-y-4 my-auto h-full"
            >
              <FileText className="w-12 h-12 text-white/10 animate-pulse" />
              <div className="space-y-1.5">
                <h4 className="font-display font-medium text-white/70">Тэмдэглэл сонгоогүй байна</h4>
                <p className="text-xs text-white/35 max-w-sm mx-auto font-mono">
                  Зүүн талын жагсаалтаас тэмдэглэл заан оруулж унших буюу шинээр үүсгэнэ үү.
                </p>
              </div>
              <button
                onClick={handleCreateNote}
                className={`px-4 py-2 text-xs rounded-xl transition cursor-pointer flex items-center space-x-1.5 bg-white/5 hover:bg-white/10 text-white font-medium`}
              >
                <Plus className="w-4 h-4" />
                <span>Шинэ Тэмдэглэл Үүсгэх</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
