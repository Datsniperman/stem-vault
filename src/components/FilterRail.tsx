'use client';

import { FilterType } from '@/types';
import { Search, X } from 'lucide-react';

const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'All Sessions',      value: 'All' },
  { label: 'WAV 48k/24-bit',   value: 'WAV (48kHz/24-bit)' },
  { label: 'Multitrack Zip',   value: 'Multitrack Zip' },
  { label: 'Pro Sessions Only', value: 'Verified Only' },
];

export type SortOption = 'recent' | 'rating' | 'comments' | 'tracks';

interface FilterRailProps {
  activeFilter: FilterType;
  search: string;
  sortBy: SortOption;
  onFilterChange: (f: FilterType) => void;
  onSearchChange: (s: string) => void;
  onSortChange: (s: SortOption) => void;
  resultCount: number;
}

export function FilterRail({
  activeFilter,
  search,
  sortBy,
  onFilterChange,
  onSearchChange,
  onSortChange,
  resultCount,
}: FilterRailProps) {
  return (
    <aside className="w-full lg:w-52 xl:w-60 shrink-0">
      <div className="lg:sticky lg:top-[72px] space-y-6">

        {/* Search */}
        <div>
          <label className="block text-xs text-dim font-body mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dim pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Song, artist, handle…"
              className="
                w-full bg-surface border border-border rounded-sm
                pl-8 pr-8 py-2 font-body text-sm text-warm-white
                placeholder:text-dim focus:outline-none focus:border-amber transition-colors
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

        {/* Sort By */}
        <div>
          <label className="block text-xs text-dim font-body mb-2">Sort Sessions</label>
          <select
            value={sortBy}
            onChange={e => onSortChange(e.target.value as SortOption)}
            className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-sm text-warm-white font-body focus:outline-none focus:border-amber"
          >
            <option value="recent">Recently Added</option>
            <option value="rating">Highest Rated (⭐)</option>
            <option value="comments">Most Discussed (💬)</option>
            <option value="tracks">Stem Track Count</option>
          </select>
        </div>

        {/* Filters */}
        <div>
          <p className="text-xs text-dim font-body mb-2">Filter by format</p>
          <nav className="flex flex-col gap-0.5">
            {FILTERS.map(({ label, value }) => {
              const active = activeFilter === value;
              return (
                <button
                  key={value}
                  onClick={() => onFilterChange(value)}
                  className={`
                    w-full text-left px-3 py-1.5 rounded-sm text-sm font-body transition-colors
                    ${active
                      ? 'bg-amber-dim text-amber font-semibold border-l-2 border-amber'
                      : 'text-mid hover:text-warm-white hover:bg-surface-raised'
                    }
                  `}
                >
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Count */}
        <p className="text-xs text-dim font-body">
          {resultCount} {resultCount === 1 ? 'session' : 'sessions'}
        </p>

      </div>
    </aside>
  );
}
