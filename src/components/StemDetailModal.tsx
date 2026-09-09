'use client';

import { useState } from 'react';
import { X, Download, Flag, Check, Music, Calendar, User, ExternalLink, HardDrive, Layers, FileAudio } from 'lucide-react';
import { Stem, Profile } from '@/types';
import { flagStem } from '@/app/actions/stems';
import { useToast } from '@/context/ToastContext';
import { clsx } from 'clsx';
import { AdminBar } from './AdminBar';

const PLATFORM_BADGE: Record<string, string> = {
  'Google Drive': 'bg-blue-950/80 text-blue-300 border-blue-800/80',
  'Dropbox':      'bg-sky-950/80 text-sky-300 border-sky-800/80',
  'OneDrive':     'bg-indigo-950/80 text-indigo-300 border-indigo-800/80',
  'Box':          'bg-purple-950/80 text-purple-300 border-purple-800/80',
  'Other':        'bg-surface-raised text-mid border-border',
};

interface StemDetailModalProps {
  stem: Stem | null;
  artworkUrl: string | null;
  profile: Profile | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onVerifyToggle: (id: string, verified: boolean) => void;
}

export function StemDetailModal({
  stem,
  artworkUrl,
  profile,
  isOpen,
  onClose,
  onDelete,
  onVerifyToggle,
}: StemDetailModalProps) {
  const { addToast } = useToast();
  const [reporting, setReporting] = useState(false);

  if (!isOpen || !stem) return null;

  const isAdmin = profile?.role === 'admin';
  const platformBadge = PLATFORM_BADGE[stem.host_platform] ?? PLATFORM_BADGE['Other'];
  const formattedDate = new Date(stem.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleReport = async () => {
    setReporting(true);
    const result = await flagStem(stem.id);
    addToast(
      result.success ? 'Link reported — thanks for keeping the archive clean.' : result.message,
      result.success ? 'info' : 'error'
    );
    setReporting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-obsidian/85 backdrop-blur-md animate-[fade-in_0.15s_ease-out]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface border border-border rounded-sm w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-[scale-in_0.2s_ease-out]">

        {/* Modal Header bar */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-surface-raised">
          <div className="flex items-center gap-2">
            <span className={clsx(
              'text-xs font-body px-2.5 py-1 rounded-sm border font-semibold',
              platformBadge
            )}>
              {stem.host_platform}
            </span>
            {stem.is_verified && (
              <span className="text-xs font-body text-amber bg-obsidian/90 border border-amber/40 px-2.5 py-1 rounded-sm font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> PRO SESSION
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-dim hover:text-warm-white p-1.5 transition-colors rounded-sm hover:bg-surface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-1">
          {/* Main Top Banner: Album cover + Main info */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-sm overflow-hidden bg-surface-raised border border-border shrink-0 shadow-md">
              {artworkUrl ? (
                <img
                  src={artworkUrl}
                  alt={`${stem.title} by ${stem.artist}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-surface-raised via-obsidian to-surface flex items-center justify-center">
                  <Music className="w-12 h-12 text-amber/40" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3 min-w-0">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl text-warm-white leading-tight">
                  {stem.title}
                </h1>
                <p className="text-amber text-base sm:text-lg font-body mt-1 font-semibold">{stem.artist}</p>
              </div>

              <div className="pt-2 flex flex-wrap gap-2 text-xs font-body text-dim">
                <div className="flex items-center gap-1.5 bg-obsidian border border-border px-3 py-1.5 rounded-sm">
                  <User className="w-3.5 h-3.5 text-amber" />
                  <span>Submitted by <strong className="text-warm-white font-medium">{stem.uploader_handle}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 bg-obsidian border border-border px-3 py-1.5 rounded-sm">
                  <Calendar className="w-3.5 h-3.5 text-amber" />
                  <span>Added {formattedDate}</span>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="pt-3 flex flex-wrap items-center gap-3">
                <a
                  href={stem.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-amber hover:bg-amber-muted text-obsidian font-body font-bold text-sm px-6 py-2.5 rounded-sm transition-colors uppercase tracking-wider shadow-lg hover:shadow-amber/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Stems ({stem.host_platform})</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70 ml-1" />
                </a>

                <button
                  onClick={handleReport}
                  disabled={reporting}
                  className="flex items-center gap-1.5 text-xs text-dim hover:text-error border border-border hover:border-error/50 px-3 py-2 rounded-sm transition-colors disabled:opacity-40"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report Dead Link</span>
                </button>
              </div>
            </div>
          </div>

          {/* Session Technical Specifications */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-amber font-semibold">
              Session Technical Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SpecBox
                icon={<Music className="w-4 h-4 text-amber" />}
                label="Tempo"
                value={stem.bpm ? `${stem.bpm} BPM` : 'Unspecified'}
              />
              <SpecBox
                icon={<FileAudio className="w-4 h-4 text-amber" />}
                label="Musical Key"
                value={stem.key || 'Unspecified'}
              />
              <SpecBox
                icon={<Layers className="w-4 h-4 text-amber" />}
                label="Stem Count"
                value={stem.track_count ? `${stem.track_count} Tracks` : 'Unspecified'}
              />
              <SpecBox
                icon={<HardDrive className="w-4 h-4 text-amber" />}
                label="Format / Quality"
                value={stem.format}
              />
            </div>
          </div>

          {/* Special Notes & Details */}
          {stem.description && (
            <div className="space-y-2 bg-surface-raised border border-border p-4 rounded-sm">
              <h3 className="text-xs font-mono uppercase tracking-wider text-amber font-semibold">
                Special Notes & Session Details
              </h3>
              <p className="text-sm font-body text-warm-white leading-relaxed whitespace-pre-wrap">
                {stem.description}
              </p>
            </div>
          )}

          {/* Admin Controls section */}
          {isAdmin && (
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="text-xs font-body text-error font-semibold">Admin Controls</span>
              <AdminBar
                stemId={stem.id}
                uploaderId={stem.user_id}
                isVerified={stem.is_verified}
                onDelete={(id) => {
                  onDelete(id);
                  onClose();
                }}
                onVerifyToggle={onVerifyToggle}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function SpecBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-obsidian border border-border p-3 rounded-sm space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-dim font-body">
        {icon}
        <span>{label}</span>
      </div>
      <p className="font-body font-semibold text-sm text-warm-white truncate">{value}</p>
    </div>
  );
}
