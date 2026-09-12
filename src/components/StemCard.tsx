'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Download, Flag, ExternalLink, Music, Info, Check, Tag } from 'lucide-react';
import { Stem, Profile } from '@/types';
import { AdminBar } from './AdminBar';
import { flagStem, incrementDownloadCount } from '@/app/actions/stems';
import { useToast } from '@/context/ToastContext';
import { clsx } from 'clsx';

const PLATFORM_BADGE: Record<string, string> = {
  'Google Drive': 'bg-blue-950/70 text-blue-300 border-blue-800/60',
  'Dropbox':      'bg-sky-950/70 text-sky-300 border-sky-800/60',
  'OneDrive':     'bg-indigo-950/70 text-indigo-300 border-indigo-800/60',
  'Box':          'bg-purple-950/70 text-purple-300 border-purple-800/60',
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
  const [artworkUrl, setArtworkUrl] = useState<string | null>(stem.cover_url || null);
  const [artworkLoading, setArtworkLoading] = useState(!stem.cover_url);
  const [showNotes, setShowNotes] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const platformBadge = PLATFORM_BADGE[stem.host_platform] ?? PLATFORM_BADGE['Other'];
  const visibleTags = (stem.tags || []).slice(0, 3);

  // Fetch album cover automatically from iTunes Search API if cover_url not provided
  useEffect(() => {
    if (stem.cover_url) {
      setArtworkUrl(stem.cover_url);
      setArtworkLoading(false);
      return;
    }

    let isMounted = true;
    const fetchArtwork = async () => {
      try {
        const query = encodeURIComponent(`${stem.artist} ${stem.title}`);
        const res = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            const hiresUrl = data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
            if (isMounted) setArtworkUrl(hiresUrl);
          }
        }
      } catch {
        // Fallback to placeholder gradient
      } finally {
        if (isMounted) setArtworkLoading(false);
      }
    };

    fetchArtwork();
    return () => { isMounted = false; };
  }, [stem.artist, stem.title, stem.cover_url]);

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
    // Non-blocking download count increment
    incrementDownloadCount(stem.id).catch(() => {});
  };

  const timeAgo = getTimeAgo(stem.created_at);

  return (
    <article
      onClick={() => router.push(`/stems/${stem.id}`)}
      className={clsx(
        'group relative bg-surface border border-border flex flex-col aspect-square overflow-hidden rounded-sm cursor-pointer',
        'hover:border-amber/50 transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,229,255,0.08)]',
        localVerified && 'border-l-2 border-l-amber'
      )}
    >
      {/* Upper 1/3: Album Artwork Cover */}
      <div className="relative h-1/3 w-full overflow-hidden bg-surface-raised border-b border-border shrink-0">
        {artworkUrl ? (
          <img
            src={artworkUrl}
            alt={`${stem.title} by ${stem.artist}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-surface-raised via-obsidian to-surface flex items-center justify-center">
            <Music className="w-8 h-8 text-amber/40" />
          </div>
        )}

        {/* Top Badges overlay */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <span className={clsx(
            'text-[10px] font-body px-2 py-0.5 rounded-sm border shadow-sm backdrop-blur-md font-semibold pointer-events-auto',
            platformBadge
          )}>
            {stem.host_platform}
          </span>

          {localVerified && (
            <span className="text-[10px] font-body text-amber bg-obsidian/80 border border-amber/30 px-2 py-0.5 rounded-sm shadow-sm backdrop-blur-md font-bold flex items-center gap-1">
              <Check className="w-3 h-3" /> PRO SESSION
            </span>
          )}
        </div>

        {/* Description toggle button if description exists */}
        {stem.description && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowNotes(n => !n); }}
            title="Toggle special notes"
            className="absolute bottom-2 right-2 bg-obsidian/80 hover:bg-obsidian border border-border hover:border-amber text-amber p-1 rounded transition-colors backdrop-blur-md"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Middle Content Section */}
      <div className="p-4 flex-1 flex flex-col justify-between min-h-0 bg-surface">

        {showNotes && stem.description ? (
          /* Notes overlay tab */
          <div className="flex-1 overflow-y-auto pr-1 text-xs text-mid font-body space-y-1 animate-[fade-in_0.2s_ease-out]">
            <p className="text-[10px] font-mono text-amber uppercase tracking-wider font-semibold">Special Notes / Details:</p>
            <p className="leading-relaxed text-warm-white whitespace-pre-wrap">{stem.description}</p>
          </div>
        ) : (
          /* Title & Metadata */
          <div className="space-y-2 min-h-0">
            <div>
              <h2 className="font-display text-lg sm:text-xl text-warm-white leading-snug truncate group-hover:text-amber transition-colors">
                {stem.title}
              </h2>
              <p className="text-mid text-xs sm:text-sm font-body truncate mt-0.5">{stem.artist}</p>
            </div>

            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {stem.avg_rating !== undefined && stem.avg_rating > 0 && (
                <div className="flex items-center gap-1 bg-amber/10 border border-amber/30 text-amber rounded-sm px-1.5 py-0.5 text-xs font-body font-bold">
                  <span>★</span>
                  <span>{stem.avg_rating}</span>
                  <span className="text-[10px] text-amber/70 font-normal">({stem.rating_count || 0})</span>
                </div>
              )}
              {stem.comment_count !== undefined && stem.comment_count > 0 && (
                <div className="flex items-center gap-1 bg-surface-raised border border-border text-mid rounded-sm px-1.5 py-0.5 text-xs font-body font-semibold">
                  <span>💬</span>
                  <span>{stem.comment_count}</span>
                </div>
              )}
              {stem.bpm && <MetaPill label="BPM" value={String(stem.bpm)} />}
              {stem.key && <MetaPill label="KEY" value={stem.key} />}
              {stem.track_count && <MetaPill label="TRACKS" value={String(stem.track_count)} />}
              {stem.format && (
                <span className="text-[10px] font-body text-dim border border-border px-1.5 py-0.5 rounded-sm">
                  {formatShort(stem.format)}
                </span>
              )}
            </div>

            {/* Tags */}
            {visibleTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {visibleTags.map(tag => (
                  <span key={tag} className="text-[10px] font-body text-dim/80 bg-surface-raised border border-border/60 px-1.5 py-0.5 rounded-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer row inside 1:1 box */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2 mt-auto shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Link
              href={`/user/${encodeURIComponent(stem.uploader_handle.replace(/^@/, ''))}`}
              onClick={e => e.stopPropagation()}
              className="text-[11px] text-dim font-body truncate hover:text-amber hover:underline transition-colors"
            >
              {stem.uploader_handle}
            </Link>
            <span className="text-dim text-[10px]">-</span>
            <span className="text-[11px] text-dim font-body shrink-0">{timeAgo}</span>
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

          <div className="flex items-center gap-1 shrink-0">
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
              className="flex items-center gap-1 bg-amber hover:bg-amber-muted text-obsidian font-body font-bold text-xs px-2.5 py-1.5 rounded-sm transition-colors uppercase tracking-wider"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Get</span>
            </a>
          </div>
        </div>

      </div>
    </article>
  );
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
