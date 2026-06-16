/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Shield, Key, Cpu, Eye, EyeOff } from 'lucide-react';
import { VaultTheme } from '../types';

interface CinematicHeroProps {
  theme: VaultTheme;
}

export default function CinematicHero({ theme }: CinematicHeroProps) {
  // Map theme values to specific CSS tint colors
  const getThemeColor = () => {
    switch (theme) {
      case 'emerald':
        return {
          text: 'text-emerald-400',
          border: 'border-emerald-500/20',
          bg: 'bg-emerald-500/5',
          radial: 'from-emerald-500/20',
          stopColor: '#10B981',
        };
      case 'voltage':
        return {
          text: 'text-sky-400',
          border: 'border-sky-500/20',
          bg: 'bg-sky-500/5',
          radial: 'from-sky-500/20',
          stopColor: '#0EA5E9',
        };
      case 'indigo':
        return {
          text: 'text-violet-400',
          border: 'border-violet-500/20',
          bg: 'bg-violet-500/5',
          radial: 'from-violet-500/20',
          stopColor: '#8B5CF6',
        };
      case 'minimal':
      default:
        return {
          text: 'text-slate-400',
          border: 'border-slate-500/20',
          bg: 'bg-slate-500/5',
          radial: 'from-slate-500/10',
          stopColor: '#94A3B8',
        };
    }
  };

  const colors = getThemeColor();

  return (
    <div className="relative flex flex-col justify-between w-full h-full p-12 overflow-hidden bg-black/20 rounded-2xl border border-white/5">
      {/* Intricately detailed digital vault graphical asset (interactive SVG) */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Animated Background Orbiting Ring 1 */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className={`absolute w-[440px] h-[440px] rounded-full border border-dashed opacity-10 ${colors.border}`}
        />

        {/* Animated Background Orbiting Ring 2 */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className={`absolute w-[360px] h-[360px] rounded-full border border-double opacity-20 ${colors.border}`}
        />

        {/* Outer Circular Ring with tick marks (Watch/Chronos details) */}
        <div className={`absolute w-[280px] h-[280px] rounded-full border opacity-30 ${colors.border}`}>
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/20 transform -translate-x-1/2 scale-y-110" />
          <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-white/20 transform -translate-y-1/2 scale-x-110" />
        </div>

        {/* Centerpiece Vector Graphics Visual Node in the shape of a gorgeous Central Core */}
        <div className="relative z-10 flex items-center justify-center central-core hover:scale-[1.02] transition-transform duration-500">
          {/* Glowing Halo Shadow */}
          <div 
            className={`absolute inset-0 rounded-full blur-[40px] opacity-25 bg-gradient-to-r ${colors.radial} to-transparent`} 
            style={{ boxShadow: '0 0 100px rgba(16, 185, 129, 0.1)' }}
          />

          <div className="core-inner relative">
            {/* Spinning vector mandala inside the core border */}
            <div className="absolute inset-2 flex items-center justify-center pointer-events-none opacity-40">
              <svg className="w-full h-full transform -rotate-90 select-none animate-[spin_40s_linear_infinite]" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={colors.stopColor} stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0a0a0b" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="url(#shieldGrad)"
                  strokeWidth="0.8"
                  fill="none"
                  strokeDasharray="15 35 5 15"
                />
              </svg>
            </div>

            {/* Custom Logo Texts with letter-spacing from Artistic Flair */}
            <div className="logo-box">
              <div className="logo-text font-display">VAULT</div>
              <div className="logo-subtitle font-mono tracking-[0.8em]" style={{ color: colors.stopColor }}>NOTE</div>
              <div className="mt-2.5 flex justify-center">
                <Shield className={`w-4 h-4 ${colors.text} opacity-80 animate-pulse`} />
              </div>
            </div>
          </div>
        </div>

        {/* Abstract design elements pointing to corner alignments */}
        <div className="absolute top-8 left-8 flex items-center space-x-2 text-[10px] tracking-[0.15em] text-white/30 font-mono">
          <Cpu className="w-3.5 h-3.5" />
          <span>CRYPTOGRAPHIC CORES ACTIVE</span>
        </div>

        <div className="absolute bottom-8 right-8 flex items-center space-x-2 text-[10px] tracking-[0.15em] text-white/30 font-mono">
          <Key className="w-3.5 h-3.5" />
          <span>AES-256 VAULT PRE-STAGE</span>
        </div>
      </div>

      {/* Top Header of the Art Space */}
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-wider text-white">
            VAULT<span className={colors.text}>NOTE</span>
          </h2>
          <p className="text-xs text-white/40 font-mono mt-1 tracking-wider">
            SECURE ZERO-KNOWLEDGE PROTOCOL
          </p>
        </div>
        <div className="px-3 py-1 text-[9px] font-mono tracking-widest text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          ONLINE SECURE
        </div>
      </div>

      {/* Center Cinematic Display typography */}
      <div className="relative z-10 my-auto pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-md space-y-4"
        >
          <span className={`text-xs font-mono tracking-[0.3em] uppercase ${colors.text} font-semibold block`}>
            Цахим аюулгүй байдал
          </span>
          <h1 className="text-4xl lg:text-5xl font-display font-light text-white tracking-tight leading-none">
            Таны хувийн <br />
            <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">
              орон зай
            </span>
          </h1>
          <p className="text-sm text-white/40 leading-relaxed max-w-sm">
            Notion, Obsidian болон Cyberpunk-ийн төгс нэгдэл. Тэмдэглэл, нууц үг, AI промптуудаа нэг дор аюулгүй хадгал.
          </p>
        </motion.div>
      </div>

      {/* Bottom Display Indicator info */}
      <div className="relative z-10 flex justify-between items-end border-t border-white/5 pt-6">
        <div className="space-y-1 font-mono">
          <span className="text-[9px] text-white/35 uppercase tracking-widest block">DECRYPTION ENGINE</span>
          <span className="text-[11px] text-white/70 block">ZERO-KNOWLEDGE-CLIENT</span>
        </div>
        <div className="text-right font-mono space-y-1">
          <span className="text-[9px] text-white/35 uppercase tracking-widest block font-sans">ХАМГААЛАЛТ</span>
          <span className="text-[11px] text-white/70 block text-glow-emerald">E2E ENCRYPTED</span>
        </div>
      </div>
    </div>
  );
}
