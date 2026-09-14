'use client';

import { FilterType, SortType } from '@/types';
import { Search, X } from 'lucide-react';

const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'All Sessions',      value: 'All' },
  { label: 'WAV 48k/24-bit',   value: 'WAV (48kHz/24-bit)' },
  { label: 'Multitrack Zip',   value: 'Multitrack Zip' },
  { label: 'Pro Sessions Only', value: 'Verified Only' },
];

const SORT_OPTIONS: { label: string; value: SortType }[] = [
  { label: 'Newest',          value: 'newest' },
  { label: 'Most Tracks',     value: 'most_tracks' },
  { label: 'Most Downloaded', value: 'most_downloaded' },
];

const COMMON_TAGS = [
  'click track',
  'live recording',
  'studio',
  'multibus',
  'keys heavy',
  'drums split',
  'broadcast',
];

interface FilterRailProps {
  activeFilter: FilterType;
  sort: SortType;
  search: string;
  activeTag: string;
  onFilterChange: (f: FilterType) => void;
  onSortChange: (s: SortType) => void;
  onSearchChange: (s: string) => void;
  onTagChange: (t: string) => void;
  resultCount: number;
}

export function FilterRail({
  activeFilter,
  sort,
  search,
  activeTag,
  onFilterChange,
  onSortChange,
  onSearchChange,
  onTagChange,
  resultCount,
}: FilterRailProps) {
  return (
    <aside className="w-full lg:w-52 xl:w-60 shrink-0">
      <div className="lg:sticky lg:top-[72px] space-y-6">

        {/* Search */}
        <div>
          <label className="block text-xs text-dim font-body mb-2">Search Archive</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dim pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Song, church, handle..."
              className="
                w-full bg-surface border border-border rounded-sm
                pl-8 pr-8 py-2.5 font-body text-sm text-warm-white
                placeholder:text-dim focus:outline-none focus:border-amber transition-colors shadow-sm
              "
            />
            {search && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dim hover:text-warm-white transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Count */}
        <p className="text-xs text-dim font-body">
          {resultCount} {resultCount === 1 ? 'session found' : 'sessions found'}
        </p>

      </div>
    </aside>
  );
}
