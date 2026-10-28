'use client';

import { FilterType, SortType } from '@/types';
import { Search, X, Hash, SlidersHorizontal, Tag as TagIcon, ArrowUpDown } from 'lucide-react';
import { clsx } from 'clsx';

const FILTERS: { label: string; channel: string; value: FilterType }[] = [
  { label: 'All Sessions', channel: 'all-sessions', value: 'All' },
  { label: 'Pro Sessions', channel: 'pro-sessions', value: 'Verified Only' },
  { label: 'WAV 48k/24-bit', channel: 'wav-48k-24bit', value: 'WAV (48kHz/24-bit)' },
  { label: 'Multitrack Zip', channel: 'multitrack-zips', value: 'Multitrack Zip' },
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
      <div className="lg:sticky lg:top-[68px] space-y-5 bg-[#2b2d31] border border-[#1f2023] rounded p-4 shadow-sm">

        {/* Search Input (Discord Search Style) */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">Search Archive</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#949ba4] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search song, artist..."
              className="w-full bg-[#1e1f22] border border-[#1f2023] rounded pl-8 pr-7 py-1.5 text-xs text-[#dbdee1] placeholder-[#949ba4] focus:outline-none focus:border-[#5865F2] transition-colors"
            />
            {search && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#949ba4] hover:text-[#f2f3f5] transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Format Channels / Categories */}
        <div className="space-y-1">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">Channels</span>
            <span className="text-[10px] text-[#80848e] font-mono">{resultCount} items</span>
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
                      ? 'bg-[#35373c] text-[#f2f3f5]'
                      : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
                  )}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Hash className={clsx('w-3.5 h-3.5', selected ? 'text-[#f2f3f5]' : 'text-[#80848e]')} />
                    <span className="truncate">{f.channel}</span>
                  </div>
                  {selected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5865F2] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort Options */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 pb-1">
            <ArrowUpDown className="w-3 h-3 text-[#949ba4]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">Sort Order</span>
          </div>
          <div className="space-y-0.5">
            {SORT_OPTIONS.map(s => {
              const selected = sort === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => onSortChange(s.value)}
                  className={clsx(
                    'w-full flex items-center justify-between px-2.5 py-1 text-xs rounded transition-colors text-left font-medium',
                    selected
                      ? 'bg-[#35373c] text-[#f2f3f5]'
                      : 'text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]'
                  )}
                >
                  <span>{s.label}</span>
                  {selected && <span className="text-[#5865F2] font-bold text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] flex items-center gap-1">
              <TagIcon className="w-3 h-3" />
              <span>Tags</span>
            </span>
            {activeTag && (
              <button
                onClick={() => onTagChange('')}
                className="text-[10px] text-[#5865F2] hover:underline"
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
                    'text-[11px] font-medium px-2 py-0.5 rounded border transition-colors',
                    selected
                      ? 'bg-[#5865F2] text-white border-[#5865F2]'
                      : 'bg-[#1e1f22] border-[#1f2023] text-[#949ba4] hover:text-[#dbdee1] hover:border-[#3f4147]'
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
