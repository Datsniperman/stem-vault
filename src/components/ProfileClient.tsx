'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Flag, Trash2, ExternalLink, Edit3, Hash } from 'lucide-react';
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
  published: { label: 'LIVE', color: 'text-[#23a55a]', bg: 'bg-[#23a55a]/10 border-[#23a55a]/30' },
  pending:   { label: 'PENDING', color: 'text-[#f0b232]', bg: 'bg-[#f0b232]/10 border-[#f0b232]/30' },
  flagged:   { label: 'FLAGGED', color: 'text-[#f23f43]', bg: 'bg-[#f23f43]/10 border-[#f23f43]/30' },
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
    <div className="min-h-screen bg-[#313338] text-[#dbdee1] pb-20">
      <Header onStemAdded={() => {}} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#949ba4] hover:text-[#f2f3f5] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to multitracks</span>
        </Link>

        {/* Profile header */}
        <div className="bg-[#2b2d31] border border-[#1f2023] rounded p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {handle.slice(0, 2).toUpperCase().replace('@', '')}
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#f2f3f5]">{handle}</h1>
              <p className="text-xs text-[#949ba4]">{profile?.email}</p>
            </div>
            <div className="ml-auto">
              <span className={clsx(
                'text-[10px] font-semibold px-2 py-0.5 rounded border',
                profile?.role === 'admin' ? 'bg-[#f23f43]/15 text-[#f23f43] border-[#f23f43]/30' :
                profile?.role === 'verified' ? 'bg-[#23a55a]/15 text-[#23a55a] border-[#23a55a]/30' :
                'bg-[#1e1f22] text-[#949ba4] border-[#1f2023]'
              )}>
                {profile?.role === 'admin' ? 'ADMIN' : profile?.role === 'verified' ? 'PRO TECH' : 'MEMBER'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-[#1f2023] grid grid-cols-3 gap-3">
            <StatBox value={publishedCount} label="Published" color="text-[#23a55a]" />
            <StatBox value={pendingCount}   label="Pending" color="text-[#f0b232]" />
            <StatBox value={flaggedCount}   label="Flagged" color="text-[#f23f43]" />
          </div>
        </div>

        {/* Submissions list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#f2f3f5] flex items-center gap-1.5 pb-2 border-b border-[#1f2023]">
            <Hash className="w-4 h-4 text-[#80848e]" />
            <span>My Multitracks ({stems.length})</span>
          </h2>

          {stems.length === 0 ? (
            <div className="bg-[#2b2d31] border border-[#1f2023] p-8 text-center rounded text-xs text-[#949ba4]">
              No multitrack uploads yet. Use the "Publish Stems" button to upload your first session.
            </div>
          ) : (
            stems.map(stem => {
              const statusCfg = STATUS_CONFIG[stem.status] ?? STATUS_CONFIG.published;
              return (
                <div key={stem.id} className="bg-[#2b2d31] border border-[#1f2023] rounded p-4 flex gap-4 text-xs">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start gap-2 flex-wrap">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[#f2f3f5] truncate">{stem.title}</h3>
                        <p className="text-xs text-[#949ba4]">{stem.artist}</p>
                      </div>
                      <span className={clsx(
                        'text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border shrink-0',
                        statusCfg.bg, statusCfg.color
                      )}>
                        {statusCfg.label}
                      </span>
                      {stem.is_verified && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded border border-[#23a55a]/30 bg-[#23a55a]/10 text-[#23a55a] shrink-0">
                          PRO
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 text-[11px] text-[#949ba4]">
                      {stem.bpm && <span>{stem.bpm} BPM</span>}
                      {stem.key && <span>{stem.key}</span>}
                      {stem.track_count && <span>{stem.track_count} tracks</span>}
                      <span>{stem.format}</span>
                      <span>{stem.host_platform}</span>
                    </div>

                    {stem.status === 'pending' && (
                      <p className="text-xs text-[#f0b232] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Awaiting review</span>
                      </p>
                    )}
                    {stem.status === 'flagged' && (
                      <p className="text-xs text-[#f23f43] flex items-center gap-1">
                        <Flag className="w-3.5 h-3.5" />
                        <span>Flagged as dead link</span>
                      </p>
                    )}

                    <p className="text-[11px] text-[#80848e]">
                      Uploaded {getTimeAgo(stem.created_at)}
                      {stem.download_count ? <> &middot; {stem.download_count} downloads</> : null}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0 items-end">
                    {stem.status === 'published' && (
                      <Link
                        href={`/stems/${stem.id}`}
                        className="text-xs text-[#5865F2] hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                    <button
                      onClick={() => setEditingStem(stem)}
                      title="Edit"
                      className="p-1 text-[#949ba4] hover:text-[#5865F2] rounded transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(stem.id)}
                      disabled={deleting === stem.id}
                      title="Delete"
                      className="p-1 text-[#949ba4] hover:text-[#f23f43] rounded transition-colors disabled:opacity-40"
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

function StatBox({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center bg-[#1e1f22] p-2 rounded">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[#949ba4] text-[10px] mt-0.5">{label}</p>
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
