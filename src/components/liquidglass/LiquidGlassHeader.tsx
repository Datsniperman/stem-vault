'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Toolbar,
  ToolbarGroup,
  Button,
  Menu,
} from '@onlymoein/liquidglass';
import { useAuth } from '@/context/AuthContext';
import { useBetaTheme, Wallpaper, AppTheme } from '@/context/BetaThemeContext';
import { UploadMultiModal } from '@/components/UploadMultiModal';
import { UploadMixModal } from '@/components/UploadMixModal';
import { AuthModal } from '@/components/AuthModal';
import { Sparkles, Layers, Music2, Sliders, Plus, LogIn, LogOut, User } from 'lucide-react';

const WALLPAPERS: { value: Wallpaper; label: string }[] = [
  { value: 'dusk', label: 'Dusk' },
  { value: 'flow', label: 'Flow' },
  { value: 'dawn', label: 'Dawn' },
  { value: 'lines', label: 'Lines' },
  { value: 'obsidian', label: 'Obsidian' },
];

const THEMES: { value: AppTheme; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'Auto' },
];

export function LiquidGlassHeader() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const { isBetaMode, toggleBetaMode, wallpaper, setWallpaper, theme, setTheme } = useBetaTheme();

  const [authOpen, setAuthOpen] = useState(false);
  const [uploadMultiOpen, setUploadMultiOpen] = useState(false);
  const [uploadMixOpen, setUploadMixOpen] = useState(false);

  const displayName =
    profile?.server_display_name ||
    profile?.display_name ||
    user?.user_metadata?.server_display_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'Member';

  const avatarUrl =
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    null;

  return (
    <>
      <header className="sticky top-0 z-50 w-full px-4 sm:px-6 pt-3 pb-2 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Brand & Main Navigation in Liquid Glass Toolbar */}
          <Toolbar aria-label="Main Navigation">
            <ToolbarGroup aria-label="Brand">
              <Link href={isBetaMode ? '/beta' : '/'}>
                <Button size="regular" className="font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-linear-to-tr from-sky-400 to-pink-500 shadow-sm shadow-sky-400/50" />
                  <span>The Mixing Vault</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/20 text-white font-normal">
                    BETA
                  </span>
                </Button>
              </Link>
            </ToolbarGroup>

            <ToolbarGroup aria-label="Sections">
              <Link href={isBetaMode ? '/beta' : '/multis'}>
                <Button
                  size="regular"
                  className={pathname === '/beta' || pathname === '/multis' ? 'font-semibold text-white' : 'text-white/80'}
                >
                  <Layers className="w-4 h-4 mr-1.5 opacity-80" />
                  Multitracks
                </Button>
              </Link>

              <Link href={isBetaMode ? '/beta/mixes' : '/mixes'}>
                <Button
                  size="regular"
                  className={pathname?.includes('/mixes') ? 'font-semibold text-white' : 'text-white/80'}
                >
                  <Music2 className="w-4 h-4 mr-1.5 opacity-80" />
                  Mixes
                </Button>
              </Link>

              <Link href="/beta/lab">
                <Button
                  size="regular"
                  variant={pathname?.includes('/lab') ? 'filled' : 'glass'}
                  className={pathname?.includes('/lab') ? 'font-bold' : ''}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-sky-300" />
                  Glass Lab
                </Button>
              </Link>
            </ToolbarGroup>
          </Toolbar>

          {/* Right: Actions, Theme & Appearance Menu, User Profile */}
          <div className="flex items-center gap-2.5">
            {/* Upload Buttons */}
            {user && (
              <Toolbar aria-label="Upload Actions" className="hidden sm:flex">
                <ToolbarGroup>
                  <Button size="regular" onClick={() => setUploadMultiOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Multi
                  </Button>
                  <Button size="regular" onClick={() => setUploadMixOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Mix
                  </Button>
                </ToolbarGroup>
              </Toolbar>
            )}

            {/* Look & Optics Menu (Wallpaper & Appearance) */}
            <Menu
              aria-label="Liquid Glass Settings"
              label="Optics"
              items={[
                { heading: 'Wallpaper' },
                ...WALLPAPERS.map((w) => ({
                  label: w.label,
                  checked: wallpaper === w.value,
                  keepOpen: true,
                  onSelect: () => setWallpaper(w.value),
                })),
                'separator',
                { heading: 'Appearance' },
                ...THEMES.map((t) => ({
                  label: t.label,
                  checked: theme === t.value,
                  keepOpen: true,
                  onSelect: () => setTheme(t.value),
                })),
                'separator',
                {
                  label: isBetaMode ? 'Switch to Classic Studio UI' : 'Switch to Liquid Glass Beta',
                  onSelect: toggleBetaMode,
                },
              ]}
            />

            {/* User Profile or Discord Login */}
            {user ? (
              <Menu
                aria-label="User Account"
                label={displayName}
                items={[
                  { heading: displayName },
                  { label: 'My Mixes & Sessions', onSelect: () => { window.location.href = '/mixes'; } },
                  { label: 'Discord Server (discord.gg/mixing)', onSelect: () => { window.open('https://discord.gg/mixing', '_blank'); } },
                  'separator',
                  {
                    label: 'Sign Out',
                    destructive: true,
                    onSelect: () => { signOut(); },
                  },
                ]}
              />
            ) : (
              <Button variant="filled" size="regular" onClick={() => setAuthOpen(true)}>
                <LogIn className="w-4 h-4 mr-1.5" />
                Sign in with Discord
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <UploadMultiModal isOpen={uploadMultiOpen} onClose={() => setUploadMultiOpen(false)} />
      <UploadMixModal isOpen={uploadMixOpen} onClose={() => setUploadMixOpen(false)} />
    </>
  );
}
