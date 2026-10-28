'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, User, Shield, Hash, Settings, Disc3, Plus, Radio } from 'lucide-react';

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
  admin:    { label: 'Admin', color: 'text-[#f23f43] bg-[#f23f43]/10 border-[#f23f43]/30' },
  verified: { label: 'Pro Tech', color: 'text-[#23a55a] bg-[#23a55a]/10 border-[#23a55a]/30' },
  user:     { label: 'Member', color: 'text-[#949ba4] bg-[#1e1f22] border-[#3f4147]' },
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
      <header className="sticky top-0 z-40 bg-[#2b2d31] border-b border-[#1f2023] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between gap-4">

          {/* Left Brand / Discord Channel Header */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded bg-[#5865F2] flex items-center justify-center text-white font-bold text-xs shadow-sm">
                TK
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center text-[#f2f3f5] font-semibold text-sm">
                  <Hash className="w-4 h-4 text-[#80848e] mr-1 stroke-[2.5]" />
                  <span>mixing-vault</span>
                </div>
                <span className="hidden sm:inline text-[#4e5058]">|</span>
                <span className="hidden sm:inline text-xs text-[#949ba4] font-medium truncate max-w-[200px]">
                  Tyler Kerpsack All Access
                </span>
              </div>
            </Link>

            {/* Navigation Channels */}
            <nav className="hidden md:flex items-center gap-1 pl-3 border-l border-[#3f4147]/50">
              <Link
                href="/"
                className="text-xs font-medium text-[#dbdee1] hover:bg-[#35373c] px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
              >
                <Hash className="w-3.5 h-3.5 text-[#80848e]" />
                <span>multitracks</span>
              </Link>
              <Link
                href="/showcase"
                className="text-xs font-medium text-[#dbdee1] hover:bg-[#35373c] px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
              >
                <Disc3 className="w-3.5 h-3.5 text-[#5865F2]" />
                <span>mix-showcase</span>
              </Link>
            </nav>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2.5">
            {/* KerpBot Status Pill */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-[#23a55a] bg-[#23a55a]/10 border border-[#23a55a]/25 px-2.5 py-1 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-[#23a55a] animate-pulse" />
              <span>KerpBot Synced</span>
            </div>

            {user ? (
              <>
                <button
                  onClick={() => setSubmitOpen(true)}
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium text-xs px-3.5 py-1.5 rounded transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Publish Stems</span>
                </button>

                {/* Discord User Badge */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(d => !d)}
                    className="flex items-center gap-2 bg-[#1e1f22] hover:bg-[#35373c] border border-[#1f2023] px-2.5 py-1 rounded transition-colors text-left"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#5865F2] text-white flex items-center justify-center font-bold text-[10px]">
                      {initials}
                    </div>
                    <span className="text-xs text-[#f2f3f5] font-medium max-w-[120px] truncate">
                      {displayName}
                    </span>
                    {roleInfo && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-[#949ba4]" />
                  </button>

                  {/* Discord Dropdown Menu */}
                  {dropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setDropdownOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-1.5 w-56 bg-[#111214] border border-[#232428] rounded-md shadow-2xl p-1.5 z-50 animate-[fade-in_0.15s_ease-out] text-xs">
                        <div className="px-2.5 py-2 border-b border-[#232428] mb-1">
                          <p className="text-[#f2f3f5] font-semibold truncate">{displayName}</p>
                          <p className="text-[11px] text-[#949ba4] truncate">{user.email}</p>
                        </div>

                        <DropdownItem
                          icon={<User className="w-3.5 h-3.5 text-[#949ba4]" />}
                          label="My Uploads"
                          onClick={handleMySubmissionsClick}
                        />

                        {profile?.role === 'admin' && (
                          <DropdownItem
                            icon={<Shield className="w-3.5 h-3.5 text-[#f23f43]" />}
                            label="Server Admin Center"
                            onClick={() => { setDropdownOpen(false); handleAdminClick(); }}
                          />
                        )}

                        <DropdownItem
                          icon={<Settings className="w-3.5 h-3.5 text-[#949ba4]" />}
                          label="Settings & Profile"
                          onClick={() => { setDropdownOpen(false); setSettingsOpen(true); }}
                        />

                        <div className="my-1 border-t border-[#232428]" />

                        <button
                          onClick={() => { setDropdownOpen(false); signOut(); }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#f23f43] hover:bg-[#f23f43]/10 rounded transition-colors text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Disconnect Discord</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium text-xs px-3.5 py-1.5 rounded transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                <span>Connect Discord</span>
              </button>
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
      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#dbdee1] hover:text-white hover:bg-[#35373c] rounded transition-colors text-left font-medium"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
