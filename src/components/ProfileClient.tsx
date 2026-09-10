'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Music2, Clock, CheckCircle, Flag, Trash2, ExternalLink, Check, Tag } from 'lucide-react';
import { Stem, Profile } from '@/types';
import { deleteStem } from '@/app/actions/stems';
import { useToast } from '@/context/ToastContext';
import { Header } from '@/components/Header';
import { clsx } from 'clsx';

interface ProfileClientProps {
  profile: Profile | null;
  stems: Stem[];
}

const STATUS_CONFIG = {
  published: { label: 'LIVE', color: 'text-amber', bg: 'bg-amber/10 border-amber/30' },
  pending:   { label: 'PENDING REVIEW', color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-600/30' },
  flagged:   { label: 'FLAGGED', color: 'text-error', bg: 'bg-error/10 border-error/30' },
};

export function ProfileClient({ profile, stems: initialStems }: ProfileClientProps) {
  const { addToast } = useToast();
  const [stems, setStems] = useState<Stem[]>(initialStems);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handle = profile?.display_name
    ? `@${profile.display_name}`
    : profile?.email?.split('@')[0] ?? 'Unknown';

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this submission? This cannot be undone.')) return;
    setDeleting(id);
    const res = await deleteStem(id);
    if (res.success) {
      addToast('Submission deleted.', 'success');
      setStems(prev => prev.filter(s => s.id !== id));
    } else {
      addToast(res.message, 'error');
    }
    setDeleting(null);
  };

  const publishedCount = stems.filter(s => s.status === 'published').length;
  const pendingCount   = stems.filter(s => s.status === 'pending').length;
  const flaggedCount   = stems.filter(s => s.status === 'flagged').length;

  return (
    <div className="min-h-screen bg-obsidian text-warm-white pb-20">
      <Header onStemAdded={() => {}} />

      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8">
        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-body text-dim hover:text-amber transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Vault Archive
        </Link>

        {/* Profile header */}
        <div className="bg-surface border border-border rounded-sm p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-raised border border-border flex items-center justify-center font-mono text-base text-warm-white font-bold">
              {handle.slice(0, 2).toUpperCase().replace('@', '')}
            </div>
            <div>
              <h1 className="font-display text-2xl text-warm-white">{handle}</h1>
              <p className="text-dim text-sm font-body mt-0.5">{profile?.email}</p>
            </div>
            <div className="ml-auto">
              <span className={clsx(
                'text-xs font-body font-semibold px-2.5 py-1 rounded border',
                profile?.role === 'admin' ? 'bg-error/10 text-error border-error/30' :
                profile?.role === 'verified' ? 'bg-verified-dim text-verified border-verified/30' :
                'bg-surface-raised text-dim border-border'
              )}>
                {profile?.role === 'admin' ? 'ADMIN' : profile?.role === 'verified' ? 'PRO TECH' : 'MEMBER'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-5 pt-5 border-t border-border grid grid-cols-3 gap-4">
            <StatBox value={publishedCount} label="Published" color="text-amber" />
            <StatBox value={pendingCount}   label="Pending" color="text-yellow-400" />
            <StatBox value={flaggedCount}   label="Flagged" color="text-error" />
          </div>
        </div>

        {/* Submissions list */}
        <div className="space-y-4">
          <h2 className="font-display text-xl text-warm-white">My Submissions ({stems.length})</h2>

          {stems.length === 0 ? (
            <div className="bg-surface border border-border rounded-sm p-12 text-center">
              <Music2 className="w-12 h-12 text-amber/30 mx-auto mb-4" />
              <p className="font-body text-dim">No submissions yet.</p>
              <p className="font-body text-dim/60 text-sm mt-1">Submit your first multitrack session from the main page.</p>
            </div>
          ) : (
            stems.map(stem => {
              const statusCfg = STATUS_CONFIG[stem.status] ?? STATUS_CONFIG.published;
              return (
                <div key={stem.id} className="bg-surface border border-border rounded-sm p-5 flex gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start gap-3 flex-wrap">
                      <div className="min-w-0">
                        <h3 className="font-display text-lg text-warm-white leading-snug">{stem.title}</h3>
                        <p className="text-amber text-sm font-body">{stem.artist}</p>
                      </div>
                      <span className={clsx(
                        'text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm border shrink-0',
                        statusCfg.bg, statusCfg.color
                      )}>
                        {statusCfg.label}
                      </span>
                      {stem.is_verified && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm border border-amber/30 bg-amber/10 text-amber shrink-0">
                          PRO SESSION
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 text-[11px] font-body text-dim">
                      {stem.bpm && <span>{stem.bpm} BPM</span>}
                      {stem.key && <span>{stem.key}</span>}
                      {stem.track_count && <span>{stem.track_count} tracks</span>}
                      <span>{stem.format}</span>
                      <span>{stem.host_platform}</span>
                    </div>

                    {(stem.tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {(stem.tags || []).map(tag => (
                          <span key={tag} className="text-[10px] font-body text-dim/70 bg-surface-raised border border-border/60 px-1.5 py-0.5 rounded-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {stem.status === 'pending' && (
                      <p className="text-xs text-yellow-400/80 font-body flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Awaiting admin review before appearing in the public archive.
                      </p>
                    )}
                    {stem.status === 'flagged' && (
                      <p className="text-xs text-error/80 font-body flex items-center gap-1.5">
                        <Flag className="w-3.5 h-3.5" />
                        This stem has been flagged as a broken/restricted link and is under review.
                      </p>
                    )}

                    <p className="text-[11px] text-dim font-body">
                      Submitted {getTimeAgo(stem.created_at)}
                      {stem.download_count ? <> &middot; {stem.download_count} downloads</> : null}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {stem.status === 'published' && (
                      <Link
                        href={`/stems/${stem.id}`}
                        className="text-xs font-body text-amber hover:underline flex items-center gap-1"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                    <button
                      onClick={() => handleDelete(stem.id)}
                      disabled={deleting === stem.id}
                      title="Delete submission"
                      className="p-1.5 text-error/50 hover:text-error hover:bg-error/10 rounded transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-dim text-xs font-body mt-0.5">{label}</p>
    </div>
  );
}

function getTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
