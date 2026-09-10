'use client';

import { useState, useMemo } from 'react';
import { Stem, FilterType, SortType } from '@/types';
import { StemCard } from './StemCard';
import { StemDetailModal } from './StemDetailModal';
import { FilterRail } from './FilterRail';
import { Header } from './Header';
import { Hero } from './Hero';
import { useAuth } from '@/context/AuthContext';

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
  const [selectedStem, setSelectedStem] = useState<{ stem: Stem; artworkUrl: string | null } | null>(null);

  const handleStemAdded = (stem: Stem) => {
    // Pending stems don't appear in the public feed
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
    // 'newest' is already the default order from the server

    return result;
  }, [stems, search, activeFilter, activeTag, sort]);

  const totalTracks    = stems.reduce((sum, s) => sum + (s.track_count ?? 0), 0);
  const activeEngineers = new Set(stems.map(s => s.uploader_handle)).size;

  return (
    <div className="min-h-screen flex flex-col">
      <Header onStemAdded={handleStemAdded} />

      <Hero
        totalSessions={stems.length}
        totalTracks={totalTracks}
        activeEngineers={activeEngineers}
      />

      {/* Main content */}
      <div className="max-w-7xl mx-auto w-full px-5 sm:px-8 py-10 flex flex-col lg:flex-row gap-8">

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

        <main className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <EmptyState query={search} hasStems={stems.length > 0} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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

      <footer className="mt-auto border-t border-border">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-6 flex items-center justify-between gap-4">
          <p className="text-dim text-sm font-body">
            Stem Vault - community worship multitrack archive
          </p>
          <p className="text-dim text-xs font-body">
            All links are community-sourced. Verify before use.
          </p>
        </div>
      </footer>
    </div>
  );
}

function EmptyState({ query, hasStems }: { query: string; hasStems: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <h3
        className="font-display italic text-dim mb-3"
        style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
      >
        {hasStems ? 'No matches' : 'Nothing here yet'}
      </h3>
      <p className="text-dim text-sm font-body max-w-sm">
        {query
          ? <>No results for <span className="text-amber">"{query}"</span>. Try a different search.</>
          : hasStems
          ? 'Try adjusting your filters.'
          : 'Be the first to submit a multitrack session to the archive.'
        }
      </p>
    </div>
  );
}
