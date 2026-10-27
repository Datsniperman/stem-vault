'use client';

import { useEffect, useRef, useState } from 'react';
import { Disc3, Layers, MessageSquare, Sparkles, Radio } from 'lucide-react';

const STATS = [
  { label: 'Multitrack Sessions', key: 'sessions' as const, icon: <Disc3 className="w-5 h-5 text-amber" /> },
  { label: 'Audio Channels', key: 'tracks' as const, icon: <Layers className="w-5 h-5 text-cyan" /> },
  { label: 'Community Mixers', key: 'engineers' as const, icon: <MessageSquare className="w-5 h-5 text-discord" /> },
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
    <section className="relative px-4 sm:px-8 pt-8 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Main Material Card Container */}
        <div className="relative overflow-hidden bg-gradient-to-br from-surface-raised via-surface to-surface-low border border-border/80 rounded-3xl p-6 sm:p-12 lg:p-16 shadow-[0_12px_36px_rgba(0,0,0,0.4)]">

          {/* Ambient Radial Gradient Accents */}
          <div className="absolute top-0 right-10 w-96 h-96 bg-amber/10 blur-[120px] pointer-events-none rounded-full" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-discord/10 blur-[120px] pointer-events-none rounded-full" />

          <div className="relative z-10 max-w-3xl space-y-6">

            {/* M3 Assist Pill */}
            <div className="inline-flex items-center gap-2.5 bg-surface-high/90 border border-border/80 px-4 py-1.5 rounded-full shadow-sm animate-[reveal-up_0.5s_cubic-bezier(0.2,0,0,1)_both]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span className="text-xs font-mono uppercase tracking-widest text-warm-white font-semibold">
                Tyler Kerpsack All Access
              </span>
              <span className="text-dim">•</span>
              <span className="text-xs font-body text-amber font-semibold">In-House Audio Vault</span>
            </div>

            {/* Expressive M3 Headline */}
            <h1
              className="font-display text-warm-white font-bold tracking-tight leading-[1.05] animate-[reveal-up_0.6s_cubic-bezier(0.2,0,0,1)_80ms_both]"
              style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.8rem)' }}
            >
              The Mixing Vault.<br />
              <span className="bg-gradient-to-r from-amber via-amber-muted to-cyan bg-clip-text text-transparent">
                Multitracks & Mix Critiques.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-mid text-base sm:text-lg leading-relaxed max-w-2xl font-body font-normal animate-[reveal-up_0.6s_cubic-bezier(0.2,0,0,1)_160ms_both]">
              Download raw studio multitracks and DAW session templates. Submit your finished mix directly to receive time-stamped feedback and critique from engineers inside our Discord community.
            </p>

            {/* Feature Assist Chips */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 animate-[reveal-up_0.6s_cubic-bezier(0.2,0,0,1)_200ms_both]">
              <div className="flex items-center gap-2 bg-surface-high/70 hover:bg-surface-highest border border-border/60 px-4 py-2 rounded-full text-xs font-medium text-warm-white transition-colors shadow-sm">
                <Disc3 className="w-4 h-4 text-amber" />
                <span>Raw Multitracks</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-high/70 hover:bg-surface-highest border border-border/60 px-4 py-2 rounded-full text-xs font-medium text-warm-white transition-colors shadow-sm">
                <Layers className="w-4 h-4 text-cyan" />
                <span>DAW Templates</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-high/70 hover:bg-surface-highest border border-border/60 px-4 py-2 rounded-full text-xs font-medium text-warm-white transition-colors shadow-sm">
                <MessageSquare className="w-4 h-4 text-discord" />
                <span>Discord Thread Feedback</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-high/70 hover:bg-surface-highest border border-border/60 px-4 py-2 rounded-full text-xs font-medium text-warm-white transition-colors shadow-sm">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Instant Release</span>
              </div>
            </div>

          </div>

          {/* Floating Elevated Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 pt-8 border-t border-border/60 relative z-10 animate-[reveal-up_0.6s_cubic-bezier(0.2,0,0,1)_240ms_both]">
            {STATS.map(({ label, key, icon }) => (
              <StatCard key={key} value={values[key]} label={label} icon={icon} />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

function StatCard({ value, label, icon }: { value: number; label: string; icon: React.ReactNode }) {
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
    const duration = 1000;
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
    <div
      ref={ref}
      className="bg-surface-raised/90 border border-border/70 p-5 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 transition-all flex items-center gap-4"
    >
      <div className="w-12 h-12 rounded-2xl bg-surface-high border border-border/80 flex items-center justify-center shrink-0 shadow-inner">
        {icon}
      </div>
      <div>
        <p className="font-display text-2xl sm:text-3xl font-bold text-warm-white tabular-nums tracking-tight">
          {display.toLocaleString()}
        </p>
        <p className="text-dim text-xs font-mono uppercase tracking-wider mt-0.5 font-medium">{label}</p>
      </div>
    </div>
  );
}
