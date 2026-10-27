'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Music2, Check, Download, Layers, HardDrive, FileAudio, ExternalLink, UserCheck, Shield } from 'lucide-react';
import { Stem, Profile } from '@/types';
import { Header } from '@/components/Header';
import { StemCard } from '@/components/StemCard';
import { useAuth } from '@/context/AuthContext';
import { clsx } from 'clsx';

interface UserProfileClientProps {
  handle: string;
  profile: Profile | null;
  stems: Stem[];
}

export function UserProfileClient({ handle: initialHandle, profile, stems: initialStems }: UserProfileClientProps) {
  const { profile: loggedInProfile } = useAuth();
  const [stems, setStems] = useState<Stem[]>(initialStems);

  const displayHandle = profile?.server_display_name
    ? profile.server_display_name
    : profile?.display_name
    ? `@${profile.display_name}`
    : initialHandle.startsWith('@')
    ? initialHandle
    : `@${initialHandle}`;

  const handleDelete = (id: string) => {
    setStems(prev => prev.filter(s => s.id !== id));
  };

  const handleVerifyToggle = (id: string, verified: boolean) => {
    setStems(prev => prev.map(s => s.id === id ? { ...s, is_verified: verified } : s));
  };

  const totalDownloads = stems.reduce((sum, s) => sum + (s.download_count || 0), 0);
  const totalTracks = stems.reduce((sum, s) => sum + (s.track_count || 0), 0);

  return (
    <div className="min-h-screen bg-surface text-warm-white pb-20">
      <Header onStemAdded={() => {}} />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 space-y-8">

        {/* Top Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-dim hover:text-amber bg-surface-raised/80 hover:bg-surface-high border border-border/70 px-4 py-2 rounded-full transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Vault Archive</span>
        </Link>

        {/* User Banner (M3 Elevated Workstation Card) */}
        <div className="bg-surface-raised/90 border border-border/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-m3-2 relative overflow-hidden backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-surface-high border-2 border-amber/40 flex items-center justify-center font-mono text-2xl text-amber font-bold shadow-m3-1">
                {displayHandle.replace('@', '').slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-warm-white tracking-tight">{displayHandle}</h1>
                  {profile?.role === 'admin' && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-error/15 text-error border border-error/30 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> ADMIN
                    </span>
                  )}
                  {profile?.role === 'verified' && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber/15 text-amber border border-amber/30 flex items-center gap-1">
                      <Check className="w-3 h-3" /> PRO TECH
                    </span>
                  )}
                </div>
                <p className="text-dim text-xs font-body mt-1">
                  All Access Community Contributor &middot; Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'The Mixing Vault'}
                </p>
              </div>
            </div>

            {/* Quick Stat Badges */}
            <div className="flex items-center gap-4 bg-surface-high border border-border/70 px-5 py-3 rounded-2xl self-stretch sm:self-auto justify-around sm:justify-start shadow-sm">
              <div className="text-center">
                <p className="font-display text-xl text-amber font-bold">{stems.length}</p>
                <p className="text-[10px] text-dim font-mono uppercase tracking-wider">Sessions</p>
              </div>
              <div className="w-px h-8 bg-border/60" />
              <div className="text-center">
                <p className="font-display text-xl text-warm-white font-bold">{totalTracks}</p>
                <p className="text-[10px] text-dim font-mono uppercase tracking-wider">Tracks</p>
              </div>
              <div className="w-px h-8 bg-border/60" />
              <div className="text-center">
                <p className="font-display text-xl text-emerald-400 font-bold">{totalDownloads}</p>
                <p className="text-[10px] text-dim font-mono uppercase tracking-wider">Downloads</p>
              </div>
            </div>

          </div>
        </div>

        {/* User's Stems */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h2 className="font-display text-xl font-bold text-warm-white flex items-center gap-2">
              <Music2 className="w-5 h-5 text-amber" />
              <span>Published Sessions ({stems.length})</span>
            </h2>
          </div>

          {stems.length === 0 ? (
            <div className="bg-surface-raised/70 border border-border/70 p-12 text-center rounded-3xl space-y-2 shadow-m3-1">
              <p className="text-sm font-semibold text-dim">No published sessions found.</p>
              <p className="text-xs text-dim/60">This contributor has not uploaded any public multitrack packs yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stems.map(stem => (
                <StemCard
                  key={stem.id}
                  stem={stem}
                  profile={loggedInProfile}
                  onDelete={handleDelete}
                  onVerifyToggle={handleVerifyToggle}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
