'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Music2,
  Search,
  Plus,
  Calendar,
  HardDrive,
  User as UserIcon,
  Trash2,
  Disc3,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Mix } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { LiquidGlassHeader } from '@/components/liquidglass/LiquidGlassHeader';
import { AudioPlayer } from '@/components/AudioPlayer';
import { UploadMixModal } from '@/components/UploadMixModal';
import { Glass, Button } from '@onlymoein/liquidglass';

export default function BetaMixesPage() {
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
      console.warn('Error fetching mixes in beta:', e);
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

  return (
    <div className="min-h-screen text-white pb-24 transition-colors duration-300">
      <LiquidGlassHeader />

      {/* Hero Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
        <Glass style={{ padding: '32px', borderRadius: '32px' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-white/70 mb-2">
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                <span>COMMUNITY MIX CRITIQUE &amp; SHOWCASE</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                <Music2 className="w-8 h-8 text-pink-400" />
                <span>Mix Showcase</span>
              </h1>
              <p className="text-sm text-white/80 mt-2 max-w-2xl leading-relaxed">
                Audition community mixes with in-browser native playback. Compare interpretations and master buses across all server multitrack drops.
              </p>
            </div>

            {user && (
              <Button variant="filled" size="regular" onClick={() => setUploadOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Submit Mix
              </Button>
            )}
          </div>
        </Glass>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
        {/* Search */}
        <div className="mb-8">
          <Glass style={{ padding: '12px 20px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Search className="w-5 h-5 text-white/50 shrink-0" />
            <input
              type="text"
              placeholder="Search mixes by song title, mixer, or server member..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-0 outline-none text-white placeholder-white/50 w-full text-sm font-medium focus:ring-0"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs font-mono text-white/60 hover:text-white px-2 py-1 rounded-lg bg-white/10"
              >
                Clear
              </button>
            )}
          </Glass>
        </div>

        {/* Mixes List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Disc3 className="w-8 h-8 text-pink-400 animate-spin" />
            <span className="text-sm font-mono text-white/70">Loading audio submissions...</span>
          </div>
        ) : mixes.length === 0 ? (
          <Glass style={{ padding: '48px 24px', borderRadius: '28px', textAlign: 'center' }}>
            <Music2 className="w-10 h-10 text-white/40 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No Mixes Found</h3>
            <p className="text-sm text-white/60 max-w-md mx-auto mb-6">
              {search ? `No mixes match "${search}".` : 'No member mixes uploaded yet. Be the first to submit a mix!'}
            </p>
            {user && (
              <Button variant="filled" size="regular" onClick={() => setUploadOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Upload New Mix
              </Button>
            )}
          </Glass>
        ) : (
          <div className="flex flex-col gap-4">
            {mixes.map((mix) => (
              <Glass
                key={mix.id}
                style={{
                  padding: '20px 24px',
                  borderRadius: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/15 text-white/90 font-medium">
                        {mix.format || 'WAV'}
                      </span>
                      {mix.multi_title && (
                        <Link
                          href={`/multis/${mix.multi_id}`}
                          className="text-xs font-mono text-sky-300 hover:underline flex items-center gap-1"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          {mix.multi_title}
                        </Link>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-white tracking-tight">{mix.title}</h2>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-white/70">
                    <span className="flex items-center gap-1.5 font-medium text-white/90">
                      <UserIcon className="w-3.5 h-3.5 text-sky-400" />
                      {mix.uploader_name || 'Member'}
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
                      {formatSize(mix.size_bytes)}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-white/60">
                      <Calendar className="w-3 h-3" />
                      {mix.created_at ? new Date(mix.created_at).toLocaleDateString() : ''}
                    </span>

                    {(user?.id === mix.owner_id || profile?.role === 'admin') && (
                      <button
                        onClick={() => handleDeleteMix(mix.id, mix.title)}
                        disabled={deletingId === mix.id}
                        className="text-red-400 hover:text-red-300 transition-colors p-1"
                        title="Delete Mix"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Audio Player embedded inside Glass */}
                <div className="pt-1">
                  <AudioPlayer src={mix.public_url} title={mix.title} />
                </div>
              </Glass>
            ))}
          </div>
        )}
      </main>

      <UploadMixModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => fetchMixes(search)}
      />
    </div>
  );
}
