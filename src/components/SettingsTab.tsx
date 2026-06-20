/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Shield, HardDrive, Download, Upload, AlertOctagon, RefreshCw, KeyRound, Clock, User, LogOut } from 'lucide-react';
import { VaultTheme, VaultUser } from '../types';
import { useConfirm } from './ConfirmProvider';
import { useToast } from './ToastProvider';

interface SettingsTabProps {
  user: VaultUser | null;
  theme: VaultTheme;
  setTheme: (t: VaultTheme) => void;
  onClearAllData: () => void;
  onLogOut: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onChangePassphrase: (current: string, next: string) => Promise<void>;
  autoLockMin: number;
  setAutoLockMin: (m: number) => void;
}

export default function SettingsTab({ user, theme, setTheme, onClearAllData, onLogOut, onExportBackup, onImportBackup, onChangePassphrase, autoLockMin, setAutoLockMin }: SettingsTabProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [isDestructing, setIsDestructing] = useState(false);

  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const handleChangePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!curPass || !newPass) return;
    if (newPass.length < 6) {
      toast('Шинэ нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.', 'error');
      return;
    }
    if (newPass !== confirmPass) {
      toast('Шинэ нууц үг таарахгүй байна.', 'error');
      return;
    }
    setChangingPw(true);
    try {
      await onChangePassphrase(curPass, newPass);
      toast('Master нууц үг амжилттай солигдлоо.', 'success');
      setCurPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Нууц үг солиход алдаа гарлаа.', 'error');
    } finally {
      setChangingPw(false);
    }
  };

  const handleSelfDestruct = async () => {
    const ok = await confirm({
      title: 'Сейфийг бүрмөсөн устгах',
      message: 'АНХААРУУЛГА! Та өөрийн локал сейфийг БҮРМӨСӨН устгахдаа итгэлтэй байна уу? Таны бүх тэмдэглэл, нууц үг, промптууд устгагдах бөгөөд сэргээх боломжгүй.',
      confirmText: 'Бүгдийг устгах',
      danger: true,
    });
    if (!ok) return;

    setIsDestructing(true);
    setTimeout(() => {
      onClearAllData();
      setIsDestructing(false);
    }, 2000);
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

  const getThemeBorderClass = () => {
    switch (theme) {
      case 'emerald': return 'border-emerald-500/15';
      case 'voltage': return 'border-sky-500/15';
      case 'indigo': return 'border-violet-500/15';
      case 'minimal':
      default: return 'border-slate-500/15';
    }
  };

  return (
    <div className="space-y-6 max-w-3xl pb-10 text-left">
      <div>
        <span className={`text-[10px] font-mono tracking-[0.25em] ${getThemeTextClass()} font-semibold block`}>
          ТОХИРУУЛГЫН СУВГУУД
        </span>
        <h1 className="text-3xl font-display font-light text-white tracking-tight mt-1">
          Аюулгүйн <span className="font-medium">тохиргоо</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start pt-4">
        
        {/* Left Column: Account Profile & Theme customization */}
        <div className="space-y-6">
          
          {/* Account Profile Box */}
          <div className="glass-panel p-5 rounded-2xl bg-black/40 border border-white/5 space-y-4">
            <h3 className="text-xs font-mono tracking-widest text-white/50 uppercase flex items-center gap-1.5 font-semibold">
              <User className="w-4 h-4 text-white/40" /> Хэрэглэгчийн бүртгэл
            </h3>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-white/[0.03]">
                <span className="text-white/40">Имэйл Сейф:</span>
                <span className="text-white/80">{user?.email || 'Мэдээлэл байхгүй'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.03]">
                <span className="text-white/40">Бүртгүүлсэн огноо:</span>
                <span className="text-white/80">{user ? new Date(user.registeredAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-white/40 font-mono">Сейф тайлсан тоо:</span>
                <span className="text-white/85 font-semibold">{user?.loginCount || 1}</span>
              </div>
            </div>

            <button
              onClick={onLogOut}
              className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center justify-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Сейфийг түгжих (Гарах)</span>
            </button>
          </div>

          {/* Theme Visual Setup */}
          <div className="glass-panel p-5 rounded-2xl bg-black/40 border border-white/5 space-y-4">
            <h3 className="text-xs font-mono tracking-widest text-white/50 uppercase flex items-center gap-1.5 font-semibold">
              <RefreshCw className="w-4 h-4 text-white/40" /> Системийн өнгөний хэлбэр
            </h3>
            
            <p className="text-xs text-white/40">
              tzeedek-note аюулгүй байдлын үйл ажиллагаанд тохирох өнгө сонгож, ажлын талбарыг өөрчилнө үү.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1.5">
              {(['emerald', 'voltage', 'indigo', 'minimal'] as VaultTheme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider border transition cursor-pointer text-center ${
                    theme === t 
                      ? 'bg-white/10 text-white border-white/10' 
                      : 'bg-black/30 border-white/5 text-white/40 hover:text-white/70 hover:border-white/10'
                  }`}
                >
                  {t === 'emerald' ? '🟢 Emerald' : t === 'voltage' ? '🔵 Voltage' : t === 'indigo' ? '🟣 Indigo' : '⚪ Minimal'}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-lock */}
          <div className="glass-panel p-5 rounded-2xl bg-black/40 border border-white/5 space-y-4">
            <h3 className="text-xs font-mono tracking-widest text-white/50 uppercase flex items-center gap-1.5 font-semibold">
              <Clock className="w-4 h-4 text-white/40" /> Автомат түгжээ
            </h3>
            <p className="text-xs text-white/40">
              Идэвхгүй байх хугацаа дууссаны дараа сейф автоматаар түгжигдэж, дахин нэвтрэх шаардлагатай болно.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: 1, l: '1 мин' },
                { v: 5, l: '5 мин' },
                { v: 15, l: '15 мин' },
                { v: 30, l: '30 мин' },
                { v: 60, l: '1 цаг' },
                { v: 0, l: 'Хэзээ ч' },
              ].map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => setAutoLockMin(opt.v)}
                  className={`px-2 py-2 rounded-xl text-xs font-mono border transition cursor-pointer ${
                    autoLockMin === opt.v
                      ? 'bg-white/10 text-white border-white/10'
                      : 'bg-black/30 border-white/5 text-white/40 hover:text-white/70 hover:border-white/10'
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          {/* Change master passphrase */}
          <div className="glass-panel p-5 rounded-2xl bg-black/40 border border-white/5 space-y-4">
            <h3 className="text-xs font-mono tracking-widest text-white/50 uppercase flex items-center gap-1.5 font-semibold">
              <KeyRound className="w-4 h-4 text-white/40" /> Master нууц үг солих
            </h3>
            <p className="text-xs text-white/40 leading-relaxed">
              Шинэ нууц үгээр сейфийг дахин шифрлэнэ. Энэ нь таны шифрлэлтийн түлхүүр тул мартаж болохгүй.
            </p>
            <form onSubmit={handleChangePass} className="space-y-2.5">
              <input
                type="password"
                value={curPass}
                onChange={(e) => setCurPass(e.target.value)}
                placeholder="Одоогийн нууц үг"
                className="block w-full bg-black/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/10 transition font-mono"
              />
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Шинэ нууц үг"
                className="block w-full bg-black/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/10 transition font-mono"
              />
              <input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Шинэ нууц үг (давтах)"
                className="block w-full bg-black/40 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/10 transition font-mono"
              />
              <button
                type="submit"
                disabled={changingPw}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold cursor-pointer transition flex items-center justify-center space-x-1.5 disabled:opacity-60"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{changingPw ? 'Солиж байна…' : 'Нууц үг солих'}</span>
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Database safety, exports, factory resets */}
        <div className="space-y-6">
          
          {/* Back up Database section */}
          <div className="glass-panel p-5 rounded-2xl bg-black/40 border border-white/5 space-y-4">
            <h3 className="text-xs font-mono tracking-widest text-white/50 uppercase flex items-center gap-1.5 font-semibold">
              <Download className="w-4 h-4 text-white/40" /> Нөөцлөх & Сэргээх
            </h3>

            <p className="text-xs text-white/40 leading-relaxed">
              Сейфээ <span className="text-white/60">шифрлэгдсэн</span> файлаар татаж авч аюулгүй хадгална уу. Файл нь зөвхөн таны vault нууц үгээр тайлагдана.
            </p>

            <button
              onClick={onExportBackup}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold cursor-pointer transition flex items-center justify-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Шифрлэгдсэн backup татах</span>
            </button>

            <label className="w-full py-2.5 bg-black/30 hover:bg-white/5 border border-white/10 text-white/80 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center justify-center space-x-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>Backup-аас сэргээх</span>
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onImportBackup(f);
                  e.target.value = '';
                }}
              />
            </label>
          </div>

          {/* Secure Self-Destruct trigger (Factory resetting) */}
          <div className={`glass-panel p-5 rounded-2xl bg-black/40 border ${isDestructing ? 'border-rose-500 animate-pulse' : 'border-rose-500/10'} space-y-4`}>
            <h3 className="text-xs font-mono tracking-widest text-rose-400 uppercase flex items-center gap-1.5 font-semibold">
              <AlertOctagon className="w-4 h-4 text-rose-400" /> Өөрийгөө устгах (Self-Destruct)
            </h3>

            <p className="text-xs text-white/40 leading-relaxed">
              Аюултай нөхцөл байдалд ашиглана. Энэхүү даруул нь таны тэмдэглэл, нууц үг, бүртгэлийг энэ төхөөрөмжөөс бүрмөсөн арчиж цэвэрлэнэ.
            </p>

            {isDestructing ? (
              <div className="w-full py-2.5 bg-rose-600 text-white font-mono rounded-xl text-center text-xs animate-pulse">
                СЕЙФИЙГ УСТГАЖ БАЙНА... Хүлээгээрэй.
              </div>
            ) : (
              <button
                onClick={handleSelfDestruct}
                className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center justify-center space-x-1.5"
              >
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>Бүх өгөгдлийг устгаж цэвэрлэх</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
