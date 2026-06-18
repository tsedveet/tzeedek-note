/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Shield } from 'lucide-react';
import { VaultTheme } from '../types';

interface CinematicHeroProps {
  theme: VaultTheme;
}

export default function CinematicHero({ theme }: CinematicHeroProps) {
  const getThemeColor = () => {
    switch (theme) {
      case 'emerald':
        return { text: 'text-emerald-400', stop: '#10B981' };
      case 'voltage':
        return { text: 'text-sky-400', stop: '#0EA5E9' };
      case 'indigo':
        return { text: 'text-violet-400', stop: '#8B5CF6' };
      case 'minimal':
      default:
        return { text: 'text-slate-300', stop: '#94A3B8' };
    }
  };

  const colors = getThemeColor();

  // Stable starfield so the dots don't jump on re-render.
  const stars = useMemo(
    () =>
      Array.from({ length: 32 }, () => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 1.6 + 0.6,
        delay: Math.random() * 4,
        duration: 2.5 + Math.random() * 3.5,
      })),
    [],
  );

  // Orbits: { diameter, seconds, direction, planet size }
  const orbits = [
    { size: 480, dur: 80, dir: 1, planet: 5 },
    { size: 380, dur: 58, dir: -1, planet: 8 },
    { size: 280, dur: 42, dir: 1, planet: 5 },
    { size: 180, dur: 28, dir: -1, planet: 4 },
  ];

  return (
    <div className="relative flex flex-col justify-between w-full h-full p-10 overflow-hidden bg-black/20 rounded-2xl border border-white/5">
      {/* ── Starfield ── */}
      <div className="absolute inset-0 overflow-hidden">
        {stars.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>

      {/* ── Soft nebula glow behind the system ── */}
      <div
        className="absolute left-1/2 top-1/2 w-[460px] h-[460px] rounded-full blur-[130px] opacity-20"
        style={{ background: colors.stop, marginLeft: -230, marginTop: -230 }}
      />

      {/* ── Orbital system (centered, nothing overlaps it) ── */}
      <div className="absolute inset-0 pointer-events-none">
        {orbits.map((o, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full border border-white/[0.06]"
            style={{ width: o.size, height: o.size, marginLeft: -o.size / 2, marginTop: -o.size / 2 }}
            animate={{ rotate: o.dir * 360 }}
            transition={{ duration: o.dur, repeat: Infinity, ease: 'linear' }}
          >
            {/* Planet riding the orbit */}
            <div
              className="absolute left-1/2 rounded-full"
              style={{
                width: o.planet,
                height: o.planet,
                top: -o.planet / 2,
                marginLeft: -o.planet / 2,
                background: colors.stop,
                boxShadow: `0 0 14px 1px ${colors.stop}`,
              }}
            />
          </motion.div>
        ))}

        {/* Central core */}
        <motion.div
          className="absolute left-1/2 top-1/2 flex items-center justify-center"
          style={{ width: 120, height: 120, marginLeft: -60, marginTop: -60 }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="absolute inset-0 rounded-full blur-2xl opacity-40" style={{ background: colors.stop }} />
          <div className="relative flex items-center justify-center w-[84px] h-[84px] rounded-full border border-white/15 bg-black/50 backdrop-blur-sm">
            <Shield className={`w-7 h-7 ${colors.text}`} />
          </div>
        </motion.div>
      </div>

      {/* ── Top: brand + status (sits above the system, no overlap) ── */}
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-wider text-white">
            tzeedek<span className={colors.text}>-note</span>
          </h2>
          <p className="text-[10px] text-white/35 font-mono mt-1.5 tracking-[0.2em] uppercase">
            Secure Zero-Knowledge Protocol
          </p>
        </div>
        <div className="px-3 py-1 text-[9px] font-mono tracking-widest text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          ONLINE SECURE
        </div>
      </div>

      {/* ── Bottom: one minimal caption ── */}
      <div className="relative z-10 flex justify-center">
        <span className="text-[10px] font-mono tracking-[0.3em] text-white/25 uppercase">
          Zero-Knowledge · E2E Encrypted · AES-256
        </span>
      </div>
    </div>
  );
}
