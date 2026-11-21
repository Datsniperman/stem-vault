'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { UploadSessionModal } from '@/components/UploadSessionModal';
import { EditSessionModal } from '@/components/EditSessionModal';
import { getRecordedSessions } from '@/app/actions/sessions';
import { RecordedSessionListItem } from '@/types/sessions';
import { FluidOrb } from '@/components/ui/fluid-orb';
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
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';

export default function RecordedSessionsPage() {
  const [sessions, setSessions] = useState<RecordedSessionListItem[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<RecordedSessionListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to delete session.');
      } else {
        await loadSessions();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete session.');
    } finally {
      setDeletingId(null);
    }
  };

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
    <div className="min-h-screen bg-[#0d0d0e] text-neutral-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Rare UI Hero Canvas */}
        <div className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#121215]/80 backdrop-blur-xl p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] mb-8">
          <div className="absolute -right-20 -top-20 opacity-20 blur-2xl pointer-events-none">
            <FluidOrb size={320} color="#203028" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                <span>THE MIXING VAULT / SESSIONS ARCHIVE</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <Video className="w-6 h-6 text-neutral-300" />
                <span>Recorded Sessions</span>
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl leading-relaxed">
                Live console breakdowns, multitrack mix walkthroughs, and audio masterclasses streaming securely in HLS.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs flex items-center gap-2">
                <span className="text-neutral-500 font-mono text-[11px]">ACCESS:</span>
                <span
                  className={`font-semibold text-xs flex items-center gap-1.5 ${
                    isMember ? 'text-white' : 'text-neutral-400'
                  }`}
                >
                  {isMember ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-neutral-200" />
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
                  className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Session</span>
                </button>
              )}
            </div>
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
                        href="https://www.launchpass.com/all-access-by-tyler/plus"
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

                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingSession(session)}
                            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                            title="Edit session details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(session.id, session.title)}
                            disabled={deletingId === session.id}
                            className="p-1 rounded text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                            title="Delete session"
                          >
                            {deletingId === session.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
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

      <EditSessionModal
        isOpen={Boolean(editingSession)}
        onClose={() => setEditingSession(null)}
        session={editingSession}
        onSuccess={() => loadSessions()}
      />
    </div>
  );
}
