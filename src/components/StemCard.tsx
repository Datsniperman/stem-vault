'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Download, Flag, ExternalLink, Music2, Info, Check, Tag, Layers, Disc3, Edit3, MessageCircle } from 'lucide-react';
import { Stem, Profile } from '@/types';
import { AdminBar } from './AdminBar';
import { flagStem, incrementDownloadCount } from '@/app/actions/stems';
import { useToast } from '@/context/ToastContext';
import { clsx } from 'clsx';
import { EditStemModal } from './EditStemModal';

const PLATFORM_BADGE: Record<string, string> = {
  'Google Drive': 'bg-blue-950/60 text-blue-300 border-blue-800/40',
  'Dropbox':      'bg-sky-950/60 text-sky-300 border-sky-800/40',
  'OneDrive':     'bg-indigo-950/60 text-indigo-300 border-indigo-800/40',
  'Box':          'bg-purple-950/60 text-purple-300 border-purple-800/40',
  'Other':        'bg-surface-high text-mid border-border/70',
};

interface StemCardProps {
  stem: Stem;
  profile: Profile | null;
  onDelete: (id: string) => void;
  onVerifyToggle: (id: string, verified: boolean) => void;
  onClick?: (artworkUrl: string | null) => void;
  onStemUpdated?: (updatedStem: Stem) => void;
}

export function StemCard({
  stem: initialStem,
  profile,
  onDelete,
  onVerifyToggle,
  onClick,
  onStemUpdated,
}: StemCardProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [stemData, setStemData] = useState<Stem>(initialStem);
  const [reporting, setReporting] = useState(false);
  const [localVerified, setLocalVerified] = useState(initialStem.is_verified);
  const [showNotes, setShowNotes] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const isOwner = profile?.id && profile.id === stemData.user_id;
  const canEdit = isOwner || isAdmin;

  const platformBadge = PLATFORM_BADGE[stemData.host_platform] ?? PLATFORM_BADGE['Other'];
  const visibleTags = (stemData.tags || []).slice(0, 3);

  const handleStemUpdated = (updatedStem: Stem) => {
    setStemData(updatedStem);
    setLocalVerified(updatedStem.is_verified);
    if (onStemUpdated) {
      onStemUpdated(updatedStem);
    }
  };

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setReporting(true);
    const result = await flagStem(stemData.id);
    addToast(
      result.success ? 'Link reported - thanks for keeping the vault clean.' : result.message,
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
    incrementDownloadCount(stemData.id).catch(() => {});
  };

  const timeAgo = getTimeAgo(stemData.created_at);

  return (
    <article
      onClick={() => router.push(`/stems/${stemData.id}`)}
      className={clsx(
        'group relative bg-surface-raised/80 hover:bg-surface-raised border border-border/80 flex flex-col justify-between overflow-hidden rounded-2xl cursor-pointer p-5 space-y-4 shadow-m3-1 hover:shadow-m3-3 transition-all duration-300 hover:-translate-y-1',
        localVerified && 'ring-1 ring-amber/40 border-amber/30'
      )}
    >
      {/* Top Header: Song Title & Church/Artist */}
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-xl text-warm-white leading-snug group-hover:text-amber transition-colors font-semibold">
            {stemData.title}
          </h2>
          {stemData.description && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowNotes(n => !n); }}
              title="Toggle notes"
              className="w-7 h-7 rounded-full bg-surface-high border border-border/60 hover:border-amber/50 text-amber flex items-center justify-center transition-colors shrink-0"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p className="text-mid text-xs font-medium">{stemData.artist}</p>
      </div>

      {/* M3 Chips Row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="w-6 h-6 rounded-full bg-amber/15 border border-amber/30 flex items-center justify-center shrink-0 text-amber">
          <Disc3 className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform duration-300" />
        </div>
        <span className={clsx(
          'text-[10px] font-medium px-2.5 py-0.5 rounded-full border',
          platformBadge
        )}>
          {stemData.host_platform}
        </span>
        {localVerified && (
          <span className="text-[10px] font-semibold text-amber bg-amber/15 border border-amber/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Check className="w-3 h-3 stroke-[3]" /> PRO SESSION
          </span>
        )}
        {stemData.daw_template_url && (
          <span className="text-[10px] font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-700/50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Layers className="w-3 h-3" /> DAW TEMPLATE
          </span>
        )}
        {stemData.discord_thread_id && (
          <span className="text-[10px] font-medium text-[#5865F2] bg-[#5865F2]/15 border border-[#5865F2]/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <MessageCircle className="w-3 h-3" /> FEEDBACK THREAD
          </span>
        )}
      </div>

      {/* Main Content / Notes */}
      <div className="space-y-3 flex-1">
        {showNotes && stemData.description ? (
          <div className="bg-surface-high/80 border border-border/70 p-3.5 rounded-xl text-xs font-body space-y-1 animate-[fade-in_0.2s_ease-out]">
            <p className="text-[10px] font-mono text-amber uppercase tracking-wider font-semibold">Special Notes:</p>
            <p className="leading-relaxed text-warm-white whitespace-pre-wrap">{stemData.description}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {stemData.avg_rating !== undefined && stemData.avg_rating > 0 && (
                <div className="flex items-center gap-1 bg-amber/15 border border-amber/30 text-amber rounded-full px-2.5 py-0.5 text-xs font-bold">
                  <span>★</span>
                  <span>{stemData.avg_rating}</span>
                </div>
              )}
              {stemData.comment_count !== undefined && stemData.comment_count > 0 && (
                <div className="flex items-center gap-1 bg-surface-high border border-border/70 text-mid rounded-full px-2.5 py-0.5 text-xs font-medium">
                  <span>💬 {stemData.comment_count}</span>
                </div>
              )}
              {stemData.bpm && <MetaPill label="BPM" value={String(stemData.bpm)} />}
              {stemData.key && <MetaPill label="KEY" value={stemData.key} />}
              {stemData.track_count && <MetaPill label="STEMS" value={String(stemData.track_count)} />}
              {stemData.format && (
                <span className="text-[10px] font-medium text-dim bg-surface-high/60 border border-border/50 px-2.5 py-0.5 rounded-full">
                  {formatShort(stemData.format)}
                </span>
              )}
            </div>

            {/* Tags */}
            {visibleTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {visibleTags.map(tag => (
                  <span key={tag} className="text-[10px] font-medium text-dim/80 bg-surface-high/50 border border-border/50 px-2.5 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer / Uploader & Actions */}
      <div className="pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-dim">
          <Link
            href={`/user/${encodeURIComponent(stemData.uploader_handle.replace(/^@/, ''))}`}
            onClick={e => e.stopPropagation()}
            className="hover:text-amber hover:underline transition-colors font-medium text-warm-white/90"
          >
            {stemData.uploader_handle}
          </Link>
          <span>•</span>
          <span>{timeAgo}</span>
          {isAdmin && (
            <div onClick={e => e.stopPropagation()}>
              <AdminBar
                stemId={stemData.id}
                uploaderId={stemData.user_id}
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
            className="w-7 h-7 rounded-full flex items-center justify-center text-dim hover:text-error hover:bg-white/5 transition-colors disabled:opacity-40"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
          {canEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditOpen(true); }}
              title="Edit session details"
              className="w-7 h-7 rounded-full flex items-center justify-center text-dim hover:text-amber hover:bg-white/5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          <a
            href={stemData.download_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDownload}
            className="flex items-center gap-1.5 bg-amber hover:bg-amber-muted text-obsidian font-semibold text-xs px-4 py-2 rounded-full transition-all shadow-m3-1 hover:shadow-m3-2 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Get Stems</span>
          </a>
        </div>
      </div>

      <EditStemModal
        isOpen={isEditOpen}
        stem={stemData}
        onClose={() => setIsEditOpen(false)}
        onStemUpdated={handleStemUpdated}
      />
    </article>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1 bg-surface-high/90 border border-border/70 rounded-full px-2.5 py-0.5">
      <span className="text-[9px] font-mono text-dim uppercase tracking-wide">{label}</span>
      <span className="text-xs font-medium text-warm-white">{value}</span>
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
