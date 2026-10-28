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
import { Hash, Search } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col bg-[#313338] text-[#dbdee1]">
      <Header onStemAdded={handleStemAdded} />

      <Hero
        totalSessions={stems.length}
        totalTracks={totalTracks}
        activeEngineers={activeEngineers}
      />

      {/* Main Content Layout with Discord-style Channels & Stem Cards */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Left Channel & Filter Rail */}
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

          {/* Main Channel Forum Posts */}
          <main className="flex-1 w-full min-w-0">
            {/* Feed Status Bar */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1f2023]">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-[#80848e]" />
                <h2 className="text-sm font-semibold text-[#f2f3f5]">
                  sessions
                </h2>
                {activeFilter !== 'All' && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-[#35373c] text-[#dbdee1] border border-[#3f4147]">
                    {activeFilter}
                  </span>
                )}
                {activeTag && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-[#35373c] text-[#dbdee1] border border-[#3f4147]">
                    #{activeTag}
                  </span>
                )}
              </div>
              <span className="text-xs text-[#949ba4] font-mono">
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

      {/* Clean Discord Server Footer */}
      <footer className="mt-auto border-t border-[#1f2023] bg-[#2b2d31]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#949ba4]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#f2f3f5] font-semibold">The Mixing Vault</span>
            <span>•</span>
            <span>Tyler Kerpsack All Access</span>
            <span>•</span>
            <button
              onClick={() => setDisclaimerOpen(true)}
              className="text-[#5865F2] hover:underline transition-colors"
            >
              Guidelines & Rules
            </button>
            <span>•</span>
            <Link href="/terms" className="hover:text-[#f2f3f5] hover:underline transition-colors">
              Terms
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-[#f2f3f5] hover:underline transition-colors">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/dmca" className="hover:text-[#f2f3f5] hover:underline transition-colors">
              DMCA
            </Link>
          </div>
          <p className="text-[11px]">
            Community Multitrack Audio Exchange • Integrated with KerpBot
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
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-[#2b2d31] border border-[#1f2023] rounded p-6">
      <div className="w-10 h-10 rounded bg-[#1e1f22] flex items-center justify-center text-[#949ba4] mb-3">
        <Search className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-[#f2f3f5] mb-1">
        {hasStems ? 'No matching multitracks' : 'No multitracks available yet'}
      </h3>
      <p className="text-xs text-[#949ba4] max-w-sm mb-4">
        {hasStems
          ? `Could not find any multitracks matching "${query}". Try another search or reset filters.`
          : 'Be the first member to publish multitrack stems to the vault!'}
      </p>
      {hasStems && (
        <button
          onClick={onReset}
          className="bg-[#35373c] hover:bg-[#383a40] text-[#f2f3f5] px-3.5 py-1.5 rounded text-xs transition-colors"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}
