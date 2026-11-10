'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { EditSessionModal } from '@/components/EditSessionModal';
import { SecureVideoPlayer } from '@/components/SecureVideoPlayer';
import { getSessionById } from '@/app/actions/sessions';
import { RecordedSession } from '@/types/sessions';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  Lock,
  User,
  Clock,
  Calendar,
  ExternalLink,
  ShieldAlert,
  Loader2,
  ShieldCheck,
  Pencil,
} from 'lucide-react';

export default function SessionDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user, profile } = useAuth();

  const [session, setSession] = useState<RecordedSession | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const isAdmin = profile?.role === 'admin' || user?.role === 'admin';

  useEffect(() => {
    if (!id) return;

    const fetchSession = async () => {
      try {
        setLoading(true);
        const res = await getSessionById(id);
        if (res.error && !res.isLocked) {
          setError(res.error);
          return;
        }

        setSession(res.session);
        setStreamUrl(res.streamUrl);
        setIsLocked(res.isLocked);
        setIsMember(res.isMember);
      } catch (err: any) {
        setError(err.message || 'Failed to load session details.');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id]);

  const userWatermark =
    profile?.server_display_name ||
    profile?.display_name ||
    user?.user_metadata?.server_display_name ||
    user?.email ||
    'Tyler Kerpsack All Access';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/sessions"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Recorded Sessions</span>
          </Link>
        </div>

        {loading ? (
          <div className="w-full aspect-video bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 border border-red-900/60 bg-red-950/20 rounded-xl text-center max-w-md mx-auto space-y-3">
            <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
            <h2 className="text-base font-semibold text-white">{error}</h2>
            <button
              onClick={() => router.push('/sessions')}
              className="text-xs bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Return to Library
            </button>
          </div>
        ) : isLocked ? (
          /* Locked State for Non-Members */
          <div className="relative w-full aspect-video bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-8 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>All Access Exclusive</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 max-w-lg">
              {session?.title || 'Recorded Session'}
            </h2>

            <p className="text-xs sm:text-sm text-neutral-400 max-w-md mb-6 leading-relaxed">
              This session is restricted to paying members. Join Tyler Kerpsack All Access to unlock the complete video archive.
            </p>

            <div className="flex items-center gap-3">
              <a
                href="https://www.launchpass.com/all-access-by-tyler/plus"
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <span>Join Membership</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <Link
                href="/sessions"
                className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs px-4 py-2.5 rounded-lg transition-colors border border-neutral-800"
              >
                Browse Library
              </Link>
            </div>
          </div>
        ) : streamUrl ? (
          /* Secure HLS Video Player */
          <div className="space-y-6">
            <SecureVideoPlayer
              src={streamUrl}
              poster={session?.thumbnail_url || undefined}
              title={session?.title}
              userIdentifier={userWatermark}
            />

            {/* Video Metadata Header */}
            <div className="space-y-4 border-b border-neutral-800 pb-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Member Access
                  </span>

                  <span className="text-xs text-neutral-500 font-mono">
                    Protected Stream (HLS)
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-neutral-400">
                  {session?.duration_seconds && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{Math.floor(session.duration_seconds / 60)} minutes</span>
                    </div>
                  )}
                  {session?.created_at && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{new Date(session.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {session?.title}
                </h1>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="text-xs text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-xs"
                    title="Edit session details"
                  >
                    <Pencil className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Edit Session</span>
                  </button>
                )}
              </div>

              {session?.presenter && (
                <div className="flex items-center gap-2 text-sm text-neutral-300">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>Presented by <strong className="text-white">{session.presenter}</strong></span>
                </div>
              )}

              {session?.description && (
                <p className="text-sm text-neutral-300 leading-relaxed max-w-3xl whitespace-pre-line pt-2">
                  {session.description}
                </p>
              )}

              {session?.tags && session.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  {session.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-xs text-neutral-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>

      <EditSessionModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        session={session as any}
        onSuccess={() => {
          if (id) {
            getSessionById(id).then(res => {
              if (res.session) setSession(res.session);
            });
          }
        }}
      />
    </div>
  );
}
