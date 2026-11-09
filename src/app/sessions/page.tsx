'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { UploadSessionModal } from '@/components/UploadSessionModal';
import { getRecordedSessions } from '@/app/actions/sessions';
import { RecordedSessionListItem } from '@/types/sessions';
import {
  Video,
  Play,
  Lock,
  Plus,
  Clock,
  User,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export default function RecordedSessionsPage() {
  const [sessions, setSessions] = useState<RecordedSessionListItem[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await getRecordedSessions();
      setSessions(res.sessions);
      setIsMember(res.isMember);
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
            {/* Membership Status Pill */}
            <div className="px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs flex items-center gap-2">
              <span className="text-neutral-500">Access:</span>
              <span
                className={`font-semibold flex items-center gap-1.5 ${
                  isMember ? 'text-emerald-400' : 'text-neutral-400'
                }`}
              >
                {isMember ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Member Unlocked</span>
                  </>
                ) : (
                  <span>Membership Required</span>
                )}
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

        {/* Sessions Counter */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="text-xs text-neutral-400">
            Showing {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
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
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-neutral-800 rounded-2xl p-8">
            <Video className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">No recorded sessions found</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Check back soon for new live mixing breakdowns and console sessions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
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

                  {/* Duration Badge */}
                  {session.duration_seconds && (
                    <div className="absolute bottom-3 right-3 z-10 px-2 py-0.5 rounded bg-black/80 text-[11px] font-mono text-neutral-300 backdrop-blur-sm flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(session.duration_seconds)}</span>
                    </div>
                  )}

                  {/* Locked Overlay or Hover Play Button */}
                  {session.isLocked ? (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center z-10">
                      <div className="w-10 h-10 rounded-full bg-neutral-800/90 border border-neutral-700 flex items-center justify-center text-amber-400 mb-2">
                        <Lock className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-white mb-1">
                        Member Access Required
                      </span>
                      <p className="text-[11px] text-neutral-400 mb-3">
                        Join All Access to stream the full video library.
                      </p>
                      <a
                        href="https://www.launchpass.com/all-access-by-tyler/membership"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-1 rounded transition-colors"
                      >
                        <span>Join Membership</span>
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
