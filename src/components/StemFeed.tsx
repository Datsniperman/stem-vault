'use client';

import { useState, useMemo } from 'react';
import { Stem, FilterType, SortType } from '@/types';
import { StemCard } from './StemCard';
import { StemDetailModal } from './StemDetailModal';
import { FilterRail } from './FilterRail';
import { Header } from './Header';
import { Hero } from './Hero';
import { DisclaimerModal } from './DisclaimerModal';
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
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
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
      <div className="max-w-7xl mx-auto w-full px-5 sm:px-8 py-10 space-y-8">

        {/* Prominent Full-Width Search Header */}
        <div className="bg-surface border border-amber/30 p-5 sm:p-6 rounded-sm shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl sm:text-2xl text-warm-white font-semibold">Search Session Archive</h2>
              <p className="text-xs text-dim font-body mt-0.5">Find worship multitracks by song title, church/artist name, or uploader handle.</p>
            </div>
            <span className="text-xs font-mono text-amber bg-amber/10 border border-amber/30 px-3 py-1 rounded-sm shrink-0 self-start sm:self-auto font-semibold">
              {filtered.length} {filtered.length === 1 ? 'session' : 'sessions'} available
            </span>
          </div>

          <div className="relative pt-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none text-amber">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by song name, church/artist, or handle (e.g. Compassion, Elevation, @tyler)..."
              className="
                w-full bg-obsidian border border-border focus:border-amber rounded-sm
                pl-12 pr-10 py-3.5 font-body text-base text-warm-white
                placeholder:text-dim/70 focus:outline-none focus:ring-1 focus:ring-amber/50 transition-all shadow-inner
              "
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dim hover:text-amber transition-colors p-1"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Stem Feed Grid */}
        <main className="w-full">
          {filtered.length === 0 ? (
            <EmptyState query={search} hasStems={stems.length > 0} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs font-body text-dim">
            <span>Stem Vault - Community worship multitrack archive</span>
            <span>•</span>
            <button
              onClick={() => setDisclaimerOpen(true)}
              className="text-amber hover:underline transition-colors font-medium"
            >
              Disclaimer & Terms
            </button>
          </div>
          <p className="text-dim text-xs font-body">
            All links are community-sourced. Verify before use.
          </p>
        </div>
      </footer>

      <DisclaimerModal isOpen={disclaimerOpen} onClose={() => setDisclaimerOpen(false)} />
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
