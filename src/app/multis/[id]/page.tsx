'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Layers,
  ArrowLeft,
  Calendar,
  HardDrive,
  User,
  Trash2,
  Plus,
  Music2,
  FileAudio,
  AlertCircle,
  Loader2,
  Download,
  Sliders,
  ChevronDown,
  Sparkles,
  Lock,
  Pencil,
  Disc,
  ExternalLink,
} from 'lucide-react';
import { Multi, MultiTrack, Mix } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { canAccessProMultitracks } from '@/lib/auth/tiers';
import { isUserAdmin } from '@/lib/auth/admin';
import { AudioPlayer } from '@/components/AudioPlayer';
import { UploadMixModal } from '@/components/UploadMixModal';
import { EditMultiModal } from '@/components/EditMultiModal';
import { EditMixModal } from '@/components/EditMixModal';
import { Header } from '@/components/Header';
import { FluidOrb } from '@/components/ui/fluid-orb';

export default function MultiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const multiId = params.id as string;

  const [multi, setMulti] = useState<Multi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mixModalOpen, setMixModalOpen] = useState(false);
  const [editMultiOpen, setEditMultiOpen] = useState(false);
  const [publishingDiscord, setPublishingDiscord] = useState(false);
  const [editingMix, setEditingMix] = useState<Mix | null>(null);
  const [deletingMulti, setDeletingMulti] = useState(false);
  const [deletingTrackId, setDeletingTrackId] = useState<string | null>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [zipNotice, setZipNotice] = useState<string | null>(null);

  const fetchMultiData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/multis/${multiId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Multi not found');
        throw new Error('Failed to load multi');
      }
      const data = await res.json();
      setMulti(data.multi);
    } catch (err: any) {
      setError(err.message || 'Error loading multi details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (multiId) {
      fetchMultiData();
    }
  }, [multiId]);

  const isOwner = user && multi && user.id === multi.owner_id;
  const isAdmin = Boolean(
    profile?.role === 'admin' ||
    user?.role === 'admin' ||
    (user
      ? isUserAdmin({
          email: user.email,
          discordId: (user as any).discord_id || (user as any).user_metadata?.discord_id || (user as any).user_metadata?.provider_id || (user as any).sub,
          username: (user as any).user_metadata?.server_display_name || (user as any).user_metadata?.display_name || (user as any).display_name,
          role: user.role,
          userMetadata: (user as any).user_metadata,
          roles: (user as any).user_metadata?.roles || (user as any).roles || [],
        })
      : false)
  );
  const canManage = isOwner || isAdmin;
  const hasProAccess = !multi?.is_pro || canAccessProMultitracks(user);

  const handleDownloadZip = async () => {
    if (downloadingZip) return;
    setDownloadingZip(true);
    setZipNotice(null);

    try {
      const res = await fetch(`/api/multis/${multiId}/download`, {
        method: 'GET',
        headers: { Accept: 'application/json, application/zip' },
        redirect: 'manual',
      });

      if (res.type === 'opaqueredirect' || res.status === 302 || res.status === 307) {
        window.location.href = `/api/multis/${multiId}/download`;
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 202 || data.status === 'generating') {
          setZipNotice(data.error || 'The ZIP archive is currently being generated. Please wait 1 to 2 minutes and click Download again.');
          fetchMultiData();
        } else {
          alert(data.error || 'Download failed. Please check your membership or try again.');
        }
        return;
      }

      window.location.href = `/api/multis/${multiId}/download`;
    } catch {
      window.location.href = `/api/multis/${multiId}/download`;
    } finally {
      setTimeout(() => setDownloadingZip(false), 2500);
    }
  };

  const handlePublishDiscord = async () => {
    if (!multi) return;
    setPublishingDiscord(true);
    try {
      const res = await fetch(`/api/multis/${multiId}/publish?force=true`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish to Discord');
      setMulti({ ...multi, discord_message_id: data.messageId, discord_thread_id: data.threadId });
      alert('Successfully announced multitrack to Discord.');
    } catch (err: any) {
      alert(err.message || 'Error publishing to Discord');
    } finally {
      setPublishingDiscord(false);
    }
  };

  const handleDeleteMulti = async () => {
    if (!confirm('Are you sure you want to delete this entire multi pack and all its audio stems? This cannot be undone.')) {
      return;
    }

    setDeletingMulti(true);
    try {
      const res = await fetch(`/api/multis/${multiId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      router.push('/multis');
    } catch (err: any) {
      alert(err.message || 'Failed to delete multi');
      setDeletingMulti(false);
    }
  };

  const handleDeleteTrack = async (trackId: string, trackName: string) => {
    if (!confirm(`Delete stem track "${trackName}"?`)) return;

    setDeletingTrackId(trackId);
    try {
      const res = await fetch(`/api/multis/${multiId}/tracks/${trackId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      fetchMultiData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete track');
    } finally {
      setDeletingTrackId(null);
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 MB';
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (secs?: number | null) => {
    if (!secs) return '—';
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0e] flex items-center justify-center text-neutral-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="text-xs font-mono">Loading multitrack session...</span>
      </div>
    );
  }

  if (error || !multi) {
    return (
      <div className="min-h-screen bg-[#0d0d0e] flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-10 h-10 text-neutral-500 mb-3" />
        <h2 className="text-base font-semibold text-white">{error || 'Multi Not Found'}</h2>
        <Link
          href="/"
          className="mt-4 text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Multitracks</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0e] text-neutral-100 pb-24">
      <Header />

      {/* Top Breadcrumb & Action Pill Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4 py-2">
          <Link
            href="/"
            className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Multitracks</span>
          </Link>

          {canManage && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handlePublishDiscord}
                disabled={publishingDiscord}
                className="text-xs text-neutral-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 font-mono"
              >
                {publishingDiscord ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Music2 className="w-3.5 h-3.5" />}
                <span>{multi?.discord_message_id ? 'Re-publish Discord' : 'Publish Discord'}</span>
              </button>

              <button
                onClick={() => setEditMultiOpen(true)}
                className="text-xs text-neutral-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 font-mono"
              >
                <Pencil className="w-3.5 h-3.5 text-neutral-400" />
                <span>Edit</span>
              </button>

              <button
                onClick={handleDeleteMulti}
                disabled={deletingMulti}
                className="text-xs text-neutral-400 hover:text-red-400 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 font-mono"
              >
                {deletingMulti ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rare UI Hero Canvas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3">
        <div className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#121215]/80 backdrop-blur-xl p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]">
          <div className="absolute -right-20 -top-20 opacity-20 blur-2xl pointer-events-none">
            <FluidOrb size={340} color="#2b2d38" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-neutral-300">
                  <Disc className="w-3.5 h-3.5 text-neutral-400" />
                  <span>MULTITRACK MASTER SESSION</span>
                </span>

                {multi.is_pro && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 font-medium">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>PRO MULTITRACK</span>
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                {multi.title}
              </h1>

              {multi.church && (
                <div className="text-sm font-semibold text-emerald-400/90">
                  {multi.church}
                </div>
              )}

              {multi.description && (
                <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed whitespace-pre-line">
                  {multi.description}
                </p>
              )}

              {/* Meta Pills */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-400 pt-2">
                {multi.song_key && (
                  <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-neutral-200">
                    Key: {multi.song_key}
                  </span>
                )}
                {multi.bpm && (
                  <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-neutral-200">
                    {multi.bpm} BPM
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="text-neutral-300">{multi.uploader_name || 'Member'}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{new Date(multi.created_at).toLocaleDateString()}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <FileAudio className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{multi.track_count || 0} stems</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{formatSize(multi.total_size_bytes)}</span>
                </span>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="flex flex-col sm:flex-row md:flex-col items-stretch gap-2.5 shrink-0 pt-2">
              {hasProAccess ? (
                <div className="flex flex-col items-stretch gap-1">
                  <button
                    onClick={handleDownloadZip}
                    disabled={downloadingZip}
                    className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-5 py-2.5 rounded-full transition-all flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-75 cursor-pointer"
                    title="Download all stems bundled as a single ZIP file"
                  >
                    {downloadingZip ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Starting Download...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Download Stems (ZIP)</span>
                      </>
                    )}
                  </button>
                  {zipNotice && (
                    <span className="text-[11px] text-amber-400 font-medium text-center">
                      {zipNotice}
                    </span>
                  )}
                </div>
              ) : (
                <Link
                  href="/membership"
                  className="bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs px-5 py-2.5 rounded-full transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <Lock className="w-4 h-4" />
                  <span>Upgrade to Download</span>
                </Link>
              )}

              <Link
                href="/daw-converter"
                className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-medium text-xs px-5 py-2.5 rounded-full transition-all flex items-center justify-center gap-2"
                title="Convert this structure into a DAW project"
              >
                <Sliders className="w-3.5 h-3.5 text-neutral-400" />
                <span>DAW Session Utility</span>
              </Link>

              {user && (
                <button
                  onClick={() => setMixModalOpen(true)}
                  className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-medium text-xs px-5 py-2.5 rounded-full transition-all flex items-center justify-center gap-2"
                >
                  <Music2 className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Submit a Mix</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-10">
        {/* Isolated Stem Tracks Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-2 font-mono">
              <FileAudio className="w-4 h-4 text-neutral-400" />
              <span>Isolated Audio Stems ({multi.tracks?.length || 0})</span>
            </h2>
          </div>

          {!multi.tracks || multi.tracks.length === 0 ? (
            <div className="rare-card p-12 text-center text-xs text-neutral-500">
              No audio stem files in this pack.
            </div>
          ) : (
            <div className="space-y-3">
              {multi.tracks.map((track: MultiTrack) => {
                const isDifferent = track.original_filename && track.original_filename !== track.stored_filename;

                return (
                  <div
                    key={track.id}
                    className="rare-card p-4 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-white font-mono truncate">
                            {track.stored_filename}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-neutral-300 border border-white/[0.06]">
                            {track.format}
                          </span>
                          {isDifferent && (
                            <span className="text-[10px] font-mono text-neutral-400 bg-white/[0.02] border border-white/[0.04] px-2 py-0.5 rounded-full truncate max-w-xs" title={`Original: ${track.original_filename}`}>
                              (from: {track.original_filename})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-400 shrink-0">
                        <span>{formatSize(track.size_bytes)}</span>
                        <span>•</span>
                        <span>{formatDuration(track.duration_seconds)}</span>
                        <span>•</span>
                        <span>{new Date(track.created_at).toLocaleDateString()}</span>

                        {canManage && (
                          <button
                            onClick={() => handleDeleteTrack(track.id, track.stored_filename)}
                            disabled={deletingTrackId === track.id}
                            className="p-1.5 rounded-full text-neutral-500 hover:text-red-400 hover:bg-red-950/20 transition-colors ml-1"
                            title="Delete this stem track"
                          >
                            {deletingTrackId === track.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <AudioPlayer
                      src={track.public_url}
                      downloadFilename={track.original_filename || track.stored_filename}
                      format={track.format}
                      sizeBytes={track.size_bytes}
                      showDownload={hasProAccess}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Community Mixes for this Multi Section */}
        <div className="pt-8 border-t border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-2 font-mono">
                <Music2 className="w-4 h-4 text-neutral-400" />
                <span>Finished Mixes for this Song ({multi.mixes?.length || 0})</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Community submissions mixed using this stem session.
              </p>
            </div>

            {user && (
              <button
                onClick={() => setMixModalOpen(true)}
                className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Mix</span>
              </button>
            )}
          </div>

          {!multi.mixes || multi.mixes.length === 0 ? (
            <div className="rare-card p-12 text-center text-xs text-neutral-500">
              No mixes uploaded for this song yet. Be the first to balance and submit your mix.
            </div>
          ) : (
            <div className="space-y-3">
              {multi.mixes.map((mix: Mix) => (
                <div
                  key={mix.id}
                  className="rare-card p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-white">{mix.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-neutral-300 border border-white/[0.06]">
                        {mix.format}
                      </span>
                      {mix.is_sunday_review && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950/40 text-purple-300 border border-purple-600/40">
                          SUNDAY REVIEW
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400">
                      <span className="text-neutral-300">{mix.uploader_name || 'Member'}</span>
                      <span>•</span>
                      <span>{new Date(mix.created_at).toLocaleDateString()}</span>
                      {(isAdmin || (user && user.id === mix.owner_id)) && (
                        <button
                          onClick={() => setEditingMix(mix)}
                          className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors ml-1"
                          title="Edit mix details"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <AudioPlayer
                    src={mix.public_url}
                    downloadFilename={`${mix.title}.${mix.format.toLowerCase()}`}
                    format={mix.format}
                    sizeBytes={mix.size_bytes}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <UploadMixModal
        isOpen={mixModalOpen}
        onClose={() => setMixModalOpen(false)}
        defaultMultiId={multi.id}
        onSuccess={fetchMultiData}
      />

      <EditMultiModal
        isOpen={editMultiOpen}
        onClose={() => setEditMultiOpen(false)}
        multi={multi}
        onSuccess={fetchMultiData}
      />

      <EditMixModal
        isOpen={Boolean(editingMix)}
        onClose={() => setEditingMix(null)}
        mix={editingMix}
        onSuccess={fetchMultiData}
      />
    </div>
  );
}
