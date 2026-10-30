'use client';

import Link from 'next/link';

interface HeroProps {
  totalSessions: number;
  totalTracks: number;
  activeEngineers: number;
}

export function Hero({ totalSessions, totalTracks, activeEngineers }: HeroProps) {
  return (
    <section className="border-b border-neutral-800/80 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">

          {/* Left: Minimal Typographic Header */}
          <div className="space-y-2 max-w-2xl">
            <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
              Tyler Kerpsack All Access
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Multitrack Archive & Mix Lab
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed pt-1">
              Download studio multitracks, share session templates, and submit finished mixes for feedback in the Discord community.
            </p>

            {/* Quick Access Badges for Beta Features */}
            <div className="flex flex-wrap items-center gap-2 pt-3">
              <Link
                href="/multis"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded transition-colors"
              >
                <span>📦 Multitrack Packs</span>
              </Link>
              <Link
                href="/mixes"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded transition-colors"
              >
                <span>🎧 Finished Mixes</span>
              </Link>
              <Link
                href="/plugin-chains"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded transition-colors"
              >
                <span>🎛️ Plugin Chains</span>
              </Link>
            </div>
          </div>

          {/* Right: Clean Stats */}
          <div className="flex items-center gap-6 text-xs text-neutral-400 border-t md:border-t-0 border-neutral-800/80 pt-4 md:pt-0">
            <div>
              <p className="text-base sm:text-lg font-mono font-semibold text-white">{totalSessions}</p>
              <p className="text-[11px] text-neutral-400">Sessions</p>
            </div>
            <div className="w-px h-7 bg-neutral-800" />
            <div>
              <p className="text-base sm:text-lg font-mono font-semibold text-white">{totalTracks}</p>
              <p className="text-[11px] text-neutral-400">Channels</p>
            </div>
            <div className="w-px h-7 bg-neutral-800" />
            <div>
              <p className="text-base sm:text-lg font-mono font-semibold text-white">{activeEngineers}</p>
              <p className="text-[11px] text-neutral-400">Mixers</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
