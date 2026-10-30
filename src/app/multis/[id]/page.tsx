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
} from 'lucide-react';
import { Multi, MultiTrack, Mix } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { AudioPlayer } from '@/components/AudioPlayer';
import { UploadMixModal } from '@/components/UploadMixModal';
import { Header } from '@/components/Header';

export default function MultiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const multiId = params.id as string;

  const [multi, setMulti] = useState<Multi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mixModalOpen, setMixModalOpen] = useState(false);
  const [deletingMulti, setDeletingMulti] = useState(false);
  const [deletingTrackId, setDeletingTrackId] = useState<string | null>(null);

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
  const isAdmin = profile?.role === 'admin';
  const canManage = isOwner || isAdmin;

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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-neutral-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="text-sm">Loading stem preview files...</span>
      </div>
    );
  }

  if (error || !multi) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
        <h2 className="text-base font-semibold text-white">{error || 'Multi Not Found'}</h2>
        <Link
          href="/multis"
          className="mt-4 text-xs text-neutral-400 hover:text-white flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Multis</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 pb-24">
      <Header />
      {/* Top Breadcrumb & Actions Bar */}
      <div className="border-b border-neutral-800 bg-[#0d0d0d] px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/multis"
            className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Multitracks</span>
          </Link>

          {canManage && (
            <button
              onClick={handleDeleteMulti}
              disabled={deletingMulti}
              className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-900/60 px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5"
              title="Delete this entire multi pack"
            >
              {deletingMulti ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Delete Multi</span>
            </button>
          )}
        </div>
      </div>

      {/* Multi Info Header */}
      <div className="border-b border-neutral-800 bg-neutral-950/40 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>MULTITRACK PREVIEW PACK</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {multi.title}
              </h1>

              {multi.description && (
                <p className="text-xs sm:text-sm text-neutral-300 mt-2 max-w-3xl whitespace-pre-line">
                  {multi.description}
                </p>
              )}

              {/* Meta pills */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-400 mt-4">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-neutral-500" />
                  <strong className="text-neutral-200">{multi.uploader_name || 'Member'}</strong>
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

            <div className="flex items-center gap-3 shrink-0">
              {user && (
                <button
                  onClick={() => setMixModalOpen(true)}
                  className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-medium text-xs px-3.5 py-2 rounded transition-colors flex items-center gap-2 shadow-xs"
                >
                  <Music2 className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Submit a Mix for this Song</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Stems and Mixes */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-10">
        {/* Isolated Stem Tracks Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
              <FileAudio className="w-4 h-4 text-neutral-400" />
              <span>Preview Files & Audio Stems ({multi.tracks?.length || 0})</span>
            </h2>
            <span className="text-[11px] text-neutral-500 font-mono">
              Native web playback • Exact untranscoded downloads
            </span>
          </div>

          {!multi.tracks || multi.tracks.length === 0 ? (
            <div className="border border-neutral-800 rounded-lg p-8 text-center text-xs text-neutral-500">
              No audio stem files in this pack.
            </div>
          ) : (
            <div className="space-y-3">
              {multi.tracks.map((track: MultiTrack) => {
                const isDifferent = track.original_filename && track.original_filename !== track.stored_filename;

                return (
                  <div
                    key={track.id}
                    className="bg-[#121212] border border-neutral-800 rounded-lg p-3.5 flex flex-col gap-2.5 transition-colors hover:border-neutral-700"
                  >
                    {/* Metadata line */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-white font-mono truncate">
                            {track.stored_filename}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                            {track.format}
                          </span>
                          {isDifferent && (
                            <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-1.5 py-0.2 rounded truncate max-w-xs" title={`Original: ${track.original_filename}`}>
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
                            className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-neutral-800 transition-colors ml-1"
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

                    {/* Native HTML Audio Player with Range/Streaming Support */}
                    <AudioPlayer
                      src={track.public_url}
                      downloadFilename={track.original_filename || track.stored_filename}
                      format={track.format}
                      sizeBytes={track.size_bytes}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Community Mixes for this Multi Section */}
        <div className="pt-6 border-t border-neutral-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <Music2 className="w-4 h-4 text-neutral-400" />
                <span>Mixes for this Song ({multi.mixes?.length || 0})</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Community submissions mixed using this stem pack.
              </p>
            </div>

            {user && (
              <button
                onClick={() => setMixModalOpen(true)}
                className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Mix</span>
              </button>
            )}
          </div>

          {!multi.mixes || multi.mixes.length === 0 ? (
            <div className="border border-neutral-800 rounded-lg p-8 text-center text-xs text-neutral-500">
              No mixes uploaded for this song yet. Be the first to upload your mix!
            </div>
          ) : (
            <div className="space-y-3">
              {multi.mixes.map((mix: Mix) => (
                <div
                  key={mix.id}
                  className="bg-[#121212] border border-neutral-800 rounded-lg p-3.5 flex flex-col gap-2.5 transition-colors hover:border-neutral-700"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{mix.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {mix.format}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-400">
                      <span>Mixed by <strong className="text-neutral-200">{mix.uploader_name || 'Member'}</strong></span>
                      <span>•</span>
                      <span>{formatSize(mix.size_bytes)}</span>
                      <span>•</span>
                      <span>{formatDuration(mix.duration_seconds)}</span>
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
    </div>
  );
}
