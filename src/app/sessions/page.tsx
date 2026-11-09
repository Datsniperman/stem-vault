'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { UploadSessionModal } from '@/components/UploadSessionModal';
import { getRecordedSessions } from '@/app/actions/sessions';
import { RecordedSessionListItem } from '@/types/sessions';
import { MembershipTier } from '@/lib/auth/tiers';
import {
  Video,
  Play,
  Lock,
  Sparkles,
  ShieldCheck,
  Plus,
  Clock,
  User,
  Filter,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function RecordedSessionsPage() {
  const [sessions, setSessions] = useState<RecordedSessionListItem[]>([]);
  const [userTier, setUserTier] = useState<MembershipTier>('FREE');
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PLUS' | 'PREMIUM'>('ALL');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await getRecordedSessions();
      setSessions(res.sessions);
      setUserTier(res.userTier);
      setIsAdmin(res.isAdmin);
    } catch (err) {
      console.error('Failed to load recorded sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const filteredSessions = sessions.filter((s) => {
    if (activeFilter === 'PLUS') return s.required_tier === 'PLUS';
    if (activeFilter === 'PREMIUM') return s.required_tier === 'PREMIUM';
    return true;
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const m = Math.floor(seconds / 60);
    return `${m} min`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-neutral-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 mb-2">
              <Video className="w-4 h-4" />
              <span>Exclusive Member Archive</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Recorded Sessions
            </h1>
            <p className="text-sm text-neutral-400 max-w-2xl">
              Live console breakdowns, multitrack mix walkthroughs, and audio masterclasses streaming securely in HLS.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* User Tier Pill */}
            <div className="px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs flex items-center gap-2">
              <span className="text-neutral-500">Your Tier:</span>
              <span
                className={`font-semibold ${
                  userTier === 'PREMIUM'
                    ? 'text-amber-400'
                    : userTier === 'PLUS'
                    ? 'text-emerald-400'
                    : 'text-neutral-400'
                }`}
              >
                {userTier}
              </span>
            </div>

            {isAdmin && (
              <button
                onClick={() => setIsUploadOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Session</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Navigation */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-neutral-500" />
            <div className="flex items-center bg-neutral-900/80 p-1 rounded-lg border border-neutral-800">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                  activeFilter === 'ALL'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                All ({sessions.length})
              </button>
              <button
                onClick={() => setActiveFilter('PLUS')}
                className={`text-xs px-3 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                  activeFilter === 'PLUS'
                    ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/60'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Plus Tier</span>
              </button>
              <button
                onClick={() => setActiveFilter('PREMIUM')}
                className={`text-xs px-3 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                  activeFilter === 'PREMIUM'
                    ? 'bg-amber-950/50 text-amber-300 border border-amber-800/60'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Premium Tier</span>
              </button>
            </div>
          </div>
        </div>

        {/* Grid List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-neutral-900/50 border border-neutral-800 rounded-xl aspect-video animate-pulse"
              />
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-neutral-800 rounded-2xl p-8">
            <Video className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">No recorded sessions found</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Check back soon for new live mixing breakdowns, or adjust your filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="group relative bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 rounded-xl overflow-hidden flex flex-col transition-all duration-200 shadow-lg"
              >
                {/* Thumbnail Area */}
                <div className="relative aspect-video bg-neutral-950 overflow-hidden">
                  {session.thumbnail_url ? (
                    <img
                      src={session.thumbnail_url}
                      alt={session.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-950">
                      <Video className="w-12 h-12 text-neutral-700" />
                    </div>
                  )}

                  {/* Tier Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    {session.required_tier === 'PREMIUM' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-amber-950/80 text-amber-300 border border-amber-800/80 backdrop-blur-md">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Premium
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 backdrop-blur-md">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        Plus
                      </span>
                    )}
                  </div>

                  {/* Duration Badge */}
                  {session.duration_seconds && (
                    <div className="absolute bottom-3 right-3 z-10 px-2 py-0.5 rounded bg-black/80 text-[11px] font-mono text-neutral-300 backdrop-blur-sm flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(session.duration_seconds)}</span>
                    </div>
                  )}

                  {/* Locked Overlay or Hover Play Button */}
                  {session.isLocked ? (
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center z-10">
                      <div className="w-10 h-10 rounded-full bg-neutral-800/90 border border-neutral-700 flex items-center justify-center text-amber-400 mb-2">
                        <Lock className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-white mb-1">
                        {session.required_tier} Tier Required
                      </span>
                      <p className="text-[11px] text-neutral-400 mb-3">
                        Upgrade your membership to unlock instant streaming access.
                      </p>
                      <a
                        href="https://www.launchpass.com/all-access-by-tyler/membership"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-500 hover:bg-amber-400 text-black px-3 py-1 rounded transition-colors"
                      >
                        <span>Upgrade Now</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <Link
                      href={`/sessions/${session.id}`}
                      className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/90 text-black flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </Link>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {session.presenter && (
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1.5">
                        <User className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{session.presenter}</span>
                      </div>
                    )}
                    <h3 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-1 mb-1.5">
                      {session.title}
                    </h3>
                    {session.description && (
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-4">
                        {session.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {session.tags.slice(0, 2).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-400"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    {!session.isLocked && (
                      <Link
                        href={`/sessions/${session.id}`}
                        className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        <span>Watch</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <UploadSessionModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => loadSessions()}
      />
    </div>
  );
}
