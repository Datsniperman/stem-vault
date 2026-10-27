'use client';

import { useEffect, useRef, useState } from 'react';
import { Disc3, Layers, MessageSquare, Sparkles } from 'lucide-react';

const STATS = [
  { label: 'Multitrack Sessions', key: 'sessions' as const },
  { label: 'Total Audio Channels', key: 'tracks' as const },
  { label: 'Community Mixers', key: 'engineers' as const },
];

interface HeroProps {
  totalSessions: number;
  totalTracks: number;
  activeEngineers: number;
}

export function Hero({ totalSessions, totalTracks, activeEngineers }: HeroProps) {
  const values = {
    sessions: totalSessions,
    tracks: totalTracks,
    engineers: activeEngineers,
  };

  return (
    <section className="border-b border-border relative overflow-hidden bg-gradient-to-b from-obsidian via-surface/40 to-obsidian">
      {/* Subtle Studio Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-[#5865F2]/5 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 lg:py-20 relative z-10">

        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-5 animate-[reveal-up_0.5s_cubic-bezier(0.16,1,0.3,1)_both]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-amber text-xs sm:text-sm font-mono uppercase tracking-widest font-semibold flex items-center gap-2">
            <span>Tyler Kerpsack All Access</span>
            <span className="text-dim">•</span>
            <span className="text-mid">In-House Stems Hub</span>
          </p>
        </div>

        {/* Headline */}
        <h1
          className="font-display text-warm-white leading-[0.95] mb-6 tracking-tight animate-[reveal-up_0.6s_cubic-bezier(0.16,1,0.3,1)_80ms_both]"
          style={{ fontSize: 'clamp(2.5rem, 6.5vw, 6rem)' }}
        >
          The Mixing Vault,<br />
          <em className="text-amber not-italic italic font-normal" style={{ fontStyle: 'italic' }}>
            unmixed session archive.
          </em>
        </h1>

        {/* Sub */}
        <p className="text-mid text-base sm:text-lg max-w-2xl leading-relaxed mb-10 animate-[reveal-up_0.6s_cubic-bezier(0.16,1,0.3,1)_160ms_both]">
          Download raw multitrack session files and DAW templates, mix them in your favorite DAW or digital console, and submit your mix to receive instant community critiques directly inside our Discord feedback threads.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center gap-3 mb-10 text-xs font-body animate-[reveal-up_0.6s_cubic-bezier(0.16,1,0.3,1)_200ms_both]">
          <div className="flex items-center gap-1.5 bg-surface-raised border border-border px-3 py-1.5 rounded-sm text-warm-white">
            <Disc3 className="w-3.5 h-3.5 text-amber" />
            <span>Raw Multitracks</span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-raised border border-border px-3 py-1.5 rounded-sm text-warm-white">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>DAW Templates</span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-raised border border-border px-3 py-1.5 rounded-sm text-warm-white">
            <MessageSquare className="w-3.5 h-3.5 text-[#5865F2]" />
            <span>Discord Thread Feedback</span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-raised border border-border px-3 py-1.5 rounded-sm text-warm-white">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Instant Publishing</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-8 sm:gap-14 animate-[reveal-up_0.6s_cubic-bezier(0.16,1,0.3,1)_240ms_both] pt-6 border-t border-border/60">
          {STATS.map(({ label, key }) => (
            <StatItem key={key} value={values[key]} label={label} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatItem({ value, label }: { value: number; label: string }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || value === 0) return;
    const duration = 1100;
    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * value));
      if (p < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      startRef.current = null;
    };
  }, [visible, value]);

  return (
    <div ref={ref}>
      <p className="font-display text-3xl sm:text-4xl font-bold text-warm-white tabular-nums">
        {display.toLocaleString()}
      </p>
      <p className="text-dim text-xs font-mono uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}
