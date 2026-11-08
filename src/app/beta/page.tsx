'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  Search,
  Plus,
  Calendar,
  HardDrive,
  Music,
  User as UserIcon,
  Download,
  Sparkles,
  Disc3,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { Multi } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { LiquidGlassHeader } from '@/components/liquidglass/LiquidGlassHeader';
import { LiquidGlassLab } from '@/components/liquidglass/LiquidGlassLab';
import { UploadMultiModal } from '@/components/UploadMultiModal';
import { Glass, Button, SegmentedControl } from '@onlymoein/liquidglass';

type TabView = 'multis' | 'lab';

export default function BetaPage() {
  const { user } = useAuth();
  const [multis, setMultis] = useState<Multi[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabView>('multis');

  const fetchMultis = async (query: string = '') => {
    try {
      setLoading(true);
      const url = query ? `/api/multis?q=${encodeURIComponent(query)}` : '/api/multis';
      const res = await fetch(url);
      const data = await res.json();
      setMultis(data.multis || []);
    } catch (e) {
      console.warn('Error fetching multis in beta:', e);
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
    <div className="min-h-screen text-white pb-24 transition-colors duration-300">
      <LiquidGlassHeader />

      {/* Hero Banner with Liquid Glass Accent */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
        <Glass style={{ padding: '32px', borderRadius: '32px' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-white/70 mb-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <span>LIQUID GLASS BETA • iOS 27 PARITY RETHEME</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-sky-400" />
                <span>The Mixing Vault Beta</span>
              </h1>
              <p className="text-sm text-white/80 mt-2 max-w-2xl leading-relaxed">
                Refracted materials, translucent studio audio cards, and Apple Liquid Glass physics. Download lossless session ZIPs or audition isolated stems with edge light bending.
              </p>
            </div>

            {/* View Switcher: Multis vs Optics Lab */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <SegmentedControl
                aria-label="Beta Views"
                value={currentTab}
                onValueChange={(val) => setCurrentTab(val as TabView)}
                items={[
                  { value: 'multis', label: 'Multitracks' },
                  { value: 'lab', label: 'Optics Lab' },
                ]}
              />

              {user && currentTab === 'multis' && (
                <Button variant="filled" size="regular" onClick={() => setUploadOpen(true)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  New Multi
                </Button>
              )}
            </div>
          </div>
        </Glass>
      </div>

      {/* Tab 1: Multitracks in Liquid Glass Cards */}
      {currentTab === 'multis' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
          {/* Glass Search & Filter Bar */}
          <div className="mb-8">
            <Glass style={{ padding: '12px 20px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Search className="w-5 h-5 text-white/50 shrink-0" />
              <input
                type="text"
                placeholder="Search multitrack sessions, artists, or genres..."
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

          {/* Multitrack Sessions Grid */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Disc3 className="w-8 h-8 text-sky-400 animate-spin" />
              <span className="text-sm font-mono text-white/70">Rendering glass materials...</span>
            </div>
          ) : multis.length === 0 ? (
            <Glass style={{ padding: '48px 24px', borderRadius: '28px', textAlign: 'center' }}>
              <Layers className="w-10 h-10 text-white/40 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No Multitracks Found</h3>
              <p className="text-sm text-white/60 max-w-md mx-auto mb-6">
                {search ? `No multitracks match "${search}".` : 'Be the first to upload a multitrack session to the vault!'}
              </p>
              {user && (
                <Button variant="filled" size="regular" onClick={() => setUploadOpen(true)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Upload First Session
                </Button>
              )}
            </Glass>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {multis.map((multi) => (
                <Glass
                  key={multi.id}
                  style={{
                    padding: '24px',
                    borderRadius: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '20px',
                    minHeight: '260px',
                  }}
                >
                  {/* Card Header & Metadata */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white/15 text-white/90 font-medium">
                        {multi.track_count || 0} Isolated Stems
                      </span>
                      <span className="text-[11px] font-mono text-white/70 flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                        {formatSize(multi.total_size_bytes)}
                      </span>
                    </div>

                    <h2 className="text-xl font-extrabold text-white tracking-tight line-clamp-1 mb-1">
                      {multi.title}
                    </h2>

                    {multi.description && (
                      <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                        {multi.description}
                      </p>
                    )}
                  </div>

                  {/* Card Footer: Uploader & Action Buttons */}
                  <div className="pt-4 border-t border-white/15 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs text-white/70">
                      <span className="flex items-center gap-1.5 font-medium text-white/90">
                        <UserIcon className="w-3.5 h-3.5 text-sky-400" />
                        {multi.uploader_name || 'Member'}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-white/60">
                        <Calendar className="w-3 h-3" />
                        {multi.created_at ? new Date(multi.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Link href={`/multis/${multi.id}`} className="flex-1">
                        <Button variant="filled" size="regular" className="w-full justify-center font-semibold">
                          Explore Stems
                        </Button>
                      </Link>

                      <a
                        href={`/api/multis/${multi.id}/download`}
                        title="Direct Download Full ZIP Archive"
                      >
                        <Button size="regular" aria-label="Download ZIP Archive">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </Glass>
              ))}
            </div>
          )}
        </main>
      )}

      {/* Tab 2: Embedded Liquid Glass Optics Lab (#lab) */}
      {currentTab === 'lab' && <LiquidGlassLab />}

      {/* Upload Modal */}
      <UploadMultiModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => fetchMultis(search)}
      />
    </div>
  );
}
