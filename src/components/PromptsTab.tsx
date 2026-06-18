/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Copy, Check, Star, Plus, Trash2, Edit3, X, Play, Terminal, Tag, Search, ArrowRight, MessageSquare } from 'lucide-react';
import { AIPrompt, VaultTheme } from '../types';
import { useConfirm } from './ConfirmProvider';

interface PromptsTabProps {
  prompts: AIPrompt[];
  onUpdatePrompts: (updated: AIPrompt[], logMsg: string) => void;
  theme: VaultTheme;
}

export default function PromptsTab({ prompts, onUpdatePrompts, theme }: PromptsTabProps) {
  const confirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewPromptId, setViewPromptId] = useState<string | null>(null);

  // Play testing state
  const [activePlayId, setActivePlayId] = useState<string | null>(null);
  const [customVariable, setCustomVariable] = useState('');
  const [playOutput, setPlayOutput] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  // Creator state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [promptText, setPromptText] = useState('');
  const [category, setCategory] = useState('General');
  const [tagInput, setTagInput] = useState('');

  const categories = Array.from(new Set(prompts.map(p => p.category)));

  const filteredPrompts = prompts.filter(p => {
    if (p.isArchived) return false;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.promptText.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory ? p.category === selectedCategory : true;
    return matchesSearch && matchesCat;
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
      case 'emerald': return 'border-emerald-500/15';
      case 'voltage': return 'border-sky-500/15';
      case 'indigo': return 'border-violet-500/15';
      case 'minimal':
      default: return 'border-slate-500/15';
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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleOpenCreate = () => {
    setTitle('');
    setDescription('');
    setPromptText('');
    setCategory('General');
    setTagInput('');
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: AIPrompt, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPromptId(p.id);
    setTitle(p.title);
    setDescription(p.description);
    setPromptText(p.promptText);
    setCategory(p.category);
    setTagInput(p.tags.join(', '));
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleSavePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !promptText || !description) {
      alert('Шаардлагатай талбаруудыг бөглөнө үү.');
      return;
    }

    const parsedTags = tagInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0);

    if (modalMode === 'create') {
      const newPrompt: AIPrompt = {
        id: `prompt-${Date.now()}`,
        title,
        description,
        promptText,
        category,
        tags: parsedTags,
        isFavorite: false,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updated = [newPrompt, ...prompts];
      onUpdatePrompts(updated, `Шинэ AI Промпт нэмэв: ${title}`);
    } else {
      const updated = prompts.map(prev => {
        if (prev.id === selectedPromptId) {
          return {
            ...prev,
            title,
            description,
            promptText,
            category,
            tags: parsedTags,
            updatedAt: new Date().toISOString()
          };
        }
        return prev;
      });

      onUpdatePrompts(updated, `AI Промпт засварлан хадгалав: ${title}`);
    }

    setIsModalOpen(false);
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = prompts.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p);
    const item = prompts.find(p => p.id === id);
    onUpdatePrompts(updated, `AI Промптыг дуртайд нэмэв/хасав: ${item?.title}`);
  };

  const handleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = prompts.map(p => p.id === id ? { ...p, isArchived: true } : p);
    const item = prompts.find(p => p.id === id);
    onUpdatePrompts(updated, `AI Промптыг архивлав: ${item?.title}`);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Промпт устгах',
      message: 'Та энэ промптыг устгахдаа итгэлтэй байна уу? Сейфнээс бүрмөсөн устах болно.',
      confirmText: 'Устгах',
      danger: true,
    });
    if (!ok) return;

    const updated = prompts.filter(p => p.id !== id);
    const item = prompts.find(p => p.id === id);
    onUpdatePrompts(updated, `AI Промптыг бүрмөсөн устгав: ${item?.title}`);
    if (activePlayId === id) {
      setActivePlayId(null);
    }
  };

  // Run the Prompt Simulator Console (Mock client optimization parser)
  const handleSimulatePrompt = (p: AIPrompt) => {
    if (!customVariable) {
      alert('Интеграцийн хувьсах хувилбарын утгыг оруулна уу.');
      return;
    }

    setIsSimulating(true);
    setPlayOutput('Крипто анализыг боловсруулж байна...\nСүүдрийн сервер рүү суваг нээв...');

    setTimeout(() => {
      const formattedPrompt = p.promptText + `\n\n[USER CONTEXT VARIABLE]: ${customVariable}`;
      
      // Simulate highly detailed cyber answer based on prompt properties
      let resultText = `[tzeedek-note AI Client Proxy v1.2]\n`;
      resultText += `[STATUS]: ANALYSIS COMPLETED SECURELY IN SANDBOX\n\n`;
      if (p.category === 'Development') {
        resultText += `Оруулсан Кот: "${customVariable.substring(0, 40)}${customVariable.length > 40 ? '...' : ''}"\n\n`;
        resultText += `- АЮУЛГҮЙ БАЙДАЛ: Системд нууц үг эсвэл түлхүүрийн ил дахин хадгалалт илэрсэнгүй. ЗОХИСТОЙ.\n`;
        resultText += `- ОПТИМИЗАЦИ: Төрөлжилт (Type Assertion) болон импортын урсгал хурдан хуваарилагдсан байна.\n`;
        resultText += `- ШИЙДЭЛ: Хэрэглэгчийн хүсэлтийг дэмжин локал аюулгүй Сейфийг сайжруулахад бэлэн.`;
      } else if (p.category === 'Design') {
        resultText += `- ДИЗАЙН СТИЛЬ: Шилэн хуудас (backdrop blur) болон сүүдэржилт (glow mesh) амжилттай тодорхойлогдсон байна.\n`;
        resultText += `- ЗӨВЛӨМЖ: Шинэ интерфэйс нь хэрэглэгчийн тав тухыг 40% нэмэгдүүлнэ.\n`;
        resultText += `- CSS UTILITIES: .glow-emerald, .radial-mask болон Inter хослол маш гайхалтай тохирчээ.`;
      } else {
        resultText += `"${customVariable}" хувилбарт тохирсон промпт үр дүнг локал санах ойд амжилттай нэгтгэв. AI үйлдэл хэвийн ажиллалаа.`;
      }

      setPlayOutput(resultText);
      setIsSimulating(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-10 relative">
      
      {/* Top Banner Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className={`text-[10px] font-mono tracking-[0.25em] ${getThemeTextClass()} font-semibold block`}>
            ГАРЦ ТӨДИЙ СУВАГ
          </span>
          <h1 className="text-3xl font-display font-light text-white tracking-tight mt-1">
            AI Промпт <span className="font-medium">сан</span>
          </h1>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Промпт хайх..."
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
            <span>Шинэ промпт</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout Split: Left Prompts side, Right Testing Sandbox side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Prompts Items Deck */}
        <div className={`space-y-4 ${activePlayId ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          {/* Filter categorizations chips */}
          {categories.length > 0 && (
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 text-[10px] uppercase font-mono tracking-wider rounded-lg transition shrink-0 ${
                  !selectedCategory ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                БҮГД
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`px-3 py-1 text-[10px] uppercase font-mono tracking-wider rounded-lg transition shrink-0 flex items-center space-x-1 ${
                    selectedCategory === cat ? 'bg-white/15 text-white border border-white/10' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          )}

          {filteredPrompts.length === 0 ? (
            <div className="glass-panel p-20 rounded-3xl text-center space-y-4 max-w-md mx-auto bg-black/20 mt-6">
              <Sparkles className="w-10 h-10 text-white/10 mx-auto animate-pulse" />
              <p className="text-xs text-white/35 font-mono">Промпт хайлт олдсонгүй</p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${activePlayId ? 'md:grid-cols-1 gap-4' : 'md:grid-cols-2 lg:grid-cols-3 gap-6'} text-left`}>
              {filteredPrompts.map((p) => {
                const isCopied = copiedId === p.id;
                const isPlayActive = activePlayId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setViewPromptId(p.id)}
                    className={`glass-panel p-5 rounded-2xl relative overflow-hidden bg-black/40 border border-white/5 flex flex-col justify-between min-h-[200px] transition cursor-pointer ${
                      isPlayActive ? 'ring-1 ring-white/10 bg-white/[0.02]' : 'glass-panel-hover'
                    }`}
                  >
                    <div>
                      {/* Top title and context */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-mono tracking-widest text-[#10B981] uppercase">{p.category}</span>
                          <h3 className="text-sm font-medium text-white truncate max-w-[170px]" title={p.title}>
                            {p.title}
                          </h3>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={(e) => handleToggleFavorite(p.id, e)}
                            className={`p-1 rounded-lg transition ${p.isFavorite ? 'text-rose-400 font-semibold' : 'text-white/20 hover:text-rose-400'}`}
                          >
                            <Star className={`w-3.5 h-3.5 ${p.isFavorite ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopy(p.promptText, p.id); }}
                            className="p-1 rounded-lg text-white/20 hover:text-white transition"
                            title="Хуулах"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePlayId(isPlayActive ? null : p.id);
                              setCustomVariable('');
                              setPlayOutput('');
                            }}
                            className={`p-1.5 rounded-lg transition ${isPlayActive ? 'text-amber-400 bg-amber-400/10' : 'text-white/20 hover:text-amber-400'}`}
                            title="Промпт залгаж турших"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            onClick={(e) => handleOpenEdit(p, e)}
                            className="p-1 rounded-lg text-white/20 hover:text-white transition"
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

                      <p className="text-xs text-white/40 mt-2 font-sans line-clamp-2">
                        {p.description}
                      </p>

                      {/* Luxury Prompt Text Preview */}
                      <div className="mt-4 bg-black/40 p-3 rounded-xl border border-white/5 max-h-[85px] overflow-y-auto">
                        <span className="text-xs font-mono text-white/70 block whitespace-pre-wrap select-all leading-normal text-left">
                          {p.promptText}
                        </span>
                      </div>
                    </div>

                    {/* Footer tag strings */}
                    <div className="flex flex-wrap gap-1 mt-4 pt-3 border-t border-white/[0.03]">
                      {p.tags.map(tag => (
                        <span key={tag} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.02] border border-white/5 text-white/40">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Active Play testing Console sandbox */}
        {activePlayId && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-5 glass-panel p-5 rounded-3xl bg-black/35 border border-white/10 flex flex-col space-y-4 hover:border-white/20 transition-all text-left"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono tracking-widest text-white/60 font-semibold uppercase">PROMPT PLAYGROUND</span>
              </div>
              <button
                onClick={() => setActivePlayId(null)}
                className="text-white/30 hover:text-white text-xs font-mono cursor-pointer"
              >
                [ ХААХ ]
              </button>
            </div>

            {(() => {
              const activePrompt = prompts.find(p => p.id === activePlayId);
              if (!activePrompt) return null;
              return (
                <div className="space-y-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-white/30">СУВГААР АЖИЛЛУУЛАХ ПОРТ:</span>
                    <h4 className="text-sm font-medium text-white">{activePrompt.title}</h4>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono tracking-wider text-white/40 block">ХУВЬСАХ ОРУУЛАЛТ (VARIABLE INPUT)</label>
                    <textarea
                      value={customVariable}
                      onChange={(e) => setCustomVariable(e.target.value)}
                      placeholder={activePrompt.category === 'Development' ? 'Шифрлэх код эсвэл функцээ энд оруулаарай...' : 'AI-д өгөх хувийн заавраа бичнэ үү...'}
                      className="w-full bg-black/50 border border-white/5 rounded-xl p-3 text-xs text-white placeholder-white/15 focus:outline-none focus:border-white/10 transition font-mono min-h-[90px]"
                    />
                  </div>

                  <button
                    onClick={() => handleSimulatePrompt(activePrompt)}
                    disabled={isSimulating}
                    className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-mono tracking-wider transition cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>{isSimulating ? 'БОЛОВСРУУЛЖ БАЙНА...' : 'СҮҮДРИЙН AI ТУРШИЛТ'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Terminal stdout output screen */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-white/35">STDOUT OUTPUT:</span>
                    <pre className="p-3.5 bg-[#030304] border border-white/5 rounded-xl font-mono text-xs text-white/80 h-[170px] overflow-y-auto whitespace-pre-wrap text-left leading-normal">
                      {playOutput || 'Мэдээлэл оруулаад AI системийн үр дүнг шалгана уу...'}
                    </pre>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

      </div>

      {/* CREATE / EDIT MODAL DRAWER */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg glass-panel p-6 md:p-8 rounded-3xl bg-[#09090b] shadow-2xl border border-white/10 text-left max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                <div>
                  <h3 className="font-display text-lg text-white font-semibold">
                    {modalMode === 'create' ? 'Шинэ AI Промпт Бүртгэх' : 'Промпт Өөрчлөн Хадгалах'}
                  </h3>
                  <p className="text-[11px] font-mono text-white/30 uppercase tracking-widest mt-0.5">
                    AI PROMPT BLUEPRINT SYSTEM
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePrompt} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 pl-1">Промптын Нэр (Title)</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Жишээ: TypeScript Helper, Tailwind Architect"
                    className="block w-full bg-black/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/10 transition font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 pl-1">Тайлбар (Description)</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ашиглагдах зорилго болон үүргийг тайлбарлаж бичнэ"
                    className="block w-full bg-black/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/10 transition font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 pl-1">Категори</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full bg-black/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/10 transition font-mono"
                  >
                    <option value="Development" className="bg-[#0c0c0e]">Development</option>
                    <option value="Design" className="bg-[#0c0c0e]">Design</option>
                    <option value="Writing" className="bg-[#0c0c0e]">Writing</option>
                    <option value="General" className="bg-[#0c0c0e]">General</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 pl-1">Шифрлэх Промпт Эх Текст (Prompt Template)</label>
                  <textarea
                    required
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="AI-д өгөх нарийн зааварчилгааг энд бэлтгэж хадгална"
                    className="block w-full bg-black/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/10 transition font-mono min-h-[140px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 pl-1">Тагууд (Таслалаар зааж холбоно)</label>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="ai, assistant, coding"
                    className="block w-full bg-black/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/10 transition font-mono"
                  />
                </div>

                <div className="pt-4 flex items-center space-x-3">
                  <button
                    type="submit"
                    className={`px-5 py-2.5 rounded-xl transition cursor-pointer text-xs ${getThemeButtonClass()}`}
                  >
                    <span>Хадгалах</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-white/5 border border-white/5 hover:bg-white/10 text-white rounded-xl text-xs transition cursor-pointer"
                  >
                    Болих
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* READ-ONLY DETAIL VIEW (click a card to open) */}
      <AnimatePresence>
        {viewPromptId && (() => {
          const p = prompts.find((x) => x.id === viewPromptId);
          if (!p) return null;
          const isCopied = copiedId === p.id;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setViewPromptId(null)}
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-2xl glass-panel p-6 md:p-8 rounded-3xl bg-[#09090b] border border-white/10 shadow-2xl text-left max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/5 mb-5">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase">{p.category}</span>
                    <h3 className="font-display text-xl text-white font-semibold mt-1 break-words">{p.title}</h3>
                    {p.description && <p className="text-xs text-white/45 mt-1.5 break-words">{p.description}</p>}
                  </div>
                  <button
                    onClick={() => setViewPromptId(null)}
                    className="p-1.5 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition cursor-pointer shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Full prompt text */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">Промпт эх текст</span>
                    <button
                      onClick={() => handleCopy(p.promptText, p.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 text-xs transition cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Хуулсан' : 'Хуулах'}</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-black/50 border border-white/5 rounded-xl font-mono text-sm text-white/85 whitespace-pre-wrap break-words leading-relaxed select-all max-h-[45vh] overflow-y-auto">
                    {p.promptText}
                  </pre>
                </div>

                {/* Tags */}
                {p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-5">
                    {p.tags.map((tag) => (
                      <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white/[0.03] border border-white/5 text-white/50">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer actions */}
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/5">
                  <button
                    onClick={(e) => { setViewPromptId(null); handleOpenEdit(p, e); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-medium transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Засах</span>
                  </button>
                  <button
                    onClick={() => { setViewPromptId(null); setActivePlayId(p.id); setCustomVariable(''); setPlayOutput(''); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 text-xs font-medium transition cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Турших</span>
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
