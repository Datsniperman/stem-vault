'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Music2, Search, Plus, Calendar, HardDrive, User, Trash2, Loader2, Layers } from 'lucide-react';
import { Mix } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { AudioPlayer } from '@/components/AudioPlayer';
import { UploadMixModal } from '@/components/UploadMixModal';

export default function MixesPage() {
  const { user, profile } = useAuth();
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMixes = async (q: string = '') => {
    try {
      setLoading(true);
      const url = q ? `/api/mixes?q=${encodeURIComponent(q)}` : '/api/mixes';
      const res = await fetch(url);
      const data = await res.json();
      setMixes(data.mixes || []);
    } catch (e) {
      console.warn('Error fetching mixes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMixes(search);
  }, [search]);

  const handleDeleteMix = async (mixId: string, title: string) => {
    if (!confirm(`Delete mix "${title}"?`)) return;

    setDeletingId(mixId);
    try {
      const res = await fetch(`/api/mixes/${mixId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete mix');
      }
      fetchMixes(search);
    } catch (err: any) {
      alert(err.message || 'Error deleting mix.');
    } finally {
      setDeletingId(null);
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 pb-20">
      {/* Hero Header */}
      <div className="border-b border-neutral-800 bg-neutral-950/60 backdrop-blur-sm py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>THE MIXING VAULT / COMMUNITY MIXES</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Music2 className="w-7 h-7 text-neutral-300" />
              <span>Listen to Finished Mixes</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
              Listen to community mixes natively in your browser with instant streaming support. Download full-quality untranscoded WAV, FLAC, or MP3 files.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => setUploadOpen(true)}
                className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-4 py-2.5 rounded transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Upload a Mix</span>
              </button>
            ) : (
              <p className="text-xs text-neutral-500 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded">
                Log in to upload your mix
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {/* Search */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search mixes by title or song name..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
            />
          </div>
          <span className="text-xs text-neutral-500 font-mono">
            {mixes.length} {mixes.length === 1 ? 'mix' : 'mixes'}
          </span>
        </div>

        {/* Mixes List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-28 bg-neutral-900/40 border border-neutral-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : mixes.length === 0 ? (
          <div className="border border-neutral-800 rounded-lg p-12 text-center bg-neutral-950/40">
            <Music2 className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-neutral-300">No Mixes Found</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
              {search ? 'Try adjusting your search criteria.' : 'Be the first to share a mix!'}
            </p>
            {user && (
              <button
                onClick={() => setUploadOpen(true)}
                className="mt-4 bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-3.5 py-1.5 rounded transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload First Mix</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {mixes.map((mix: Mix) => {
              const isOwner = user && user.id === mix.owner_id;
              const isAdmin = profile?.role === 'admin';
              const canDelete = isOwner || isAdmin;

              return (
                <div
                  key={mix.id}
                  className="bg-[#121212] border border-neutral-800 rounded-lg p-4 flex flex-col gap-3 transition-colors hover:border-neutral-700"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-semibold text-white">{mix.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {mix.format}
                      </span>
                      {mix.multi_id && (
                        <Link
                          href={`/multis/${mix.multi_id}`}
                          className="text-[11px] font-mono text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                        >
                          <Layers className="w-3 h-3 text-neutral-500" />
                          <span>Multi: {mix.multi_title || 'View Song'}</span>
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-400 shrink-0">
                      <span className="flex items-center gap-1 text-neutral-300">
                        <User className="w-3 h-3 text-neutral-500" />
                        <span>{mix.uploader_name || 'Member'}</span>
                      </span>
                      <span>•</span>
                      <span>{formatSize(mix.size_bytes)}</span>
                      <span>•</span>
                      <span>{formatDuration(mix.duration_seconds)}</span>
                      <span>•</span>
                      <span>{new Date(mix.created_at).toLocaleDateString()}</span>

                      {canDelete && (
                        <button
                          onClick={() => handleDeleteMix(mix.id, mix.title)}
                          disabled={deletingId === mix.id}
                          className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-neutral-800 transition-colors ml-1"
                          title="Delete this mix"
                        >
                          {deletingId === mix.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Native HTML audio element with Range streaming & full-quality untranscoded download */}
                  <AudioPlayer
                    src={mix.public_url}
                    downloadFilename={`${mix.title}.${mix.format.toLowerCase()}`}
                    format={mix.format}
                    sizeBytes={mix.size_bytes}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <UploadMixModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => fetchMixes(search)}
      />
    </div>
  );
}
