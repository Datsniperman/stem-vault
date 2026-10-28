'use client';

import { useState, useEffect } from 'react';
import { X, Shield, Award, User, Check, Search, Clock, Flag, List, ExternalLink, Trash2, ShieldCheck, ShieldOff } from 'lucide-react';
import { getAllProfiles, setUserRoleByEmail, getPendingStems, getFlaggedStems, getAllStems, approveStem, rejectStem, restoreStem, deleteStem, toggleStemVerification } from '@/app/actions/stems';
import { Profile, Stem, UserRole } from '@/types';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { clsx } from 'clsx';

type AdminTab = 'pending' | 'flagged' | 'stems' | 'users';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminModal({ isOpen, onClose }: AdminModalProps) {
  const { addToast } = useToast();
  const { user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('pending');

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('verified');
  const [loading, setLoading] = useState(false);
  const [fetchingProfiles, setFetchingProfiles] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');

  const [pendingStems, setPendingStems] = useState<Stem[]>([]);
  const [flaggedStems, setFlaggedStems] = useState<Stem[]>([]);
  const [allStems, setAllStems] = useState<Stem[]>([]);
  const [loadingStems, setLoadingStems] = useState(false);
  const [stemFilter, setStemFilter] = useState('');

  const loadProfiles = async () => {
    setFetchingProfiles(true);
    const data = await getAllProfiles();
    setProfiles(data);
    setFetchingProfiles(false);
  };

  const loadStems = async () => {
    setLoadingStems(true);
    const [pending, flagged, all] = await Promise.all([
      getPendingStems(),
      getFlaggedStems(),
      getAllStems(),
    ]);
    setPendingStems(pending);
    setFlaggedStems(flagged);
    setAllStems(all);
    setLoadingStems(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadProfiles();
      loadStems();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setLoading(true);
    const res = await setUserRoleByEmail(emailInput, selectedRole);
    if (res.success) {
      addToast(res.message, 'success');
      setEmailInput('');
      setProfiles(prev => prev.map(p => p.email?.toLowerCase() === emailInput.trim().toLowerCase() ? { ...p, role: selectedRole } : p));
      if (user?.email?.toLowerCase() === emailInput.trim().toLowerCase()) {
        await refreshProfile();
      }
      loadProfiles();
    } else {
      addToast(res.message, 'error');
    }
    setLoading(false);
  };

  const handleRoleChangeForUser = async (email: string, role: UserRole) => {
    const res = await setUserRoleByEmail(email, role);
    if (res.success) {
      addToast(res.message, 'success');
      setProfiles(prev => prev.map(p => p.email?.toLowerCase() === email.toLowerCase() ? { ...p, role } : p));
      if (user?.email?.toLowerCase() === email.toLowerCase()) await refreshProfile();
      loadProfiles();
    } else {
      addToast(res.message, 'error');
    }
  };

  const handleApprove = async (id: string) => {
    const res = await approveStem(id);
    if (res.success) {
      addToast('Approved.', 'success');
      setPendingStems(prev => prev.filter(s => s.id !== id));
      loadStems();
    } else {
      addToast(res.message, 'error');
    }
  };

  const handleReject = async (id: string) => {
    const res = await rejectStem(id);
    if (res.success) {
      addToast('Rejected.', 'info');
      setPendingStems(prev => prev.filter(s => s.id !== id));
      loadStems();
    } else {
      addToast(res.message, 'error');
    }
  };

  const handleRestore = async (id: string) => {
    const res = await restoreStem(id);
    if (res.success) {
      addToast('Restored.', 'success');
      setFlaggedStems(prev => prev.filter(s => s.id !== id));
      loadStems();
    } else {
      addToast(res.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this stem session?')) return;
    const res = await deleteStem(id);
    if (res.success) {
      addToast('Deleted.', 'info');
      setPendingStems(prev => prev.filter(s => s.id !== id));
      setFlaggedStems(prev => prev.filter(s => s.id !== id));
      setAllStems(prev => prev.filter(s => s.id !== id));
    } else {
      addToast(res.message, 'error');
    }
  };

  const handleVerify = async (id: string, currentlyVerified: boolean) => {
    const res = await toggleStemVerification(id, !currentlyVerified);
    if (res.success) {
      addToast(res.message, 'success');
      setAllStems(prev => prev.map(s => s.id === id ? { ...s, is_verified: !currentlyVerified } : s));
    } else {
      addToast(res.message, 'error');
    }
  };

  const filteredProfiles = profiles.filter(p =>
    (p.email || '').toLowerCase().includes(filterSearch.toLowerCase()) ||
    (p.display_name || '').toLowerCase().includes(filterSearch.toLowerCase())
  );

  const filteredAllStems = allStems.filter(s =>
    s.title.toLowerCase().includes(stemFilter.toLowerCase()) ||
    s.artist.toLowerCase().includes(stemFilter.toLowerCase())
  );

  const TABS: { id: AdminTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'pending', label: 'Pending', icon: <Clock className="w-3.5 h-3.5" />, count: pendingStems.length },
    { id: 'flagged', label: 'Flagged', icon: <Flag className="w-3.5 h-3.5" />, count: flaggedStems.length },
    { id: 'stems',   label: 'All Stems', icon: <List className="w-3.5 h-3.5" /> },
    { id: 'users',   label: 'Members', icon: <User className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-[fade-in_0.15s_ease-out]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#313338] border border-[#1f2023] rounded-lg w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1f2023] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#f23f43]" />
            <h2 className="text-base font-bold text-[#f2f3f5]">Server Admin Center</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#949ba4] hover:text-[#f2f3f5] p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex gap-1 px-6 py-2 border-b border-[#1f2023] shrink-0 bg-[#2b2d31]">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors',
                activeTab === tab.id
                  ? 'bg-[#35373c] text-[#f2f3f5]'
                  : 'text-[#949ba4] hover:text-[#dbdee1] hover:bg-[#35373c]/50'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={clsx(
                  'text-[10px] px-1.5 py-0.2 rounded font-mono',
                  tab.id === 'pending' ? 'bg-[#f0b232] text-black font-bold' : 'bg-[#f23f43] text-white font-bold'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-6 text-xs">

          {/* ── PENDING TAB ── */}
          {activeTab === 'pending' && (
            <div className="space-y-2.5">
              {loadingStems ? (
                <p className="text-xs text-[#949ba4] py-4 text-center">Loading pending...</p>
              ) : pendingStems.length === 0 ? (
                <div className="text-center py-10 text-[#949ba4]">
                  <p className="font-semibold text-[#f2f3f5]">No pending submissions.</p>
                  <p className="text-xs mt-1">Sessions go live immediately!</p>
                </div>
              ) : (
                pendingStems.map(stem => (
                  <div key={stem.id} className="bg-[#2b2d31] border border-[#1f2023] rounded p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-[#f2f3f5] truncate">{stem.title}</p>
                        <p className="text-xs text-[#949ba4]">{stem.artist} &middot; by {stem.uploader_handle}</p>
                      </div>
                      <a
                        href={stem.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#5865F2] hover:underline text-xs flex items-center gap-1 shrink-0"
                      >
                        Preview <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleApprove(stem.id)}
                        className="bg-[#23a55a] hover:bg-[#1f9250] text-white font-semibold text-xs px-3 py-1.5 rounded transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(stem.id)}
                        className="text-[#f23f43] hover:bg-[#f23f43]/10 border border-[#f23f43]/30 px-3 py-1.5 rounded transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── FLAGGED TAB ── */}
          {activeTab === 'flagged' && (
            <div className="space-y-2.5">
              {loadingStems ? (
                <p className="text-xs text-[#949ba4] py-4 text-center">Loading flagged...</p>
              ) : flaggedStems.length === 0 ? (
                <div className="text-center py-10 text-[#949ba4]">
                  <p className="font-semibold text-[#f2f3f5]">No flagged multitracks.</p>
                </div>
              ) : (
                flaggedStems.map(stem => (
                  <div key={stem.id} className="bg-[#2b2d31] border border-[#f23f43]/30 rounded p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-[#f2f3f5] truncate">{stem.title}</p>
                        <p className="text-xs text-[#949ba4]">{stem.artist} &middot; by {stem.uploader_handle}</p>
                      </div>
                      <a
                        href={stem.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#5865F2] hover:underline text-xs flex items-center gap-1 shrink-0"
                      >
                        Check Link <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleRestore(stem.id)}
                        className="bg-[#2b2d31] hover:bg-[#35373c] border border-[#1f2023] text-[#dbdee1] text-xs px-3 py-1.5 rounded transition-colors"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => handleDelete(stem.id)}
                        className="text-[#f23f43] hover:bg-[#f23f43]/10 border border-[#f23f43]/30 px-3 py-1.5 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── ALL STEMS TAB ── */}
          {activeTab === 'stems' && (
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#949ba4] pointer-events-none" />
                <input
                  type="text"
                  value={stemFilter}
                  onChange={e => setStemFilter(e.target.value)}
                  placeholder="Filter all stems..."
                  className="w-full bg-[#1e1f22] border border-[#1f2023] rounded pl-8 pr-3 py-1.5 text-xs text-[#dbdee1] focus:outline-none focus:border-[#5865F2]"
                />
              </div>

              {loadingStems ? (
                <p className="text-xs text-[#949ba4] py-4 text-center">Loading...</p>
              ) : (
                <div className="border border-[#1f2023] rounded divide-y divide-[#1f2023] overflow-hidden bg-[#2b2d31]">
                  {filteredAllStems.map(stem => (
                    <div key={stem.id} className="p-3 flex items-center justify-between gap-3 hover:bg-[#35373c]/50 transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-[#f2f3f5] truncate">{stem.title}</p>
                          <StemStatusBadge status={stem.status} />
                          {stem.is_verified && <span className="text-[10px] text-[#23a55a] font-bold">PRO</span>}
                        </div>
                        <p className="text-[11px] text-[#949ba4]">{stem.artist} &middot; {stem.uploader_handle}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleVerify(stem.id, stem.is_verified)}
                          title={stem.is_verified ? 'Remove Pro' : 'Mark as Pro'}
                          className="p-1.5 text-[#23a55a] hover:bg-[#23a55a]/10 rounded transition-colors"
                        >
                          {stem.is_verified ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(stem.id)}
                          title="Delete stem"
                          className="p-1.5 text-[#f23f43] hover:bg-[#f23f43]/10 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── USERS TAB ── */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="bg-[#2b2d31] border border-[#1f2023] rounded p-3.5 space-y-2">
                <h3 className="text-xs font-bold text-[#f2f3f5] uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#5865F2]" />
                  <span>Update Member Role</span>
                </h3>

                <form onSubmit={handlePromote} className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="user@email.com"
                    className="flex-1 bg-[#1e1f22] border border-[#1f2023] rounded px-3 py-1.5 text-xs text-[#dbdee1] focus:outline-none focus:border-[#5865F2]"
                  />

                  <select
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value as UserRole)}
                    className="bg-[#1e1f22] border border-[#1f2023] rounded px-3 py-1.5 text-xs text-[#dbdee1] focus:outline-none focus:border-[#5865F2] cursor-pointer"
                  >
                    <option value="verified">Pro Tech</option>
                    <option value="admin">Admin</option>
                    <option value="user">Member</option>
                  </select>

                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 text-white font-medium text-xs px-3.5 py-1.5 rounded transition-colors"
                  >
                    {loading ? 'Saving...' : 'Update'}
                  </button>
                </form>
              </div>

              {/* User Directory */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider">Members</span>
                  <div className="relative w-44">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#949ba4] pointer-events-none" />
                    <input
                      type="text"
                      value={filterSearch}
                      onChange={e => setFilterSearch(e.target.value)}
                      placeholder="Filter members..."
                      className="w-full bg-[#1e1f22] border border-[#1f2023] rounded pl-7 pr-2 py-1 text-xs text-[#dbdee1] focus:outline-none focus:border-[#5865F2]"
                    />
                  </div>
                </div>

                {fetchingProfiles ? (
                  <p className="text-xs text-[#949ba4] py-4 text-center">Loading...</p>
                ) : filteredProfiles.length === 0 ? (
                  <p className="text-xs text-[#949ba4] py-4 text-center">No profiles found.</p>
                ) : (
                  <div className="border border-[#1f2023] rounded divide-y divide-[#1f2023] overflow-hidden bg-[#2b2d31]">
                    {filteredProfiles.map(p => (
                      <div key={p.id} className="p-3 flex items-center justify-between gap-3 hover:bg-[#35373c]/50 transition-colors">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-[#f2f3f5] truncate">{p.email || 'No email'}</p>
                            <RoleBadge role={p.role} />
                          </div>
                          <p className="text-[11px] text-[#949ba4]">{p.display_name ? `@${p.display_name}` : 'No handle'}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleRoleChangeForUser(p.email || '', 'verified')}
                            className={clsx(
                              'text-xs px-2.5 py-1 rounded transition-colors',
                              p.role === 'verified'
                                ? 'bg-[#23a55a]/15 text-[#23a55a] font-semibold'
                                : 'text-[#949ba4] hover:text-[#f2f3f5] bg-[#1e1f22]'
                            )}
                          >
                            Pro Tech
                          </button>
                          <button
                            onClick={() => handleRoleChangeForUser(p.email || '', 'admin')}
                            className={clsx(
                              'text-xs px-2.5 py-1 rounded transition-colors',
                              p.role === 'admin'
                                ? 'bg-[#f23f43]/15 text-[#f23f43] font-semibold'
                                : 'text-[#949ba4] hover:text-[#f2f3f5] bg-[#1e1f22]'
                            )}
                          >
                            Admin
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  if (role === 'admin') {
    return <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#f23f43]/15 text-[#f23f43]">ADMIN</span>;
  }
  if (role === 'verified') {
    return <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#23a55a]/15 text-[#23a55a]">PRO</span>;
  }
  return <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1e1f22] text-[#949ba4]">MEMBER</span>;
}

function StemStatusBadge({ status }: { status: string }) {
  if (status === 'published') {
    return <span className="text-[10px] text-[#23a55a] font-mono">LIVE</span>;
  }
  if (status === 'pending') {
    return <span className="text-[10px] text-[#f0b232] font-mono">PENDING</span>;
  }
  return <span className="text-[10px] text-[#f23f43] font-mono">FLAGGED</span>;
}
