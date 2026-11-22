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
  Trash2,
  Video,
} from 'lucide-react';
import { FluidOrb } from '@/components/ui/fluid-orb';

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
  const [deleting, setDeleting] = useState(false);
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

  const handleDelete = async () => {
    if (!session) return;
    if (!window.confirm(`Are you sure you want to permanently delete "${session.title}"?`)) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to delete session.');
      } else {
        router.push('/sessions');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete session.');
    } finally {
      setDeleting(false);
    }
  };

  const userWatermark =
    profile?.server_display_name ||
    profile?.display_name ||
    user?.user_metadata?.server_display_name ||
    user?.email ||
    'Tyler Kerpsack All Access';

  return (
    <div className="min-h-screen bg-[#0d0d0e] text-neutral-100 flex flex-col font-sans pb-24">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Back Link Bar */}
        <div className="flex items-center justify-between gap-4 py-2 mb-4">
          <Link
            href="/sessions"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Recorded Sessions</span>
          </Link>

          {isAdmin && session && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditOpen(true)}
                className="text-xs text-neutral-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 font-mono"
              >
                <Pencil className="w-3.5 h-3.5 text-neutral-400" />
                <span>Edit Session</span>
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs text-neutral-400 hover:text-red-400 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 font-mono"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{deleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="w-full aspect-video bg-[#121215] border border-white/[0.08] rounded-3xl flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 border border-red-900/40 bg-red-950/20 rounded-3xl text-center max-w-md mx-auto space-y-3">
            <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
            <h2 className="text-base font-semibold text-white">{error}</h2>
            <button
              onClick={() => router.push('/sessions')}
              className="text-xs bg-white text-black font-semibold px-4 py-2 rounded-full transition-all hover:bg-neutral-200"
            >
              Return to Library
            </button>
          </div>
        ) : isLocked ? (
          /* Locked State for Non-Members */
          <div className="relative w-full aspect-video bg-[#121215] border border-white/[0.08] rounded-3xl overflow-hidden flex flex-col items-center justify-center p-8 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-amber-400 mb-4 shadow-inner">
              <Lock className="w-7 h-7" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase bg-white/[0.04] text-neutral-300 border border-white/[0.08] mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
              <span>All Access Exclusive</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 max-w-lg">
              {session?.title || 'Recorded Session'}
            </h2>

            <p className="text-xs sm:text-sm text-neutral-400 max-w-md mb-6 leading-relaxed">
              This masterclass breakdown is restricted to verified members. Upgrade your vault membership to stream the complete video archive in high definition.
            </p>

            <div className="flex items-center gap-3">
              <Link
                href="/membership"
                className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-5 py-2.5 rounded-full transition-all flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Upgrade Membership</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/sessions"
                className="bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 text-xs px-5 py-2.5 rounded-full transition-all border border-white/[0.08]"
              >
                Browse Library
              </Link>
            </div>
          </div>
        ) : streamUrl ? (
          /* Secure HLS Video Player */
          <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-black shadow-2xl">
              <SecureVideoPlayer
                src={streamUrl}
                poster={session?.thumbnail_url || undefined}
                title={session?.title}
                userIdentifier={userWatermark}
              />
            </div>

            {/* Video Metadata Header */}
            <div className="rare-card p-6 sm:p-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase bg-white/[0.04] text-neutral-300 border border-white/[0.08]">
                    <ShieldCheck className="w-3 h-3 text-neutral-400" />
                    <span>Member Unlocked</span>
                  </span>

                  <span className="text-xs text-neutral-500 font-mono">
                    Protected Stream (HLS)
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-neutral-400">
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

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {session?.title}
              </h1>

              {session?.presenter && (
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Presented by <strong className="text-neutral-200">{session.presenter}</strong></span>
                </div>
              )}

              {session?.description && (
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-3xl whitespace-pre-line pt-2">
                  {session.description}
                </p>
              )}

              {session?.tags && session.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  {session.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-neutral-400"
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
