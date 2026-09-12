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

  const displayHandle = profile?.display_name
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
    <div className="min-h-screen bg-obsidian text-warm-white pb-20">
      <Header onStemAdded={() => {}} />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 space-y-8">

        {/* Top Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-body text-dim hover:text-amber transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Vault Archive
        </Link>

        {/* User Banner */}
        <div className="bg-surface border border-border rounded-sm p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-surface-raised border-2 border-amber/40 flex items-center justify-center font-mono text-2xl text-amber font-bold shadow-lg">
                {displayHandle.replace('@', '').slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-display text-2xl sm:text-3xl text-warm-white font-bold">{displayHandle}</h1>
                  {profile?.role === 'admin' && (
                    <span className="text-[10px] font-body font-bold px-2 py-0.5 rounded bg-error/10 text-error border border-error/30 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> ADMIN
                    </span>
                  )}
                  {profile?.role === 'verified' && (
                    <span className="text-[10px] font-body font-bold px-2 py-0.5 rounded bg-verified-dim text-verified border border-verified/30 flex items-center gap-1">
                      <Check className="w-3 h-3" /> PRO TECH
                    </span>
                  )}
                </div>
                <p className="text-dim text-xs font-body mt-1">
                  Community Contributor &middot; Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Stem Vault Archive'}
                </p>
              </div>
            </div>

            {/* Quick Stat Badges */}
            <div className="flex items-center gap-4 bg-obsidian border border-border/80 px-4 py-3 rounded-sm self-stretch sm:self-auto justify-around sm:justify-start">
              <div className="text-center">
                <p className="font-display text-xl text-amber font-bold">{stems.length}</p>
                <p className="text-[10px] text-dim font-body uppercase tracking-wider">Sessions</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="font-display text-xl text-warm-white font-bold">{totalTracks}</p>
                <p className="text-[10px] text-dim font-body uppercase tracking-wider">Tracks</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="font-display text-xl text-verified font-bold">{totalDownloads}</p>
                <p className="text-[10px] text-dim font-body uppercase tracking-wider">Downloads</p>
              </div>
            </div>

          </div>
        </div>

        {/* Sessions Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-display text-xl text-warm-white flex items-center gap-2">
              <Music2 className="w-5 h-5 text-amber" />
              Public Multitrack Sessions ({stems.length})
            </h2>
          </div>

          {stems.length === 0 ? (
            <div className="bg-surface border border-border rounded-sm p-12 text-center space-y-2">
              <p className="text-base font-body text-warm-white font-medium">No published sessions found.</p>
              <p className="text-xs text-dim font-body">This user has not published any public multitrack sessions yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
