'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 pb-20">
      <Header onStemAdded={() => {}} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to multitracks</span>
        </Link>

        {/* User Card */}
        <div className="bg-[#121212] border border-neutral-800/80 rounded-lg p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center font-bold text-xl text-white shadow-xs shrink-0">
                {displayHandle.replace('@', '').slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-semibold text-white">{displayHandle}</h1>
                  {profile?.role === 'admin' && (
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-neutral-800 text-white border border-neutral-700">
                      ADMIN
                    </span>
                  )}
                  {profile?.role === 'verified' && (
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-neutral-800/60 text-neutral-300 border border-neutral-700">
                      VERIFIED
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Tyler Kerpsack All Access Member &middot; Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'The Mixing Vault'}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-3 bg-[#0d0d0e] border border-neutral-800 px-4 py-2.5 rounded text-xs font-mono">
              <div className="text-center">
                <p className="font-semibold text-white">{stems.length}</p>
                <p className="text-[10px] text-neutral-400">Sessions</p>
              </div>
              <div className="w-px h-6 bg-neutral-800" />
              <div className="text-center">
                <p className="font-semibold text-white">{totalTracks}</p>
                <p className="text-[10px] text-neutral-400">Stems</p>
              </div>
              <div className="w-px h-6 bg-neutral-800" />
              <div className="text-center">
                <p className="font-semibold text-white">{totalDownloads}</p>
                <p className="text-[10px] text-neutral-400">Downloads</p>
              </div>
            </div>

          </div>
        </div>

        {/* User's Stems */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <h2 className="text-sm font-semibold text-white">
              Published Multitracks ({stems.length})
            </h2>
          </div>

          {stems.length === 0 ? (
            <div className="bg-[#121212] border border-neutral-800/80 p-8 text-center rounded-lg text-xs text-neutral-400">
              This member has not uploaded any multitrack packs yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
