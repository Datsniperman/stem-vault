'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Download, Flag, ExternalLink, Info, Check, Layers, Disc3, Edit3, MessageCircle } from 'lucide-react';
import { Stem, Profile } from '@/types';
import { AdminBar } from './AdminBar';
import { flagStem, incrementDownloadCount } from '@/app/actions/stems';
import { useToast } from '@/context/ToastContext';
import { clsx } from 'clsx';
import { EditStemModal } from './EditStemModal';

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
      result.success ? 'Reported link.' : result.message,
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
        'group relative bg-[#2b2d31] hover:bg-[#35373c]/60 border border-[#1f2023] rounded p-4 flex flex-col justify-between space-y-3 cursor-pointer transition-colors shadow-sm',
        localVerified ? 'border-l-4 border-l-[#23a55a]' : 'border-l-4 border-l-[#5865F2]'
      )}
    >
      {/* Top Header: Title, Artist, & Badges */}
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-semibold text-[#f2f3f5] group-hover:text-[#5865F2] transition-colors truncate">
              {stemData.title}
            </h2>
            <p className="text-xs text-[#949ba4] truncate font-medium">{stemData.artist}</p>
          </div>

          {stemData.description && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowNotes(n => !n); }}
              title="Toggle notes"
              className="text-[#949ba4] hover:text-[#f2f3f5] p-1 rounded transition-colors shrink-0"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Discord Badges Row */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] font-medium bg-[#1e1f22] text-[#949ba4] border border-[#1f2023] px-2 py-0.5 rounded">
            {stemData.host_platform}
          </span>
          {localVerified && (
            <span className="text-[10px] font-semibold text-[#23a55a] bg-[#23a55a]/10 border border-[#23a55a]/30 px-2 py-0.5 rounded flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" /> PRO
            </span>
          )}
          {stemData.daw_template_url && (
            <span className="text-[10px] font-medium text-[#5865F2] bg-[#5865F2]/10 border border-[#5865F2]/25 px-2 py-0.5 rounded flex items-center gap-1">
              <Layers className="w-3 h-3" /> DAW Template
            </span>
          )}
          {stemData.discord_thread_id && (
            <span className="text-[10px] font-medium text-[#dbdee1] bg-[#1e1f22] border border-[#1f2023] px-2 py-0.5 rounded flex items-center gap-1">
              <MessageCircle className="w-3 h-3 text-[#5865F2]" /> Thread
            </span>
          )}
        </div>
      </div>

      {/* Main Content & Specs */}
      <div className="space-y-2 flex-1">
        {showNotes && stemData.description ? (
          <div className="bg-[#1e1f22] border border-[#1f2023] p-2.5 rounded text-xs text-[#dbdee1] whitespace-pre-wrap">
            <span className="text-[10px] uppercase font-bold text-[#949ba4] block mb-1">Session Notes:</span>
            {stemData.description}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Meta Specs (Discord Embed Fields style) */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {stemData.bpm && <MetaField label="BPM" value={String(stemData.bpm)} />}
              {stemData.key && <MetaField label="Key" value={stemData.key} />}
              {stemData.track_count && <MetaField label="Tracks" value={String(stemData.track_count)} />}
              {stemData.format && (
                <span className="text-[10px] text-[#949ba4] bg-[#1e1f22] border border-[#1f2023] px-2 py-0.5 rounded font-mono">
                  {formatShort(stemData.format)}
                </span>
              )}
              {stemData.avg_rating !== undefined && stemData.avg_rating > 0 && (
                <span className="text-[10px] text-[#f0b232] bg-[#f0b232]/10 border border-[#f0b232]/25 px-2 py-0.5 rounded font-medium">
                  ★ {stemData.avg_rating}
                </span>
              )}
              {stemData.comment_count !== undefined && stemData.comment_count > 0 && (
                <span className="text-[10px] text-[#949ba4] bg-[#1e1f22] border border-[#1f2023] px-2 py-0.5 rounded">
                  💬 {stemData.comment_count}
                </span>
              )}
            </div>

            {/* Tags */}
            {visibleTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {visibleTags.map(tag => (
                  <span key={tag} className="text-[10px] text-[#80848e] bg-[#1e1f22]/70 px-1.5 py-0.2 rounded font-mono">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer / Submitter & Actions */}
      <div className="pt-2 border-t border-[#1f2023] flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 min-w-0 text-[#949ba4]">
          <Link
            href={`/user/${encodeURIComponent(stemData.uploader_handle.replace(/^@/, ''))}`}
            onClick={e => e.stopPropagation()}
            className="hover:text-[#5865F2] hover:underline transition-colors font-medium text-[#f2f3f5] truncate"
          >
            {stemData.uploader_handle}
          </Link>
          <span>•</span>
          <span className="text-[11px] shrink-0">{timeAgo}</span>
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

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleReport}
            disabled={reporting}
            title="Report dead link"
            className="p-1 text-[#949ba4] hover:text-[#f23f43] transition-colors disabled:opacity-40"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
          {canEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditOpen(true); }}
              title="Edit session"
              className="p-1 text-[#949ba4] hover:text-[#5865F2] transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          <a
            href={stemData.download_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDownload}
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
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

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-1 bg-[#1e1f22] border border-[#1f2023] rounded px-2 py-0.5 text-xs">
      <span className="text-[10px] text-[#949ba4]">{label}:</span>
      <span className="text-[11px] font-medium text-[#f2f3f5]">{value}</span>
    </div>
  );
}

function formatShort(format: string): string {
  const map: Record<string, string> = {
    'WAV (48kHz/24-bit)': 'WAV 48k',
    'WAV (44.1kHz/16-bit)': 'WAV 44k',
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
