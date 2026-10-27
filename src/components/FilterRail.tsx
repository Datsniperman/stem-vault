'use client';

import { FilterType, SortType } from '@/types';
import { Search, X, Check, SlidersHorizontal, Tag as TagIcon } from 'lucide-react';
import { clsx } from 'clsx';

const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'All Sessions', value: 'All' },
  { label: 'Pro Sessions', value: 'Verified Only' },
  { label: 'WAV 48k/24-bit', value: 'WAV (48kHz/24-bit)' },
  { label: 'Multitrack Zip', value: 'Multitrack Zip' },
];

const SORT_OPTIONS: { label: string; value: SortType }[] = [
  { label: 'Newest', value: 'newest' },
  { label: 'Most Tracks', value: 'most_tracks' },
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
    <aside className="w-full lg:w-64 xl:w-72 shrink-0">
      <div className="lg:sticky lg:top-[88px] space-y-6 bg-surface-raised/70 border border-border/80 backdrop-blur-md rounded-3xl p-5 shadow-m3-1">

        {/* Section Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-amber" />
            <h3 className="text-sm font-medium text-warm-white">Filters & Sort</h3>
          </div>
          <span className="text-[11px] font-medium font-mono text-dim bg-surface-high px-2.5 py-0.5 rounded-full border border-border/40">
            {resultCount} {resultCount === 1 ? 'session' : 'sessions'}
          </span>
        </div>

        {/* Search Input (M3 Search Pill) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-mid">Search Archive</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dim pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Song, artist, mixer..."
              className="w-full bg-surface-high border border-border/80 rounded-full pl-9 pr-9 py-2 text-xs text-warm-white placeholder:text-dim/60 focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/40 transition-all"
            />
            {search && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-warm-white transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Categories (M3 Filter Chips) */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-mid">Format & Status</label>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map(f => {
              const selected = activeFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => onFilterChange(f.value)}
                  className={clsx(
                    'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-200',
                    selected
                      ? 'bg-amber/20 text-amber border-amber/50 shadow-sm'
                      : 'bg-surface border-border/70 text-dim hover:text-warm-white hover:bg-surface-high hover:border-border'
                  )}
                >
                  {selected && <Check className="w-3 h-3 stroke-[3]" />}
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort Options (M3 Choice Chips) */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-mid">Sort By</label>
          <div className="flex flex-wrap gap-1.5">
            {SORT_OPTIONS.map(s => {
              const selected = sort === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => onSortChange(s.value)}
                  className={clsx(
                    'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-200',
                    selected
                      ? 'bg-warm-white text-obsidian border-warm-white font-semibold shadow-sm'
                      : 'bg-surface border-border/70 text-dim hover:text-warm-white hover:bg-surface-high'
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Popular Tags */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-mid flex items-center gap-1.5">
              <TagIcon className="w-3 h-3 text-amber" />
              <span>Tags</span>
            </label>
            {activeTag && (
              <button
                onClick={() => onTagChange('')}
                className="text-[10px] text-amber hover:underline font-medium"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_TAGS.map(tag => {
              const selected = activeTag.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  onClick={() => onTagChange(selected ? '' : tag)}
                  className={clsx(
                    'text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all duration-150',
                    selected
                      ? 'bg-amber text-obsidian border-amber font-semibold'
                      : 'bg-surface-high/60 border-border/50 text-dim hover:text-warm-white hover:border-amber/40'
                  )}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </aside>
  );
}
