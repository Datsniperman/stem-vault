'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  Search,
  Plus,
  Calendar,
  HardDrive,
  Music,
  User as UserIcon,
  X,
  Sparkles,
  ArrowRight,
  Disc,
} from 'lucide-react';
import { Multi } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { UploadMultiModal } from '@/components/UploadMultiModal';
import { Header } from '@/components/Header';
import { FluidOrb } from '@/components/ui/fluid-orb';
import { AnimatedCounter } from '@/components/ui/animated-counter';

export default function MultisPage() {
  const { user } = useAuth();
  const [multis, setMultis] = useState<Multi[]>([]);
  const [search, setSearch] = useState('');
  const [proFilter, setProFilter] = useState<'all' | 'pro'>('all');
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  const fetchMultis = async (query: string = '', proOnly: boolean = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (proOnly) params.set('pro', 'true');
      const url = params.toString() ? `/api/multis?${params.toString()}` : '/api/multis';
      const res = await fetch(url);
      const data = await res.json();
      setMultis(data.multis || []);
    } catch (e) {
      console.warn('Error fetching multis:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMultis(search, proFilter === 'pro');
  }, [search, proFilter]);

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 MB';
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalStems = multis.reduce((acc, m) => acc + (m.track_count || 0), 0);

  return (
    <div className="min-h-screen bg-[#0d0d0e] text-neutral-100 pb-24">
      <Header />

      {/* Rare UI Hero Canvas */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-6">
        <div className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#121215]/80 backdrop-blur-xl p-8 sm:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]">
          {/* Ambient Fluid Orb in background */}
          <div className="absolute -right-16 -top-16 opacity-30 blur-2xl pointer-events-none">
            <FluidOrb size={380} color="#2a2a30" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>MULTITRACK STEM ARCHIVE</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
                <Disc className="w-8 h-8 text-neutral-300 shrink-0" />
                <span>Live Multitrack Sessions</span>
              </h1>

              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Download pristine, unmixed multitrack stem sessions recorded live or preview isolated stems directly in your browser. Plus members get the full community vault; Premium unlocks Pro Multitracks.
              </p>

              {/* Rare UI Metric Badges with Animated Counters */}
              <div className="flex flex-wrap items-center gap-4 pt-3 text-xs font-mono">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-neutral-500">Multitracks:</span>
                  <AnimatedCounter value={multis.length} className="text-white font-semibold" />
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-neutral-500">Stems:</span>
                  <AnimatedCounter value={totalStems} className="text-white font-semibold" />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
              {user ? (
                <button
                  onClick={() => setUploadOpen(true)}
                  className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-5 py-3 rounded-full transition-all flex items-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Multi (ZIP)</span>
                </button>
              ) : (
                <div className="text-xs text-neutral-400 bg-white/[0.04] border border-white/[0.08] px-4 py-2.5 rounded-full">
                  Connect Discord to upload
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-8 space-y-6">
        {/* Search Bar & Rare UI Filter Capsules */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search multitracks by song, church, or key..."
              className="w-full bg-[#141416]/90 border border-white/[0.08] hover:border-white/[0.15] rounded-full pl-11 pr-10 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-all backdrop-blur-xl shadow-xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Rare UI Capsule Toggle */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#141416]/90 border border-white/[0.08] backdrop-blur-xl shrink-0">
            <button
              onClick={() => setProFilter('all')}
              className={`text-xs px-4 py-1.5 rounded-full font-medium transition-all ${
                proFilter === 'all'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Multitracks
            </button>
            <button
              onClick={() => setProFilter('pro')}
              className={`text-xs px-4 py-1.5 rounded-full font-medium transition-all flex items-center gap-1.5 ${
                proFilter === 'pro'
                  ? 'bg-amber-400 text-black shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-amber-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pro Multitracks</span>
            </button>
          </div>
        </div>

        {/* Bento Grid Layout */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div
                key={n}
                className="h-48 rounded-[22px] bg-white/[0.02] border border-white/[0.06] animate-pulse"
              />
            ))}
          </div>
        ) : multis.length === 0 ? (
          <div className="rounded-[28px] border border-white/[0.08] p-16 text-center bg-[#141416]/60 backdrop-blur-xl">
            <Layers className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-neutral-200">No Multitracks Found</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
              {search
                ? `Could not find any sessions matching "${search}".`
                : proFilter === 'pro'
                ? 'No Pro Multitracks published yet. Check back soon for sessions recorded by industry pros.'
                : 'Be the first to upload a multitrack stem pack ZIP archive.'}
            </p>
            {user && proFilter !== 'pro' && (
              <button
                onClick={() => setUploadOpen(true)}
                className="mt-5 bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-4 py-2 rounded-full transition-all inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload First Session</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {multis.map(m => (
              <Link
                key={m.id}
                href={`/multis/${m.id}`}
                className="rare-card group p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-white group-hover:text-neutral-200 transition-colors line-clamp-1">
                        {m.title}
                      </h3>
                      {m.church && (
                        <div className="text-xs font-medium text-emerald-400/90 truncate mt-0.5">
                          {m.church}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {m.is_pro && (
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30">
                          PRO
                        </span>
                      )}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-neutral-300 border border-white/[0.08] flex items-center gap-1">
                        <Music className="w-3 h-3 text-neutral-400" />
                        <span>{m.track_count || 0} stems</span>
                      </span>
                    </div>
                  </div>

                  {(m.song_key || m.bpm) && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                      {m.song_key && (
                        <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-neutral-300">
                          Key: {m.song_key}
                        </span>
                      )}
                      {m.bpm && (
                        <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-neutral-300">
                          {m.bpm} BPM
                        </span>
                      )}
                    </div>
                  )}

                  {m.description && (
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {m.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-500 font-mono mt-4">
                  <div className="flex items-center gap-1.5 text-neutral-400 truncate max-w-[140px]">
                    <UserIcon className="w-3 h-3 text-neutral-500 shrink-0" />
                    <span className="truncate">{m.uploader_name || 'Member'}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-neutral-500" />
                      <span>{formatSize(m.total_size_bytes)}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-neutral-500" />
                      <span>{new Date(m.created_at).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <UploadMultiModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => fetchMultis(search, proFilter === 'pro')}
      />
    </div>
  );
}
