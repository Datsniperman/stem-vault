'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Download, Flag, ExternalLink, Music2, Info, Check, Tag, Layers, Disc3 } from 'lucide-react';
import { Stem, Profile } from '@/types';
import { AdminBar } from './AdminBar';
import { flagStem, incrementDownloadCount } from '@/app/actions/stems';
import { useToast } from '@/context/ToastContext';
import { clsx } from 'clsx';

const PLATFORM_BADGE: Record<string, string> = {
  'Google Drive': 'bg-blue-950/60 text-blue-300 border-blue-800/50',
  'Dropbox':      'bg-sky-950/60 text-sky-300 border-sky-800/50',
  'OneDrive':     'bg-indigo-950/60 text-indigo-300 border-indigo-800/50',
  'Box':          'bg-purple-950/60 text-purple-300 border-purple-800/50',
  'Other':        'bg-surface-raised text-mid border-border',
};

interface StemCardProps {
  stem: Stem;
  profile: Profile | null;
  onDelete: (id: string) => void;
  onVerifyToggle: (id: string, verified: boolean) => void;
  onClick?: (artworkUrl: string | null) => void;
}

export function StemCard({ stem, profile, onDelete, onVerifyToggle, onClick }: StemCardProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [reporting, setReporting] = useState(false);
  const [localVerified, setLocalVerified] = useState(stem.is_verified);
  const [showNotes, setShowNotes] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const platformBadge = PLATFORM_BADGE[stem.host_platform] ?? PLATFORM_BADGE['Other'];
  const visibleTags = (stem.tags || []).slice(0, 3);

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setReporting(true);
    const result = await flagStem(stem.id);
    addToast(
      result.success ? 'Link reported - thanks for keeping the archive clean.' : result.message,
      result.success ? 'info' : 'error'
    );
    setReporting(false);
  };

  const handleVerifyToggle = (id: string, verified: boolean) => {
    setLocalVerified(verified);
    onVerifyToggle(id, verified);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    incrementDownloadCount(stem.id).catch(() => {});
  };

  const timeAgo = getTimeAgo(stem.created_at);

  return (
    <article
      onClick={() => router.push(`/stems/${stem.id}`)}
      className={clsx(
        'group relative bg-surface border border-border flex flex-col justify-between overflow-hidden rounded-sm cursor-pointer p-5',
        'hover:border-amber/60 transition-all duration-200 hover:shadow-[0_4px_24px_rgba(255,183,3,0.08)] hover:-translate-y-0.5',
        localVerified && 'border-l-2 border-l-amber'
      )}
    >
      {/* Top Bar: Icon, Badges & Notes Toggle */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-amber/10 border border-amber/30 rounded-sm flex items-center justify-center shrink-0 group-hover:bg-amber group-hover:text-obsidian text-amber transition-colors">
            <Disc3 className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
          </div>
          <span className={clsx(
            'text-[10px] font-body px-2 py-0.5 rounded-sm border font-semibold',
            platformBadge
          )}>
            {stem.host_platform}
          </span>
          {localVerified && (
            <span className="text-[10px] font-body text-amber bg-amber/10 border border-amber/30 px-2 py-0.5 rounded-sm font-bold flex items-center gap-1">
              <Check className="w-3 h-3" /> PRO SESSION
            </span>
          )}
        </div>

        {stem.description && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowNotes(n => !n); }}
            title="Toggle special notes"
            className="bg-obsidian border border-border hover:border-amber text-amber p-1.5 rounded transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-3 flex-1">
        {showNotes && stem.description ? (
          <div className="bg-obsidian/60 border border-border/80 p-3 rounded text-xs font-body space-y-1 animate-[fade-in_0.2s_ease-out]">
            <p className="text-[10px] font-mono text-amber uppercase tracking-wider font-semibold">Special Notes:</p>
            <p className="leading-relaxed text-warm-white whitespace-pre-wrap">{stem.description}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <h2 className="font-display text-xl text-warm-white leading-snug group-hover:text-amber transition-colors line-clamp-1">
                {stem.title}
              </h2>
              <p className="text-mid text-xs font-body font-medium truncate mt-0.5">{stem.artist}</p>
            </div>

            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {stem.avg_rating !== undefined && stem.avg_rating > 0 && (
                <div className="flex items-center gap-1 bg-amber/10 border border-amber/30 text-amber rounded-sm px-2 py-0.5 text-xs font-body font-bold">
                  <span>★</span>
                  <span>{stem.avg_rating}</span>
                </div>
              )}
              {stem.comment_count !== undefined && stem.comment_count > 0 && (
                <div className="flex items-center gap-1 bg-surface-raised border border-border text-mid rounded-sm px-2 py-0.5 text-xs font-body font-semibold">
                  <span>💬 {stem.comment_count}</span>
                </div>
              )}
              {stem.bpm && <MetaPill label="BPM" value={String(stem.bpm)} />}
              {stem.key && <MetaPill label="KEY" value={stem.key} />}
              {stem.track_count && <MetaPill label="STEMS" value={String(stem.track_count)} />}
              {stem.format && (
                <span className="text-[10px] font-body text-dim border border-border px-2 py-0.5 rounded-sm">
                  {formatShort(stem.format)}
                </span>
              )}
            </div>

            {/* Tags */}
            {visibleTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {visibleTags.map(tag => (
                  <span key={tag} className="text-[10px] font-body text-dim/80 bg-surface-raised border border-border/60 px-2 py-0.5 rounded-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Link
            href={`/user/${encodeURIComponent(stem.uploader_handle.replace(/^@/, ''))}`}
            onClick={e => e.stopPropagation()}
            className="text-xs text-dim font-body truncate hover:text-amber hover:underline transition-colors"
          >
            {stem.uploader_handle}
          </Link>
          <span className="text-dim text-xs">-</span>
          <span className="text-xs text-dim font-body shrink-0">{timeAgo}</span>
          {isAdmin && (
            <div onClick={e => e.stopPropagation()}>
              <AdminBar
                stemId={stem.id}
                uploaderId={stem.user_id}
                isVerified={localVerified}
                onDelete={onDelete}
                onVerifyToggle={handleVerifyToggle}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReport}
            disabled={reporting}
            title="Report link"
            className="p-1 text-dim hover:text-error transition-colors disabled:opacity-40"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
          <a
            href={stem.download_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDownload}
            className="flex items-center gap-1.5 bg-amber hover:bg-amber-muted text-obsidian font-body font-bold text-xs px-3.5 py-1.5 rounded-sm transition-colors uppercase tracking-wider shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Get Stems</span>
          </a>
        </div>
      </div>
    </article>
  );
}
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1 bg-surface-raised border border-border rounded-sm px-1.5 py-0.5">
      <span className="text-[9px] font-body text-dim uppercase tracking-wide">{label}</span>
      <span className="text-xs font-body font-semibold text-warm-white">{value}</span>
    </div>
  );
}

function formatShort(format: string): string {
  const map: Record<string, string> = {
    'WAV (48kHz/24-bit)': 'WAV 48k/24',
    'WAV (44.1kHz/16-bit)': 'WAV 44k/16',
    'FLAC': 'FLAC',
    'Multitrack Zip': 'Zip',
  };
  return map[format] ?? format;
}

function getTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 30)  return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
