'use client';

import { useState, useMemo } from 'react';
import { Stem, FilterType, SortType } from '@/types';
import { StemCard } from './StemCard';
import { FilterRail } from './FilterRail';
import { Header } from './Header';
import { Hero } from './Hero';
import { DisclaimerModal } from './DisclaimerModal';
import { useAuth } from '@/context/AuthContext';
import { Search, Music2, SlidersHorizontal, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col bg-surface text-warm-white">
      <Header onStemAdded={handleStemAdded} />

      <Hero
        totalSessions={stems.length}
        totalTracks={totalTracks}
        activeEngineers={activeEngineers}
      />

      {/* Main Content Layout with M3 FilterRail & Stem Cards */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Left Rail: M3 Filter, Search & Tag Drawer */}
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
            {/* Feed Top Status Bar */}
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Music2 className="w-5 h-5 text-amber" />
                <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-warm-white">
                  Session Feed
                </h2>
                {activeFilter !== 'All' && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber/15 text-amber border border-amber/30 font-medium">
                    {activeFilter}
                  </span>
                )}
                {activeTag && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-high text-warm-white border border-border font-medium">
                    #{activeTag}
                  </span>
                )}
              </div>
              <span className="text-xs font-mono text-dim">
                Showing {filtered.length} of {stems.length}
              </span>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                query={search}
                hasStems={stems.length > 0}
                onReset={() => { setSearch(''); setActiveFilter('All'); setActiveTag(''); }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
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

      {/* M3 Tonal Footer */}
      <footer className="mt-auto border-t border-border/60 bg-surface-raised/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs font-body text-dim">
            <span className="font-medium text-warm-white">The Mixing Vault</span>
            <span>•</span>
            <span>Tyler Kerpsack All Access</span>
            <span>•</span>
            <button
              onClick={() => setDisclaimerOpen(true)}
              className="text-amber hover:underline transition-colors font-medium"
            >
              Terms & Legal
            </button>
          </div>
          <p className="text-dim text-xs font-body">
            Community Multitrack Audio Exchange • All links verified by member submissions
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
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-surface-raised/40 border border-border/60 rounded-3xl p-8 shadow-m3-1">
      <div className="w-16 h-16 rounded-full bg-surface-high border border-border/80 flex items-center justify-center text-dim mb-4">
        <Search className="w-8 h-8 text-amber/60" />
      </div>
      <h3 className="font-display text-2xl font-bold text-warm-white mb-2">
        {hasStems ? 'No matching multitracks' : 'Vault archive is empty'}
      </h3>
      <p className="text-sm font-body text-dim max-w-md mb-6 leading-relaxed">
        {hasStems
          ? `We couldn't find any sessions matching your query "${query}". Try adjusting keywords, removing tag filters, or resetting your search.`
          : 'Be the first engineer to publish a multitrack pack to the community!'}
      </p>
      {hasStems && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 bg-surface-high hover:bg-surface-raised text-warm-white border border-border px-5 py-2.5 rounded-full text-xs font-medium transition-all shadow-m3-1 hover:shadow-m3-2"
        >
          Reset All Filters
        </button>
      )}
    </div>
  );
}
