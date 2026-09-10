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
          <label className="block text-xs text-dim font-body mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dim pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Song, artist, handle..."
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

        {/* Sort */}
        <div>
          <p className="text-xs text-dim font-body mb-2">Sort by</p>
          <nav className="flex flex-col gap-0.5">
            {SORT_OPTIONS.map(({ label, value }) => {
              const active = sort === value;
              return (
                <button
                  key={value}
                  onClick={() => onSortChange(value)}
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

        {/* Tags */}
        <div>
          <p className="text-xs text-dim font-body mb-2">Filter by tag</p>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_TAGS.map(tag => {
              const active = activeTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => onTagChange(active ? '' : tag)}
                  className={`text-[11px] font-body px-2 py-0.5 rounded-sm border transition-colors ${
                    active
                      ? 'bg-amber-dim text-amber border-amber/40 font-semibold'
                      : 'text-dim border-border hover:text-warm-white hover:border-border/80'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Count */}
        <p className="text-xs text-dim font-body">
          {resultCount} {resultCount === 1 ? 'session' : 'sessions'}
        </p>

      </div>
    </aside>
  );
}
