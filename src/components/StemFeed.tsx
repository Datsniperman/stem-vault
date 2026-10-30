'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Stem, SortType } from '@/types';
import { StemCard } from './StemCard';
import { Header } from './Header';
import { Hero } from './Hero';
import { DisclaimerModal } from './DisclaimerModal';
import { useAuth } from '@/context/AuthContext';
import { Search, X, ArrowUpDown } from 'lucide-react';

interface StemFeedProps {
  initialStems: Stem[];
}

export function StemFeed({ initialStems }: StemFeedProps) {
  const { profile } = useAuth();
  const [stems, setStems] = useState<Stem[]>(initialStems);
  const [sort, setSort] = useState<SortType>('newest');
  const [search, setSearch] = useState('');
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
      // ONLY searchable thing is the name of the song
      return !q || stem.title.toLowerCase().includes(q);
    });

    // Sort
    if (sort === 'most_tracks') {
      result = [...result].sort((a, b) => (b.track_count ?? 0) - (a.track_count ?? 0));
    } else if (sort === 'most_downloaded') {
      result = [...result].sort((a, b) => (b.download_count ?? 0) - (a.download_count ?? 0));
    } else {
      result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [stems, search, sort]);

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
        {/* Full-width Search Bar across the top */}
        <div className="mb-6 space-y-3">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by song name..."
              className="w-full bg-[#121212] border border-neutral-800 hover:border-neutral-700 rounded-lg pl-10 pr-10 py-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors shadow-xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-mono">
              {filtered.length} {filtered.length === 1 ? 'song found' : 'songs found'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase text-neutral-500 flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3" /> Sort:
              </span>
              <select
                value={sort}
                onChange={e => setSort(e.target.value as SortType)}
                className="bg-[#121212] border border-neutral-800 text-neutral-300 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-neutral-500 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="most_tracks">Most Stems</option>
                <option value="most_downloaded">Most Downloaded</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Multis Grid (Full Width, No Sidebar) */}
        <main className="w-full min-w-0">
          {filtered.length === 0 ? (
            <EmptyState
              query={search}
              hasStems={stems.length > 0}
              onReset={() => setSearch('')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
          ? `Could not find any multitracks with the song name "${query}".`
          : 'Be the first member to publish multitrack stems to the vault.'}
      </p>
      {hasStems && (
        <button
          onClick={onReset}
          className="bg-white hover:bg-neutral-200 text-black text-xs font-semibold px-3 py-1.5 rounded transition-colors"
        >
          Reset Search
        </button>
      )}
    </div>
  );
}
