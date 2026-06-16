/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { VaultTheme } from '../types';

interface VaultBackgroundProps {
  theme: VaultTheme;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
}

export default function VaultBackground({ theme }: VaultBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  // Get glow colors based on the selected theme
  const getGlowColors = () => {
    switch (theme) {
      case 'emerald':
        return {
          primary: 'rgba(16, 185, 129, 0.08)',
          secondary: 'rgba(5, 150, 105, 0.05)',
          glowClass: 'bg-emerald-500/10'
        };
      case 'voltage':
        return {
          primary: 'rgba(14, 165, 233, 0.08)',
          secondary: 'rgba(2, 132, 199, 0.05)',
          glowClass: 'bg-sky-500/10'
        };
      case 'indigo':
        return {
          primary: 'rgba(139, 92, 246, 0.08)',
          secondary: 'rgba(109, 40, 217, 0.05)',
          glowClass: 'bg-violet-500/10'
        };
      case 'minimal':
      default:
        return {
          primary: 'rgba(100, 116, 139, 0.06)',
          secondary: 'rgba(71, 85, 105, 0.04)',
          glowClass: 'bg-slate-500/5'
        };
    }
  };

  const colors = getGlowColors();

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        const width = parent?.clientWidth || window.innerWidth;
        const height = parent?.clientHeight || window.innerHeight;
        setDimensions({ width, height });
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create a pool of high-performance particles
    const particleCount = 45;
    const particles: Particle[] = [];

    const createParticle = (isInitial = false): Particle => {
      const w = canvas.width;
      const h = canvas.height;
      return {
        x: Math.random() * w,
        y: isInitial ? Math.random() * h : h + 10,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -0.1 - Math.random() * 0.25, // slow drifting upwards
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
        decay: 0.0005 + Math.random() * 0.001
      };
    };

    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle(true));
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Active theme dot accent drawing
      let particleColor = '255, 255, 255';
      if (theme === 'emerald') particleColor = '16, 185, 129';
      else if (theme === 'voltage') particleColor = '14, 165, 233';
      else if (theme === 'indigo') particleColor = '139, 92, 246';
      else if (theme === 'minimal') particleColor = '148, 163, 184';

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Wrap boundaries
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;

        // Reset if drifted complete out
        if (p.y < -10) {
          particles[i] = createParticle(false);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particleColor}, ${p.alpha})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [dimensions.width, dimensions.height, theme]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#050505] -z-50 select-none pointer-events-none">
      {/* Base Cosmic Dark Mesh Layer */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#050505] via-[#0A0A0A] to-[#0D1117]" />

      {/* Cyberpunk grid overlay with mask */}
      <div className="absolute inset-0 vault-grid radial-mask opacity-40" />

      {/* Dynamic ambient colored aura blobs (morphed with CSS transitions/animations) */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Dynamic primary glowing blob */}
        <div 
          className={`absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full opacity-30 blur-[130px] transition-all duration-1000 ease-in-out pulsing-glow ${colors.glowClass}`}
          style={{ transitionDelay: '0ms' }}
        />
        {/* Secondary complement glowing blob */}
        <div 
          className={`absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full opacity-20 blur-[150px] transition-all duration-1000 ease-in-out pulsing-glow ${colors.glowClass}`}
          style={{ animationDelay: '-3s', transitionDelay: '100ms' }}
        />
        {/* Auxiliary center subtle node */}
        <div 
          className={`absolute top-[40%] left-[35%] w-[30%] h-[30%] rounded-full opacity-10 blur-[120px] transition-all duration-1000 ease-in-out pulsing-glow ${colors.glowClass}`}
          style={{ animationDelay: '-6s', transitionDelay: '200ms' }}
        />
      </div>

      {/* Drifting particle canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full opacity-80 mix-blend-screen"
      />

      {/* Elegant analog film grain static layer for micro-texture */}
      <div className="absolute inset-0 grain opacity-60 pointer-events-none mix-blend-overlay" />
    </div>
  );
}
