'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Music2,
  Search,
  X,
  Plus,
  Calendar,
  HardDrive,
  User,
  Trash2,
  Loader2,
  Layers,
  Sparkles,
  Pencil,
  Disc,
} from 'lucide-react';
import { Mix } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { AudioPlayer } from '@/components/AudioPlayer';
import { UploadMixModal } from '@/components/UploadMixModal';
import { EditMixModal } from '@/components/EditMixModal';
import { Header } from '@/components/Header';
import { FluidOrb } from '@/components/ui/fluid-orb';
import { AnimatedCounter } from '@/components/ui/animated-counter';

export default function MixesPage() {
  const { user, profile } = useAuth();
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [search, setSearch] = useState('');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'sunday'>('all');
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editingMix, setEditingMix] = useState<Mix | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMixes = async (q: string = '', sundayOnly: boolean = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', queryTrim(q));
      if (sundayOnly) params.set('sunday_review', 'true');
      const url = params.toString() ? `/api/mixes?${params.toString()}` : '/api/mixes';
      const res = await fetch(url);
      const data = await res.json();
      setMixes(data.mixes || []);
    } catch (e) {
      console.warn('Error fetching mixes:', e);
    } finally {
      setLoading(false);
    }
  };

  const queryTrim = (val: string) => val.trim();

  useEffect(() => {
    fetchMixes(search, reviewFilter === 'sunday');
  }, [search, reviewFilter]);

  const handleDeleteMix = async (mixId: string, title: string) => {
    if (!confirm(`Delete mix "${title}"?`)) return;

    setDeletingId(mixId);
    try {
      const res = await fetch(`/api/mixes/${mixId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete mix');
      }
      fetchMixes(search, reviewFilter === 'sunday');
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
    <div className="min-h-screen bg-[#0d0d0e] text-neutral-100 pb-24">
      <Header />

      {/* Rare UI Hero Canvas */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-6">
        <div className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#121215]/80 backdrop-blur-xl p-8 sm:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]">
          <div className="absolute -right-16 -top-16 opacity-25 blur-2xl pointer-events-none">
            <FluidOrb size={360} color="#2b2d38" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>COMMUNITY MIX GALLERY</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
                <Music2 className="w-8 h-8 text-neutral-300 shrink-0" />
                <span>Finished Mixes & Critiques</span>
              </h1>

              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Stream finished community mixes natively in high definition. Plus and Premium members can upload their own takes, compare processing chains, and get feedback.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-3 text-xs font-mono">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-neutral-500">Total Mixes:</span>
                  <AnimatedCounter value={mixes.length} className="text-white font-semibold" />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
              {user ? (
                <button
                  onClick={() => setUploadOpen(true)}
                  className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-5 py-3 rounded-full transition-all flex items-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload a Mix</span>
                </button>
              ) : (
                <div className="text-xs text-neutral-400 bg-white/[0.04] border border-white/[0.08] px-4 py-2.5 rounded-full">
                  Connect Discord to upload
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-8 space-y-6">
        {/* Search Bar & Rare UI Filter Capsules */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by mix or song name..."
              className="w-full bg-[#141416]/90 border border-white/[0.08] hover:border-white/[0.15] rounded-full pl-11 pr-10 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-all backdrop-blur-xl shadow-xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#141416]/90 border border-white/[0.08] backdrop-blur-xl shrink-0">
            <button
              onClick={() => setReviewFilter('all')}
              className={`text-xs px-4 py-1.5 rounded-full font-medium transition-all ${
                reviewFilter === 'all'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Mixes
            </button>
            <button
              onClick={() => setReviewFilter('sunday')}
              className={`text-xs px-4 py-1.5 rounded-full font-medium transition-all flex items-center gap-1.5 ${
                reviewFilter === 'sunday'
                  ? 'bg-white text-black shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
              <span>Sunday Reviews</span>
            </button>
          </div>
        </div>

        {/* Mixes List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div
                key={n}
                className="h-28 rounded-[20px] bg-white/[0.02] border border-white/[0.06] animate-pulse"
              />
            ))}
          </div>
        ) : mixes.length === 0 ? (
          <div className="rounded-[28px] border border-white/[0.08] p-16 text-center bg-[#141416]/60 backdrop-blur-xl">
            <Music2 className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-neutral-200">No Mixes Found</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
              {search
                ? 'Try adjusting your search criteria.'
                : reviewFilter === 'sunday'
                ? 'No Sunday Mix Reviews submitted yet. Premium members can flag mixes for pro review.'
                : 'Be the first to share a mix.'}
            </p>
            {user && (
              <button
                onClick={() => setUploadOpen(true)}
                className="mt-5 bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-4 py-2 rounded-full transition-all inline-flex items-center gap-1.5"
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
                  className="rare-card p-5 flex flex-col gap-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-semibold text-white">{mix.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-neutral-300 border border-white/[0.08]">
                        {mix.format}
                      </span>
                      {mix.is_sunday_review && (
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                          SUNDAY REVIEW
                        </span>
                      )}
                      {mix.multi_id && (
                        <Link
                          href={`/multis/${mix.multi_id}`}
                          className="text-[11px] font-mono text-neutral-400 hover:text-white bg-white/[0.04] border border-white/[0.06] px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-colors"
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
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-neutral-500" />
                        <span>{new Date(mix.created_at).toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-neutral-500" />
                        <span>{formatSize(mix.size_bytes)}</span>
                      </span>

                      {canDelete && (
                        <div className="flex items-center gap-1 pl-2 border-l border-white/[0.08]">
                          <button
                            onClick={() => setEditingMix(mix)}
                            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                            title="Edit Mix Details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMix(mix.id, mix.title)}
                            disabled={deletingId === mix.id}
                            className="p-1 rounded-full text-neutral-500 hover:text-red-400 hover:bg-red-950/20 transition-colors disabled:opacity-50"
                            title="Delete Mix"
                          >
                            {deletingId === mix.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <AudioPlayer
                    src={mix.public_url}
                    title={mix.title}
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
        onSuccess={() => fetchMixes(search, reviewFilter === 'sunday')}
      />

      {editingMix && (
        <EditMixModal
          isOpen={Boolean(editingMix)}
          onClose={() => setEditingMix(null)}
          mix={editingMix}
          onSuccess={() => {
            setEditingMix(null);
            fetchMixes(search, reviewFilter === 'sunday');
          }}
        />
      )}
    </div>
  );
}
