'use client';

import { Hash, Layers, Users, Disc3, HardDrive } from 'lucide-react';

interface HeroProps {
  totalSessions: number;
  totalTracks: number;
  activeEngineers: number;
}

export function Hero({ totalSessions, totalTracks, activeEngineers }: HeroProps) {
  return (
    <div className="bg-[#2b2d31] border-b border-[#1f2023]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

          {/* Left: Channel Topic & Description */}
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#1e1f22] flex items-center justify-center text-[#949ba4]">
                <Hash className="w-4 h-4 stroke-[2.5]" />
              </div>
              <h1 className="text-base sm:text-lg font-bold text-[#f2f3f5]">
                multitrack-archive
              </h1>
              <span className="text-[11px] font-medium text-[#5865F2] bg-[#5865F2]/10 border border-[#5865F2]/25 px-2 py-0.5 rounded">
                Tyler Kerpsack All Access
              </span>
            </div>
            <p className="text-xs text-[#949ba4] leading-relaxed">
              In-house worship multitrack library & DAW session archive for the All Access server.
              Download session stems, share DAW templates, and submit finished mixes to receive time-stamped feedback via KerpBot in Discord.
            </p>
          </div>

          {/* Right: Clean Channel Stat Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-[#1e1f22] border border-[#1f2023] px-3 py-1.5 rounded text-[#dbdee1]">
              <HardDrive className="w-3.5 h-3.5 text-[#5865F2]" />
              <span><strong className="text-[#f2f3f5]">{totalSessions}</strong> multitrack packs</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#1e1f22] border border-[#1f2023] px-3 py-1.5 rounded text-[#dbdee1]">
              <Layers className="w-3.5 h-3.5 text-[#23a55a]" />
              <span><strong className="text-[#f2f3f5]">{totalTracks}</strong> channels</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#1e1f22] border border-[#1f2023] px-3 py-1.5 rounded text-[#dbdee1]">
              <Users className="w-3.5 h-3.5 text-[#f0b232]" />
              <span><strong className="text-[#f2f3f5]">{activeEngineers}</strong> mixers</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
