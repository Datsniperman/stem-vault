'use client';

import { FilterType } from '@/types';
import { Search, X } from 'lucide-react';

const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'All sessions',     value: 'All' },
  { label: 'WAV 48k/24-bit',  value: 'WAV (48kHz/24-bit)' },
  { label: 'Reaper',          value: 'Reaper Session' },
  { label: 'Multitrack',      value: 'Multitrack' },
  { label: 'Click & Guide',   value: 'Click & Guide' },
  { label: 'Broadcast Mix',   value: 'Broadcast Mix' },
  { label: 'Verified only',   value: 'Verified Only' },
];

interface FilterRailProps {
  activeFilter: FilterType;
  search: string;
  onFilterChange: (f: FilterType) => void;
  onSearchChange: (s: string) => void;
  resultCount: number;
}

export function FilterRail({
  activeFilter,
  search,
  onFilterChange,
  onSearchChange,
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
              placeholder="Song, artist, uploader…"
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

        {/* Filters */}
        <div>
          <p className="text-xs text-dim font-body mb-2">Filter by type</p>
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
                      ? 'bg-amber/10 text-amber'
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
          {resultCount} {resultCount === 1 ? 'result' : 'results'}
        </p>

      </div>
    </aside>
  );
}
