'use client';

import { useEffect, useRef, useState } from 'react';

const STATS = [
  { label: 'Sessions in the archive', key: 'sessions' as const },
  { label: 'Individual tracks', key: 'tracks' as const },
  { label: 'Contributors', key: 'engineers' as const },
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
    <section className="border-b border-border">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 lg:py-24">

        {/* Eyebrow */}
        <p
          className="text-amber text-sm font-body font-medium mb-6 animate-[reveal-up_0.5s_cubic-bezier(0.16,1,0.3,1)_both] delay-0"
        >
          Community worship multitrack archive
        </p>

        {/* Headline */}
        <h1
          className="font-display text-warm-white leading-[0.92] mb-8 animate-[reveal-up_0.6s_cubic-bezier(0.16,1,0.3,1)_80ms_both]"
          style={{ fontSize: 'clamp(3rem, 8vw, 7.5rem)' }}
        >
          Every stem,<br />
          <em className="italic text-amber not-italic" style={{ fontStyle: 'italic' }}>sourced by the room.</em>
        </h1>

        {/* Sub */}
        <p className="text-mid text-lg max-w-xl leading-relaxed mb-14 animate-[reveal-up_0.6s_cubic-bezier(0.16,1,0.3,1)_160ms_both]">
          A community directory where worship sound engineers share and discover
          high-quality multitrack sessions — no paywalls, no gatekeeping.
        </p>

        {/* Stats */}
        <div className="flex flex-wrap gap-10 animate-[reveal-up_0.6s_cubic-bezier(0.16,1,0.3,1)_240ms_both]">
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
      <p className="font-display text-4xl font-bold text-warm-white tabular-nums">
        {display.toLocaleString()}
      </p>
      <p className="text-dim text-sm font-body mt-1">{label}</p>
    </div>
  );
}
