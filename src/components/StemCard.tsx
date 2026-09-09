'use client';

import { useState } from 'react';
import { Download, Flag, ExternalLink } from 'lucide-react';
import { Stem, Profile } from '@/types';
import { AdminBar } from './AdminBar';
import { flagStem } from '@/app/actions/stems';
import { useToast } from '@/context/ToastContext';
import { clsx } from 'clsx';

const PLATFORM_BADGE: Record<string, string> = {
  'Google Drive': 'bg-blue-950/60 text-blue-300 border-blue-900/60',
  'Dropbox':      'bg-sky-950/60 text-sky-300 border-sky-900/60',
  'OneDrive':     'bg-indigo-950/60 text-indigo-300 border-indigo-900/60',
  'Box':          'bg-purple-950/60 text-purple-300 border-purple-900/60',
  'Other':        'bg-surface-raised text-mid border-border',
};

interface StemCardProps {
  stem: Stem;
  profile: Profile | null;
  onDelete: (id: string) => void;
  onVerifyToggle: (id: string, verified: boolean) => void;
}

export function StemCard({ stem, profile, onDelete, onVerifyToggle }: StemCardProps) {
  const { addToast } = useToast();
  const [reporting, setReporting] = useState(false);
  const [localVerified, setLocalVerified] = useState(stem.is_verified);

  const isAdmin = profile?.role === 'admin';
  const platformBadge = PLATFORM_BADGE[stem.host_platform] ?? PLATFORM_BADGE['Other'];

  const handleReport = async () => {
    setReporting(true);
    const result = await flagStem(stem.id);
    addToast(
      result.success ? 'Link reported — thanks for keeping the archive clean.' : result.message,
      result.success ? 'info' : 'error'
    );
    setReporting(false);
  };

  const handleVerifyToggle = (id: string, verified: boolean) => {
    setLocalVerified(verified);
    onVerifyToggle(id, verified);
  };

  const timeAgo = getTimeAgo(stem.created_at);

  return (
    <article
      className={clsx(
        'group relative bg-surface border border-border flex flex-col',
        'hover:border-border-warm transition-colors duration-200',
        localVerified && 'border-l-2 border-l-verified'
      )}
    >
      {/* Card body */}
      <div className="px-5 pt-5 pb-4 flex-1">

        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 className="font-display text-xl text-warm-white leading-snug truncate">
              {stem.title}
            </h2>
            <p className="text-mid text-sm font-body mt-0.5 truncate">{stem.artist}</p>
          </div>

          {/* Platform + verified */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={clsx(
              'text-xs font-body px-2 py-0.5 rounded-sm border',
              platformBadge
            )}>
              {stem.host_platform}
            </span>
            {localVerified && (
              <span className="text-xs font-body text-verified bg-verified-dim border border-verified/20 px-2 py-0.5 rounded-sm">
                ✓ Verified
              </span>
            )}
          </div>
        </div>

        {/* Metadata pills */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {stem.bpm && (
            <MetaPill label="BPM" value={String(stem.bpm)} />
          )}
          {stem.key && (
            <MetaPill label="Key" value={stem.key} />
          )}
          {stem.track_count && (
            <MetaPill label="Tracks" value={String(stem.track_count)} />
          )}
          {stem.format && (
            <span className="text-xs font-body text-dim border border-border px-2 py-0.5 rounded-sm">
              {formatShort(stem.format)}
            </span>
          )}
        </div>

        {/* Tags */}
        {stem.tags.length > 0 && (
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            {stem.tags.map(tag => (
              <span
                key={tag}
                className="text-xs font-body text-dim hover:text-mid transition-colors cursor-default"
              >
                #{tag.replace(/\s+/g, '')}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-dim font-body truncate">{stem.uploader_handle}</span>
          <span className="text-dim text-xs hidden sm:inline">·</span>
          <span className="text-xs text-dim font-body hidden sm:inline">{timeAgo}</span>
          {isAdmin && (
            <AdminBar
              stemId={stem.id}
              uploaderId={stem.user_id}
              isVerified={localVerified}
              onDelete={onDelete}
              onVerifyToggle={handleVerifyToggle}
            />
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReport}
            disabled={reporting}
            title="Report dead or restricted link"
            className="p-1.5 text-dim hover:text-error transition-colors disabled:opacity-40"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
          <a
            href={stem.download_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-amber hover:bg-amber-muted text-obsidian font-body font-semibold text-sm px-3.5 py-1.5 rounded-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>
        </div>
      </div>
    </article>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1 bg-surface-raised border border-border rounded-sm px-2 py-0.5">
      <span className="text-[10px] font-body text-dim uppercase tracking-wide">{label}</span>
      <span className="text-xs font-body font-semibold text-warm-white">{value}</span>
    </div>
  );
}

function formatShort(format: string): string {
  const map: Record<string, string> = {
    'WAV (48kHz/24-bit)': 'WAV 48k/24',
    'FLAC':               'FLAC',
    'Reaper Session':     'Reaper',
    'Pro Tools Session':  'Pro Tools',
    'Studio One':         'Studio One',
    'Ableton Live':       'Ableton',
  };
  return map[format] ?? format;
}

function getTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30)  return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
