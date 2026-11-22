'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, ShieldCheck, Disc, Radio, ExternalLink, Music2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#09090b] text-neutral-400 text-xs">
      {/* Top Banner with Studio Status */}
      <div className="border-b border-white/[0.06] bg-[#0d0d10]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 font-mono text-[11px]">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-neutral-300 font-medium">Vault Core Engine:</span>
            <span className="text-emerald-400">All Systems Operational</span>
            <span className="text-neutral-600">|</span>
            <span className="text-neutral-500">Lossless 24-bit PCM Storage</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px] text-neutral-400">
            <span>Client v2.4 (Beta)</span>
            <a
              href="https://discord.gg"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <span>Discord Community</span>
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs shadow-sm group-hover:scale-105 transition-transform">
                MV
              </div>
              <span className="font-semibold text-sm tracking-tight text-white group-hover:text-neutral-200 transition-colors">
                THE MIXING VAULT
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.06] border border-white/[0.08] text-neutral-400">
                Studio Edition
              </span>
            </Link>

            <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
              The premier platform for uncompressed multitrack audio stems, live worship recordings, signal processing blueprints, and community mixing competitions.
            </p>

            <div className="pt-2 flex items-center gap-3 text-neutral-400 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
                <Disc className="w-3.5 h-3.5 text-neutral-400" />
                <span>FLAC / WAV / 24-bit</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
                <Radio className="w-3.5 h-3.5 text-neutral-400" />
                <span>HLS Streaming</span>
              </span>
            </div>
          </div>

          {/* Navigation Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-200">
              Vault Archive
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Multitrack Stems
                </Link>
              </li>
              <li>
                <Link href="/mixes" className="hover:text-white transition-colors">
                  Community Mixes
                </Link>
              </li>
              <li>
                <Link href="/plugin-chains" className="hover:text-white transition-colors">
                  Plugin Chains
                </Link>
              </li>
              <li>
                <Link href="/competitions" className="hover:text-white transition-colors">
                  Mix Competitions
                </Link>
              </li>
              <li>
                <Link href="/sessions" className="hover:text-white transition-colors">
                  Recorded Sessions
                </Link>
              </li>
              <li>
                <Link href="/daw-converter" className="hover:text-white transition-colors">
                  DAW Converter
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-200">
              Platform & Tiers
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/membership" className="hover:text-white transition-colors">
                  Membership Plans
                </Link>
              </li>
              <li>
                <Link href="/membership" className="hover:text-white transition-colors">
                  Early Access Windows
                </Link>
              </li>
              <li>
                <Link href="/mixes" className="hover:text-white transition-colors">
                  Sunday Reviews
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-white transition-colors">
                  Engineer Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Governance */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-200">
              Legal & Privacy
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/dmca" className="hover:text-white transition-colors">
                  DMCA & Copyright
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400 font-mono">
          <div>
            &copy; {new Date().getFullYear()} The Mixing Vault. All executive rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/dmca" className="hover:text-white transition-colors">
              DMCA
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
