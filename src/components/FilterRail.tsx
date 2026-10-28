'use client';

import { FilterType, SortType } from '@/types';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { clsx } from 'clsx';

const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'All Sessions', value: 'All' },
  { label: 'Verified Only', value: 'Verified Only' },
  { label: 'WAV (48kHz/24-bit)', value: 'WAV (48kHz/24-bit)' },
  { label: 'Multitrack Zip', value: 'Multitrack Zip' },
];

const SORT_OPTIONS: { label: string; value: SortType }[] = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Most Stems', value: 'most_tracks' },
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
    <aside className="w-full lg:w-60 xl:w-64 shrink-0">
      <div className="lg:sticky lg:top-[72px] space-y-6 bg-[#121212] border border-neutral-800/80 rounded-lg p-4 shadow-sm">

        {/* Search Input */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400">Search</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Song title, artist..."
              className="w-full bg-[#0d0d0e] border border-neutral-800 rounded pl-8 pr-7 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Format Filter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">Categories</span>
            <span className="text-[10px] text-neutral-500 font-mono">{resultCount} items</span>
          </div>
          <div className="space-y-0.5">
            {FILTERS.map(f => {
              const selected = activeFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => onFilterChange(f.value)}
                  className={clsx(
                    'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded transition-colors text-left font-medium',
                    selected
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                  )}
                >
                  <span className="truncate">{f.label}</span>
                  {selected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort Options */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 pb-1">
            <ArrowUpDown className="w-3 h-3 text-neutral-500" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">Sort</span>
          </div>
          <div className="space-y-0.5">
            {SORT_OPTIONS.map(s => {
              const selected = sort === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => onSortChange(s.value)}
                  className={clsx(
                    'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded transition-colors text-left font-medium',
                    selected
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                  )}
                >
                  <span>{s.label}</span>
                  {selected && <span className="text-white text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-0.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">Tags</span>
            {activeTag && (
              <button
                onClick={() => onTagChange('')}
                className="text-[10px] text-neutral-400 hover:text-white transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {COMMON_TAGS.map(tag => {
              const selected = activeTag.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  onClick={() => onTagChange(selected ? '' : tag)}
                  className={clsx(
                    'text-[11px] px-2 py-0.5 rounded border transition-colors',
                    selected
                      ? 'bg-white text-black border-white font-medium'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </aside>
  );
}
