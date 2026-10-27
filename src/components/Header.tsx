'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, User, Shield, Music2, Settings, Disc3, Plus } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { AuthModal } from './AuthModal';
import { SubmitStemModal } from './SubmitStemModal';
import { AdminModal } from './AdminModal';
import { SettingsModal } from './SettingsModal';
import { BugReportModal } from './BugReportModal';
import { UpdateLogsModal } from './UpdateLogsModal';
import { DisclaimerModal } from './DisclaimerModal';
import Link from 'next/link';
import { Stem } from '@/types';

interface HeaderProps {
  onStemAdded?: (stem: Stem) => void;
}

const ROLE_LABELS = {
  admin:    { label: 'Admin', color: 'text-error bg-error/10' },
  verified: { label: 'Engineer', color: 'text-amber bg-amber-dim' },
  user:     { label: 'Member', color: 'text-mid bg-surface-high' },
};

export function Header({ onStemAdded }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [updateLogsOpen, setUpdateLogsOpen] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const roleInfo = profile ? ROLE_LABELS[profile.role] : null;
  const displayName = profile?.server_display_name || profile?.display_name || user?.email?.split('@')[0] || 'Member';
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleAdminClick = () => {
    setAdminOpen(true);
  };

  const handleMySubmissionsClick = () => {
    setDropdownOpen(false);
    router.push('/profile');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-md border-b border-border/80 shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-[64px] flex items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <div className="w-10 h-10 rounded-2xl bg-amber flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_2px_10px_rgba(255,184,54,0.3)]">
                <Music2 className="w-5 h-5 text-obsidian" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-warm-white text-base tracking-tight group-hover:text-amber transition-colors">
                    The Mixing Vault
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-[#5865F2]/15 text-[#5865F2] border border-[#5865F2]/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    ALL ACCESS
                  </span>
                </div>
                <span className="text-[11px] text-dim font-mono tracking-wide">Powered by KerpBot</span>
              </div>
            </Link>

            {/* M3 Segmented / Navigation Pills */}
            <nav className="hidden md:flex items-center gap-1.5 bg-surface-raised/80 p-1 rounded-full border border-border/60">
              <Link
                href="/"
                className="text-xs font-body font-semibold text-mid hover:text-warm-white transition-colors px-3.5 py-1.5 rounded-full hover:bg-surface-high"
              >
                Multitracks
              </Link>
              <Link
                href="/showcase"
                className="text-xs font-body font-semibold text-amber transition-colors flex items-center gap-1.5 bg-amber-dim border border-amber/30 px-3.5 py-1.5 rounded-full"
              >
                <Disc3 className="w-3.5 h-3.5" />
                <span>Mix Showcase</span>
              </Link>
            </nav>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setUpdateLogsOpen(true)}
              className="hidden lg:flex items-center gap-1 text-xs font-body text-dim hover:text-amber bg-surface-raised/60 hover:bg-surface-high border border-border/60 px-3 py-1.5 rounded-full transition-colors"
            >
              <span>✨ Logs</span>
            </button>

            <button
              onClick={() => setBugReportOpen(true)}
              className="hidden lg:flex items-center gap-1 text-xs font-body text-dim hover:text-amber bg-surface-raised/60 hover:bg-surface-high border border-border/60 px-3 py-1.5 rounded-full transition-colors"
            >
              <span>🐛 Bug</span>
            </button>

            {user ? (
              <>
                {/* M3 Floating Action / Filled Button */}
                <button
                  onClick={() => setSubmitOpen(true)}
                  className="flex items-center gap-1.5 bg-amber hover:bg-amber-muted text-obsidian font-body font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 rounded-full transition-all shadow-[0_2px_8px_rgba(255,184,54,0.25)] hover:shadow-[0_4px_14px_rgba(255,184,54,0.4)]"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  <span>Publish Stems</span>
                </button>

                {/* User Profile Chip */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(d => !d)}
                    onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                    className="flex items-center gap-2 bg-surface-raised hover:bg-surface-high border border-border/80 px-2.5 py-1 rounded-full transition-colors"
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={displayName}
                        className="w-7 h-7 rounded-full object-cover border border-amber/40 shadow-sm"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-amber/20 border border-amber/30 text-amber flex items-center justify-center font-mono text-xs font-bold">
                        {initials}
                      </div>
                    )}
                    <span className="hidden sm:block text-xs font-body font-medium text-warm-white max-w-[120px] truncate">
                      {displayName}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-dim" />
                  </button>

                  {/* Dropdown Menu (M3 Elevated Menu) */}
                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-60 bg-surface-high border border-border rounded-2xl shadow-[0_12px_28px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-[fade-in_0.15s_ease-out] p-1.5">
                      <div className="px-3.5 py-3 border-b border-border/70 bg-surface/50 rounded-xl mb-1">
                        <p className="text-xs font-body text-warm-white font-semibold truncate">{displayName}</p>
                        <p className="text-[11px] text-dim truncate font-mono mt-0.5">{user.email}</p>
                        {roleInfo && (
                          <span className={`inline-block text-[10px] font-mono mt-1.5 px-2 py-0.5 rounded-full ${roleInfo.color} uppercase tracking-wider font-semibold`}>
                            {roleInfo.label}
                          </span>
                        )}
                      </div>
                      {profile?.role === 'admin' && (
                        <DropdownItem
                          icon={<Shield className="w-4 h-4 text-error" />}
                          label="Admin Console"
                          onClick={handleAdminClick}
                        />
                      )}
                      <DropdownItem
                        icon={<Settings className="w-4 h-4 text-amber" />}
                        label="Account Settings"
                        onClick={() => setSettingsOpen(true)}
                      />
                      <DropdownItem
                        icon={<User className="w-4 h-4 text-mid" />}
                        label="My Submissions"
                        onClick={handleMySubmissionsClick}
                      />
                      <button
                        onClick={signOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-error hover:bg-error/10 rounded-xl transition-colors font-body text-left mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="font-body text-xs sm:text-sm text-mid hover:text-warm-white transition-colors px-3 py-1.5"
                >
                  Sign in
                </button>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-body font-semibold text-xs sm:text-sm px-4 py-2 rounded-full transition-all shadow-[0_2px_8px_rgba(88,101,242,0.3)] hover:shadow-[0_4px_14px_rgba(88,101,242,0.5)] flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  Discord Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <SubmitStemModal
        isOpen={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onStemAdded={onStemAdded || (() => {})}
      />
      <AdminModal isOpen={adminOpen} onClose={() => setAdminOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <UpdateLogsModal isOpen={updateLogsOpen} onClose={() => setUpdateLogsOpen(false)} />
      <BugReportModal isOpen={bugReportOpen} onClose={() => setBugReportOpen(false)} />
      <DisclaimerModal isOpen={disclaimerOpen} onClose={() => setDisclaimerOpen(false)} />
    </>
  );
}

function DropdownItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-mid hover:text-warm-white hover:bg-surface rounded-xl transition-colors font-body text-left font-medium"
    >
      {icon}
      {label}
    </button>
  );
}
