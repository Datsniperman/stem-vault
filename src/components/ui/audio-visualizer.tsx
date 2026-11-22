'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface AudioVisualizerProps {
  isPlaying?: boolean;
  bars?: number;
  className?: string;
  barClassName?: string;
}

export function AudioVisualizer({
  isPlaying = false,
  bars = 4,
  className,
  barClassName,
}: AudioVisualizerProps) {
  const barHeights = ['h-2', 'h-4', 'h-3', 'h-5', 'h-3', 'h-2'];

  return (
    <div className={cn('flex items-end gap-[2px] h-5', className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'w-[3px] rounded-full transition-all duration-300',
            isPlaying
              ? i % 4 === 0
                ? 'bg-emerald-400 animate-eq-1'
                : i % 4 === 1
                ? 'bg-neutral-200 animate-eq-2'
                : i % 4 === 2
                ? 'bg-neutral-400 animate-eq-3'
                : 'bg-emerald-300 animate-eq-4'
              : 'bg-neutral-600 h-1',
            isPlaying ? undefined : barHeights[i % barHeights.length],
            barClassName
          )}
        />
      ))}
    </div>
  );
}
