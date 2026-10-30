'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Layers, Search, Plus, Calendar, HardDrive, Music, User as UserIcon } from 'lucide-react';
import { Multi } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { UploadMultiModal } from '@/components/UploadMultiModal';

export default function MultisPage() {
  const { user } = useAuth();
  const [multis, setMultis] = useState<Multi[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  const fetchMultis = async (query: string = '') => {
    try {
      setLoading(true);
      const url = query ? `/api/multis?q=${encodeURIComponent(query)}` : '/api/multis';
      const res = await fetch(url);
      const data = await res.json();
      setMultis(data.multis || []);
    } catch (e) {
      console.warn('Error fetching multis:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMultis(search);
  }, [search]);

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 MB';
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 pb-20">
      {/* Hero Header */}
      <div className="border-b border-neutral-800 bg-neutral-950/60 backdrop-blur-sm py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>THE MIXING VAULT / MULTITRACKS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Layers className="w-7 h-7 text-neutral-300" />
              <span>Multitrack Song Archive</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
              Download clean stem packs or preview individual isolated tracks directly in your browser. Upload full multitrack ZIP archives up to 500 MB.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => setUploadOpen(true)}
                className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-4 py-2.5 rounded transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Multi (ZIP)</span>
              </button>
            ) : (
              <p className="text-xs text-neutral-500 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded">
                Log in to upload stems
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {/* Search Bar */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search multis by title or notes..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
            />
          </div>
          <span className="text-xs text-neutral-500 font-mono">
            {multis.length} {multis.length === 1 ? 'pack' : 'packs'}
          </span>
        </div>

        {/* Multis Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-44 bg-neutral-900/40 border border-neutral-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : multis.length === 0 ? (
          <div className="border border-neutral-800 rounded-lg p-12 text-center bg-neutral-950/40">
            <Layers className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-neutral-300">No Multitracks Found</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
              {search ? 'Try adjusting your search criteria.' : 'Be the first to upload a multitrack stem pack ZIP archive!'}
            </p>
            {user && (
              <button
                onClick={() => setUploadOpen(true)}
                className="mt-4 bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-3.5 py-1.5 rounded transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload First Multi</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {multis.map(m => (
              <Link
                key={m.id}
                href={`/multis/${m.id}`}
                className="bg-[#121212] hover:bg-[#161616] border border-neutral-800 hover:border-neutral-700 rounded-lg p-4 transition-all flex flex-col justify-between group shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-white group-hover:text-neutral-200 transition-colors line-clamp-1">
                      {m.title}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 shrink-0 flex items-center gap-1">
                      <Music className="w-3 h-3 text-neutral-400" />
                      <span>{m.track_count || 0} stems</span>
                    </span>
                  </div>

                  {m.description && (
                    <p className="text-xs text-neutral-400 line-clamp-2 mb-3">
                      {m.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500 font-mono mt-2">
                  <div className="flex items-center gap-1 text-neutral-400 truncate max-w-[150px]">
                    <UserIcon className="w-3 h-3 text-neutral-500 shrink-0" />
                    <span className="truncate">{m.uploader_name || 'Member'}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-neutral-500" />
                      <span>{formatSize(m.total_size_bytes)}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-neutral-500" />
                      <span>{new Date(m.created_at).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <UploadMultiModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => fetchMultis(search)}
      />
    </div>
  );
}
