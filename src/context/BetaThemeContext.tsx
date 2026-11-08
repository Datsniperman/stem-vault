'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export type Wallpaper = 'dusk' | 'flow' | 'dawn' | 'lines' | 'obsidian';
export type AppTheme = 'dark' | 'light' | 'system';

interface BetaThemeContextType {
  isBetaMode: boolean;
  setIsBetaMode: (active: boolean) => void;
  toggleBetaMode: () => void;
  wallpaper: Wallpaper;
  setWallpaper: (wall: Wallpaper) => void;
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  transparency: number;
  setTransparency: (t: number) => void;
  bend: number;
  setBend: (b: number) => void;
  rim: number;
  setRim: (r: number) => void;
  zoom: number;
  setZoom: (z: number) => void;
  shine: number;
  setShine: (s: number) => void;
}

const BetaThemeContext = createContext<BetaThemeContextType | undefined>(undefined);

export function BetaThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBetaRoute = pathname?.startsWith('/beta');

  const [isBetaMode, setIsBetaModeState] = useState<boolean>(false);
  const [wallpaper, setWallpaperState] = useState<Wallpaper>('dusk');
  const [theme, setThemeState] = useState<AppTheme>('dark');
  const [transparency, setTransparency] = useState<number>(0.6);
  const [bend, setBend] = useState<number>(32);
  const [rim, setRim] = useState<number>(14);
  const [zoom, setZoom] = useState<number>(1.16);
  const [shine, setShine] = useState<number>(1.0);

  // Load persisted preferences
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedBeta = localStorage.getItem('mv_beta_mode');
      if (savedBeta !== null) {
        setIsBetaModeState(savedBeta === 'true');
      } else if (isBetaRoute) {
        setIsBetaModeState(true);
      }

      const savedWall = localStorage.getItem('mv_wallpaper') as Wallpaper;
      if (savedWall && ['dusk', 'flow', 'dawn', 'lines', 'obsidian'].includes(savedWall)) {
        setWallpaperState(savedWall);
      }

      const savedTheme = localStorage.getItem('mv_theme') as AppTheme;
      if (savedTheme && ['dark', 'light', 'system'].includes(savedTheme)) {
        setThemeState(savedTheme);
      }
    } catch {}
  }, [isBetaRoute]);

  // Keep beta mode active if user navigates to /beta
  useEffect(() => {
    if (isBetaRoute) {
      setIsBetaModeState(true);
    }
  }, [isBetaRoute]);

  const setIsBetaMode = (active: boolean) => {
    setIsBetaModeState(active);
    try {
      localStorage.setItem('mv_beta_mode', active ? 'true' : 'false');
    } catch {}
  };

  const toggleBetaMode = () => {
    setIsBetaMode(!isBetaMode);
  };

  const setWallpaper = (wall: Wallpaper) => {
    setWallpaperState(wall);
    try {
      localStorage.setItem('mv_wallpaper', wall);
    } catch {}
  };

  const setTheme = (t: AppTheme) => {
    setThemeState(t);
    try {
      localStorage.setItem('mv_theme', t);
    } catch {}
  };

  // Sync DOM attributes when beta mode or theme settings change
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    if (isBetaMode) {
      root.setAttribute('data-beta', 'true');
      root.setAttribute('data-wall', wallpaper);
      root.setAttribute('data-theme', theme);
      root.style.setProperty('--lg-transparency', String(transparency));
      root.style.setProperty('--lg-thickness', String(bend));
      root.style.setProperty('--lg-bezel', String(rim));
      root.style.setProperty('--lg-zoom', String(zoom));
      root.style.setProperty('--lg-shine', String(shine));
    } else {
      root.removeAttribute('data-beta');
      root.removeAttribute('data-wall');
      root.removeAttribute('data-theme');
    }
  }, [isBetaMode, wallpaper, theme, transparency, bend, rim, zoom, shine]);

  return (
    <BetaThemeContext.Provider
      value={{
        isBetaMode,
        setIsBetaMode,
        toggleBetaMode,
        wallpaper,
        setWallpaper,
        theme,
        setTheme,
        transparency,
        setTransparency,
        bend,
        setBend,
        rim,
        setRim,
        zoom,
        setZoom,
        shine,
        setShine,
      }}
    >
      {children}
    </BetaThemeContext.Provider>
  );
}

export function useBetaTheme() {
  const context = useContext(BetaThemeContext);
  if (!context) {
    throw new Error('useBetaTheme must be used within a BetaThemeProvider');
  }
  return context;
}
