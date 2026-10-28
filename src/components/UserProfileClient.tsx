'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Download, Layers, HardDrive, FileAudio, ExternalLink, Shield, Hash } from 'lucide-react';
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
    <div className="min-h-screen bg-[#313338] text-[#dbdee1] pb-20">
      <Header onStemAdded={() => {}} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#949ba4] hover:text-[#f2f3f5] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to multitracks</span>
        </Link>

        {/* User Card (Discord Member Profile Card style) */}
        <div className="bg-[#2b2d31] border border-[#1f2023] rounded p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#5865F2] flex items-center justify-center font-bold text-xl text-white shadow-sm shrink-0">
                {displayHandle.replace('@', '').slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#f2f3f5]">{displayHandle}</h1>
                  {profile?.role === 'admin' && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#f23f43]/15 text-[#f23f43] border border-[#f23f43]/30">
                      ADMIN
                    </span>
                  )}
                  {profile?.role === 'verified' && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#23a55a]/15 text-[#23a55a] border border-[#23a55a]/30">
                      PRO TECH
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#949ba4] mt-0.5">
                  Tyler Kerpsack All Access Member &middot; Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'The Mixing Vault'}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-3 bg-[#1e1f22] border border-[#1f2023] px-4 py-2.5 rounded text-xs">
              <div className="text-center">
                <p className="font-bold text-[#f2f3f5]">{stems.length}</p>
                <p className="text-[10px] text-[#949ba4]">Sessions</p>
              </div>
              <div className="w-px h-6 bg-[#3f4147]" />
              <div className="text-center">
                <p className="font-bold text-[#f2f3f5]">{totalTracks}</p>
                <p className="text-[10px] text-[#949ba4]">Stems</p>
              </div>
              <div className="w-px h-6 bg-[#3f4147]" />
              <div className="text-center">
                <p className="font-bold text-[#23a55a]">{totalDownloads}</p>
                <p className="text-[10px] text-[#949ba4]">Downloads</p>
              </div>
            </div>

          </div>
        </div>

        {/* User's Stems */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1f2023]">
            <h2 className="text-sm font-semibold text-[#f2f3f5] flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-[#80848e]" />
              <span>Published Multitracks ({stems.length})</span>
            </h2>
          </div>

          {stems.length === 0 ? (
            <div className="bg-[#2b2d31] border border-[#1f2023] p-8 text-center rounded text-xs text-[#949ba4]">
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
