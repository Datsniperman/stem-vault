'use client';

import React from 'react';
import { LiquidGlassHeader } from '@/components/liquidglass/LiquidGlassHeader';
import { LiquidGlassLab } from '@/components/liquidglass/LiquidGlassLab';

export default function BetaLabPage() {
  return (
    <div className="min-h-screen text-white pb-24 transition-colors duration-300">
      <LiquidGlassHeader />
      <LiquidGlassLab />
    </div>
  );
}
