'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Stem, FilterType, SortType } from '@/types';
import { StemCard } from './StemCard';
import { FilterRail } from './FilterRail';
import { Header } from './Header';
import { Hero } from './Hero';
import { DisclaimerModal } from './DisclaimerModal';
import { useAuth } from '@/context/AuthContext';
import { Search } from 'lucide-react';

interface StemFeedProps {
  initialStems: Stem[];
}

export function StemFeed({ initialStems }: StemFeedProps) {
  const { profile } = useAuth();
  const [stems, setStems] = useState<Stem[]>(initialStems);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [sort, setSort] = useState<SortType>('newest');
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  const handleStemAdded = (stem: Stem) => {
    setStems(prev => [stem, ...prev]);
  };

  const handleDelete = (id: string) => {
    setStems(prev => prev.filter(s => s.id !== id));
  };

  const handleVerifyToggle = (id: string, verified: boolean) => {
    setStems(prev => prev.map(s => s.id === id ? { ...s, is_verified: verified } : s));
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = stems.filter(stem => {
      const matchesSearch = !q ||
        stem.title.toLowerCase().includes(q) ||
        stem.artist.toLowerCase().includes(q) ||
        stem.uploader_handle.toLowerCase().includes(q) ||
        (stem.description || '').toLowerCase().includes(q);

      let matchesFilter = true;
      if (activeFilter === 'Verified Only') {
        matchesFilter = stem.is_verified;
      } else if (activeFilter !== 'All') {
        matchesFilter = stem.format === activeFilter;
      }

      const matchesTag = !activeTag ||
        (stem.tags || []).some(t => t.toLowerCase() === activeTag.toLowerCase());

      return matchesSearch && matchesFilter && matchesTag;
    });

    // Sort
    if (sort === 'most_tracks') {
      result = [...result].sort((a, b) => (b.track_count ?? 0) - (a.track_count ?? 0));
    } else if (sort === 'most_downloaded') {
      result = [...result].sort((a, b) => (b.download_count ?? 0) - (a.download_count ?? 0));
    }

    return result;
  }, [stems, search, activeFilter, activeTag, sort]);

  const totalTracks = stems.reduce((sum, s) => sum + (s.track_count ?? 0), 0);
  const activeEngineers = new Set(stems.map(s => s.uploader_handle)).size;

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-neutral-200">
      <Header onStemAdded={handleStemAdded} />

      <Hero
        totalSessions={stems.length}
        totalTracks={totalTracks}
        activeEngineers={activeEngineers}
      />

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Left Filter Rail */}
          <FilterRail
            activeFilter={activeFilter}
            sort={sort}
            search={search}
            activeTag={activeTag}
            onFilterChange={setActiveFilter}
            onSortChange={setSort}
            onSearchChange={setSearch}
            onTagChange={setActiveTag}
            resultCount={filtered.length}
          />

          {/* Main Feed */}
          <main className="flex-1 w-full min-w-0">
            {/* Status Bar */}
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-neutral-800/80">
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-semibold text-white">
                  Sessions
                </h2>
                {activeFilter !== 'All' && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
                    {activeFilter}
                  </span>
                )}
                {activeTag && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
                    {activeTag}
                  </span>
                )}
              </div>
              <span className="text-xs text-neutral-400 font-mono">
                {filtered.length} {filtered.length === 1 ? 'pack' : 'packs'}
              </span>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                query={search}
                hasStems={stems.length > 0}
                onReset={() => { setSearch(''); setActiveFilter('All'); setActiveTag(''); }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map(stem => (
                  <StemCard
                    key={stem.id}
                    stem={stem}
                    profile={profile}
                    onDelete={handleDelete}
                    onVerifyToggle={handleVerifyToggle}
                  />
                ))}
              </div>
            )}
          </main>

        </div>
      </div>

      {/* Minimal Footer */}
      <footer className="mt-auto border-t border-neutral-800/80 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-white font-medium">The Mixing Vault</span>
            <span className="text-neutral-500">•</span>
            <span className="text-neutral-400">Tyler Kerpsack All Access</span>
            <span className="text-neutral-500">•</span>
            <button
              onClick={() => setDisclaimerOpen(true)}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              Guidelines
            </button>
            <span className="text-neutral-500">•</span>
            <Link href="/terms" className="text-neutral-400 hover:text-white transition-colors">
              Terms
            </Link>
            <span className="text-neutral-500">•</span>
            <Link href="/privacy" className="text-neutral-400 hover:text-white transition-colors">
              Privacy
            </Link>
            <span className="text-neutral-500">•</span>
            <Link href="/dmca" className="text-neutral-400 hover:text-white transition-colors">
              DMCA
            </Link>
          </div>
          <p className="text-[11px] text-neutral-400">
            Multitrack Audio Archive • Tyler Kerpsack Discord Integration
          </p>
        </div>
      </footer>

      <DisclaimerModal isOpen={disclaimerOpen} onClose={() => setDisclaimerOpen(false)} />
    </div>
  );
}

function EmptyState({
  query,
  hasStems,
  onReset,
}: {
  query: string;
  hasStems: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-[#121212] border border-neutral-800/80 rounded-lg p-6">
      <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 mb-3">
        <Search className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">
        {hasStems ? 'No matching multitracks' : 'No multitracks available yet'}
      </h3>
      <p className="text-xs text-neutral-400 max-w-sm mb-4 leading-relaxed">
        {hasStems
          ? `Could not find any multitracks matching "${query}". Try another search or reset filters.`
          : 'Be the first member to publish multitrack stems to the vault.'}
      </p>
      {hasStems && (
        <button
          onClick={onReset}
          className="bg-white hover:bg-neutral-200 text-black text-xs font-semibold px-3 py-1.5 rounded transition-colors"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}
