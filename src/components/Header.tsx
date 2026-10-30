'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, User, Shield, Settings, Disc3, Plus, Music2, Layers, Sliders, FileArchive } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from './AuthModal';
import { SubmitStemModal } from './SubmitStemModal';
import { UploadMultiModal } from './UploadMultiModal';
import { UploadMixModal } from './UploadMixModal';
import { CreatePluginChainModal } from './CreatePluginChainModal';
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
  admin:    { label: 'Admin', color: 'text-neutral-200 bg-neutral-800 border-neutral-700' },
  verified: { label: 'Verified', color: 'text-neutral-300 bg-neutral-800/60 border-neutral-700' },
  user:     { label: 'Member', color: 'text-neutral-400 bg-neutral-900 border-neutral-800' },
};

export function Header({ onStemAdded }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [uploadMultiOpen, setUploadMultiOpen] = useState(false);
  const [uploadMixOpen, setUploadMixOpen] = useState(false);
  const [createChainOpen, setCreateChainOpen] = useState(false);
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
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Left Brand & Nav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-7 h-7 rounded bg-white text-black flex items-center justify-center font-bold text-xs tracking-wider shadow-xs">
                MV
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold tracking-tight text-white group-hover:text-neutral-300 transition-colors">
                  THE MIXING VAULT
                </span>
                <span className="hidden sm:inline text-[11px] text-neutral-500 font-normal">
                  / Beta
                </span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center gap-1 pl-4 border-l border-neutral-800">
              <Link
                href="/"
                className="text-xs font-medium text-neutral-300 hover:text-white px-2.5 py-1.5 rounded hover:bg-neutral-900 transition-colors"
              >
                Archive
              </Link>
              <Link
                href="/multis"
                className="text-xs font-medium text-neutral-300 hover:text-white px-2.5 py-1.5 rounded hover:bg-neutral-900 transition-colors flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-neutral-400" />
                <span>Multis</span>
              </Link>
              <Link
                href="/mixes"
                className="text-xs font-medium text-neutral-300 hover:text-white px-2.5 py-1.5 rounded hover:bg-neutral-900 transition-colors flex items-center gap-1.5"
              >
                <Music2 className="w-3.5 h-3.5 text-neutral-400" />
                <span>Mixes</span>
              </Link>
              <Link
                href="/plugin-chains"
                className="text-xs font-medium text-neutral-300 hover:text-white px-2.5 py-1.5 rounded hover:bg-neutral-900 transition-colors flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5 text-neutral-400" />
                <span>Plugin Chains</span>
              </Link>
              <Link
                href="/showcase"
                className="text-xs font-medium text-neutral-300 hover:text-white px-2.5 py-1.5 rounded hover:bg-neutral-900 transition-colors flex items-center gap-1.5"
              >
                <Disc3 className="w-3.5 h-3.5 text-neutral-400" />
                <span>Mix Showcase</span>
              </Link>
            </nav>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2.5">
            {/* Sync Status */}
            <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-neutral-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
              <span>Discord Synced</span>
            </div>

            {user ? (
              <>
                <button
                  onClick={() => setUploadMultiOpen(true)}
                  className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 shadow-xs"
                  title="Upload a new ZIP multitrack song"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Multi</span>
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(d => !d)}
                    className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-2.5 py-1 rounded transition-colors text-left"
                  >
                    <div className="w-5 h-5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-200 flex items-center justify-center font-bold text-[9px]">
                      {initials}
                    </div>
                    <span className="text-xs text-neutral-200 font-medium max-w-[120px] truncate">
                      {displayName}
                    </span>
                    {roleInfo && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                    )}
                    <ChevronDown className="w-3 h-3 text-neutral-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setDropdownOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-1.5 w-56 bg-[#121212] border border-neutral-800 rounded-lg shadow-2xl p-1.5 z-50 animate-[fade-in_0.15s_ease-out] text-xs">
                        <div className="px-2.5 py-2 border-b border-neutral-800 mb-1">
                          <p className="text-white font-medium truncate">{displayName}</p>
                          <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                        </div>

                        <DropdownItem
                          icon={<Layers className="w-3.5 h-3.5 text-neutral-400" />}
                          label="Multis Catalog"
                          onClick={() => { setDropdownOpen(false); router.push('/multis'); }}
                        />

                        <DropdownItem
                          icon={<Music2 className="w-3.5 h-3.5 text-neutral-400" />}
                          label="Upload a Mix"
                          onClick={() => { setDropdownOpen(false); setUploadMixOpen(true); }}
                        />

                        <DropdownItem
                          icon={<Sliders className="w-3.5 h-3.5 text-neutral-400" />}
                          label="Plugin Chains"
                          onClick={() => { setDropdownOpen(false); router.push('/plugin-chains'); }}
                        />

                        <DropdownItem
                          icon={<User className="w-3.5 h-3.5 text-neutral-400" />}
                          label="My Uploads"
                          onClick={handleMySubmissionsClick}
                        />

                        {profile?.role === 'admin' && (
                          <DropdownItem
                            icon={<Shield className="w-3.5 h-3.5 text-neutral-300" />}
                            label="Admin Center"
                            onClick={() => { setDropdownOpen(false); handleAdminClick(); }}
                          />
                        )}

                        <DropdownItem
                          icon={<Settings className="w-3.5 h-3.5 text-neutral-400" />}
                          label="Settings & Profile"
                          onClick={() => { setDropdownOpen(false); setSettingsOpen(true); }}
                        />

                        <div className="my-1 border-t border-neutral-800" />

                        <button
                          onClick={() => { setDropdownOpen(false); signOut(); }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-neutral-400 hover:text-white hover:bg-neutral-900 rounded transition-colors text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Disconnect</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-800 font-medium text-xs px-3.5 py-1.5 rounded transition-colors flex items-center gap-2 shadow-xs"
              >
                <svg className="w-3.5 h-3.5 fill-current shrink-0 text-neutral-400" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                <span>Connect</span>
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
      <UploadMultiModal
        isOpen={uploadMultiOpen}
        onClose={() => setUploadMultiOpen(false)}
      />
      <UploadMixModal
        isOpen={uploadMixOpen}
        onClose={() => setUploadMixOpen(false)}
      />
      <CreatePluginChainModal
        isOpen={createChainOpen}
        onClose={() => setCreateChainOpen(false)}
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
      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-900 rounded transition-colors text-left font-medium"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
