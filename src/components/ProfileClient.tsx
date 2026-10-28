'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Flag, Trash2, ExternalLink, Edit3 } from 'lucide-react';
import { Stem, Profile } from '@/types';
import { deleteStem } from '@/app/actions/stems';
import { useToast } from '@/context/ToastContext';
import { Header } from '@/components/Header';
import { clsx } from 'clsx';
import { EditStemModal } from './EditStemModal';

interface ProfileClientProps {
  profile: Profile | null;
  stems: Stem[];
}

const STATUS_CONFIG = {
  published: { label: 'LIVE', color: 'text-neutral-200', bg: 'bg-neutral-800 border-neutral-700' },
  pending:   { label: 'PENDING', color: 'text-neutral-400', bg: 'bg-neutral-900 border-neutral-800' },
  flagged:   { label: 'FLAGGED', color: 'text-neutral-400', bg: 'bg-neutral-900 border-neutral-800' },
};

export function ProfileClient({ profile, stems: initialStems }: ProfileClientProps) {
  const { addToast } = useToast();
  const [stems, setStems] = useState<Stem[]>(initialStems);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingStem, setEditingStem] = useState<Stem | null>(null);

  const handle = profile?.display_name
    ? `@${profile.display_name}`
    : profile?.email?.split('@')[0] ?? 'Unknown';

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this submission?')) return;
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

  const handleStemUpdated = (updatedStem: Stem) => {
    setStems(prev => prev.map(s => s.id === updatedStem.id ? updatedStem : s));
  };

  const publishedCount = stems.filter(s => s.status === 'published').length;
  const pendingCount   = stems.filter(s => s.status === 'pending').length;
  const flaggedCount   = stems.filter(s => s.status === 'flagged').length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 pb-20">
      <Header onStemAdded={() => {}} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to multitracks</span>
        </Link>

        {/* Profile header */}
        <div className="bg-[#121212] border border-neutral-800/80 rounded-lg p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {handle.slice(0, 2).toUpperCase().replace('@', '')}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">{handle}</h1>
              <p className="text-xs text-neutral-400">{profile?.email}</p>
            </div>
            <div className="ml-auto">
              <span className={clsx(
                'text-[10px] font-mono font-medium px-2 py-0.5 rounded border',
                profile?.role === 'admin' ? 'bg-neutral-800 text-white border-neutral-700' :
                profile?.role === 'verified' ? 'bg-neutral-800/60 text-neutral-300 border-neutral-700' :
                'bg-neutral-900 text-neutral-400 border-neutral-800'
              )}>
                {profile?.role === 'admin' ? 'ADMIN' : profile?.role === 'verified' ? 'VERIFIED' : 'MEMBER'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-5 pt-4 border-t border-neutral-800 grid grid-cols-3 gap-3">
            <StatBox value={publishedCount} label="Published" />
            <StatBox value={pendingCount}   label="Pending" />
            <StatBox value={flaggedCount}   label="Flagged" />
          </div>
        </div>

        {/* Submissions list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2 pb-2 border-b border-neutral-800">
            <span>My Multitracks ({stems.length})</span>
          </h2>

          {stems.length === 0 ? (
            <div className="bg-[#121212] border border-neutral-800/80 p-8 text-center rounded-lg text-xs text-neutral-400">
              No multitrack uploads yet. Use the &quot;Publish Stems&quot; button to upload your first session.
            </div>
          ) : (
            stems.map(stem => {
              const statusCfg = STATUS_CONFIG[stem.status] ?? STATUS_CONFIG.published;
              return (
                <div key={stem.id} className="bg-[#121212] border border-neutral-800/80 rounded-lg p-4 flex gap-4 text-xs">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start gap-2 flex-wrap">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{stem.title}</h3>
                        <p className="text-xs text-neutral-400">{stem.artist}</p>
                      </div>
                      <span className={clsx(
                        'text-[10px] font-mono font-medium px-1.5 py-0.2 rounded border shrink-0',
                        statusCfg.bg, statusCfg.color
                      )}>
                        {statusCfg.label}
                      </span>
                      {stem.is_verified && (
                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded border border-neutral-700 bg-neutral-800 text-white shrink-0">
                          PRO
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 text-[11px] text-neutral-400 font-mono">
                      {stem.bpm && <span>{stem.bpm} BPM</span>}
                      {stem.key && <span>{stem.key}</span>}
                      {stem.track_count && <span>{stem.track_count} tracks</span>}
                      <span>{stem.format}</span>
                      <span>{stem.host_platform}</span>
                    </div>

                    {stem.status === 'pending' && (
                      <p className="text-xs text-neutral-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Awaiting review</span>
                      </p>
                    )}
                    {stem.status === 'flagged' && (
                      <p className="text-xs text-neutral-400 flex items-center gap-1">
                        <Flag className="w-3.5 h-3.5" />
                        <span>Flagged as dead link</span>
                      </p>
                    )}

                    <p className="text-[11px] text-neutral-400">
                      Uploaded {getTimeAgo(stem.created_at)}
                      {stem.download_count ? <> &middot; {stem.download_count} downloads</> : null}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0 items-end">
                    {stem.status === 'published' && (
                      <Link
                        href={`/stems/${stem.id}`}
                        className="text-xs text-white hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                    <button
                      onClick={() => setEditingStem(stem)}
                      title="Edit"
                      className="p-1 text-neutral-400 hover:text-white rounded transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(stem.id)}
                      disabled={deleting === stem.id}
                      title="Delete"
                      className="p-1 text-neutral-400 hover:text-white rounded transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <EditStemModal
        isOpen={!!editingStem}
        stem={editingStem}
        onClose={() => setEditingStem(null)}
        onStemUpdated={handleStemUpdated}
      />
    </div>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center bg-[#0d0d0e] border border-neutral-800 p-2.5 rounded">
      <p className="text-lg font-mono font-semibold text-white">{value}</p>
      <p className="text-neutral-400 text-[10px] mt-0.5">{label}</p>
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
