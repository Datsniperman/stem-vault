'use client';

import { useState, useEffect } from 'react';
import { X, Shield, Award, User, Clock, Flag, List, ExternalLink, Trash2, ShieldCheck, ShieldOff, Search } from 'lucide-react';
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
      loadProfiles();
      if (emailInput.toLowerCase() === user?.email?.toLowerCase()) {
        await refreshProfile();
      }
    } else {
      addToast(res.message, 'error');
    }
    setLoading(false);
  };

  const handleRoleChangeForUser = async (email: string, role: UserRole) => {
    const res = await setUserRoleByEmail(email, role);
    if (res.success) {
      addToast(res.message, 'success');
      loadProfiles();
      if (email.toLowerCase() === user?.email?.toLowerCase()) {
        await refreshProfile();
      }
    } else {
      addToast(res.message, 'error');
    }
  };

  const handleApprove = async (id: string) => {
    const res = await approveStem(id);
    if (res.success) {
      addToast('Session approved.', 'success');
      setPendingStems(prev => prev.filter(s => s.id !== id));
      loadStems();
    } else {
      addToast(res.message, 'error');
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject and delete this submission?')) return;
    const res = await rejectStem(id);
    if (res.success) {
      addToast('Session rejected.', 'info');
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-[fade-in_0.15s_ease-out]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#121212] border border-neutral-800 rounded-lg w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-white" />
            <h2 className="text-base font-semibold text-white">Admin Center</h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex gap-1 px-6 py-2 border-b border-neutral-800 shrink-0 bg-[#0d0d0e]">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors',
                activeTab === tab.id
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-white text-black font-semibold">
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
                <p className="text-xs text-neutral-400 py-4 text-center">Loading pending...</p>
              ) : pendingStems.length === 0 ? (
                <div className="text-center py-10 text-neutral-400">
                  <p className="font-semibold text-white">No pending submissions.</p>
                  <p className="text-xs mt-1">Sessions go live immediately.</p>
                </div>
              ) : (
                pendingStems.map(stem => (
                  <div key={stem.id} className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white truncate">{stem.title}</p>
                        <p className="text-xs text-neutral-400">{stem.artist} &middot; by {stem.uploader_handle}</p>
                      </div>
                      <a
                        href={stem.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:underline text-xs flex items-center gap-1 shrink-0"
                      >
                        Preview <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleApprove(stem.id)}
                        className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-3 py-1.5 rounded transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(stem.id)}
                        className="text-neutral-400 hover:text-white border border-neutral-800 hover:bg-neutral-900 px-3 py-1.5 rounded transition-colors"
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
                <p className="text-xs text-neutral-400 py-4 text-center">Loading flagged...</p>
              ) : flaggedStems.length === 0 ? (
                <div className="text-center py-10 text-neutral-400">
                  <p className="font-semibold text-white">No flagged multitracks.</p>
                </div>
              ) : (
                flaggedStems.map(stem => (
                  <div key={stem.id} className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white truncate">{stem.title}</p>
                        <p className="text-xs text-neutral-400">{stem.artist} &middot; by {stem.uploader_handle}</p>
                      </div>
                      <a
                        href={stem.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:underline text-xs flex items-center gap-1 shrink-0"
                      >
                        Check Link <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleRestore(stem.id)}
                        className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs px-3 py-1.5 rounded transition-colors"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => handleDelete(stem.id)}
                        className="text-neutral-400 hover:text-white border border-neutral-800 hover:bg-neutral-900 px-3 py-1.5 rounded transition-colors"
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
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
                <input
                  type="text"
                  value={stemFilter}
                  onChange={e => setStemFilter(e.target.value)}
                  placeholder="Filter all stems..."
                  className="w-full bg-[#0d0d0e] border border-neutral-800 rounded pl-8 pr-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-neutral-500"
                />
              </div>

              {loadingStems ? (
                <p className="text-xs text-neutral-400 py-4 text-center">Loading...</p>
              ) : (
                <div className="border border-neutral-800 rounded-lg divide-y divide-neutral-800/80 overflow-hidden bg-[#0d0d0e]">
                  {filteredAllStems.map(stem => (
                    <div key={stem.id} className="p-3 flex items-center justify-between gap-3 hover:bg-neutral-900/60 transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-white truncate">{stem.title}</p>
                          <StemStatusBadge status={stem.status} />
                          {stem.is_verified && <span className="text-[10px] text-white font-mono font-medium">PRO</span>}
                        </div>
                        <p className="text-[11px] text-neutral-400">{stem.artist} &middot; {stem.uploader_handle}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleVerify(stem.id, stem.is_verified)}
                          title={stem.is_verified ? 'Remove Verified' : 'Mark as Verified'}
                          className="p-1.5 text-neutral-400 hover:text-white rounded transition-colors"
                        >
                          {stem.is_verified ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(stem.id)}
                          title="Delete stem"
                          className="p-1.5 text-neutral-400 hover:text-white rounded transition-colors"
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
              <div className="bg-[#0d0d0e] border border-neutral-800 rounded-lg p-3.5 space-y-2">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-neutral-300" />
                  <span>Update Member Role</span>
                </h3>

                <form onSubmit={handlePromote} className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="user@email.com"
                    className="flex-1 bg-[#121212] border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-neutral-500"
                  />

                  <select
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value as UserRole)}
                    className="bg-[#121212] border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-neutral-500 cursor-pointer"
                  >
                    <option value="verified">Verified</option>
                    <option value="admin">Admin</option>
                    <option value="user">Member</option>
                  </select>

                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-white hover:bg-neutral-200 disabled:opacity-50 text-black font-semibold text-xs px-3.5 py-1.5 rounded transition-colors shadow-xs"
                  >
                    {loading ? 'Saving...' : 'Update'}
                  </button>
                </form>
              </div>

              {/* User Directory */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Members</span>
                  <div className="relative w-44">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-500 pointer-events-none" />
                    <input
                      type="text"
                      value={filterSearch}
                      onChange={e => setFilterSearch(e.target.value)}
                      placeholder="Filter members..."
                      className="w-full bg-[#0d0d0e] border border-neutral-800 rounded pl-7 pr-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-neutral-500"
                    />
                  </div>
                </div>

                {fetchingProfiles ? (
                  <p className="text-xs text-neutral-400 py-4 text-center">Loading...</p>
                ) : filteredProfiles.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-4 text-center">No profiles found.</p>
                ) : (
                  <div className="border border-neutral-800 rounded-lg divide-y divide-neutral-800/80 overflow-hidden bg-[#0d0d0e]">
                    {filteredProfiles.map(p => (
                      <div key={p.id} className="p-3 flex items-center justify-between gap-3 hover:bg-neutral-900/60 transition-colors">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-white truncate">{p.email || 'No email'}</p>
                            <RoleBadge role={p.role} />
                          </div>
                          <p className="text-[11px] text-neutral-400">{p.display_name ? `@${p.display_name}` : 'No handle'}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleRoleChangeForUser(p.email || '', 'verified')}
                            className={clsx(
                              'text-xs px-2.5 py-1 rounded transition-colors',
                              p.role === 'verified'
                                ? 'bg-neutral-800 text-white font-semibold'
                                : 'text-neutral-400 hover:text-white bg-neutral-900'
                            )}
                          >
                            Verified
                          </button>
                          <button
                            onClick={() => handleRoleChangeForUser(p.email || '', 'admin')}
                            className={clsx(
                              'text-xs px-2.5 py-1 rounded transition-colors',
                              p.role === 'admin'
                                ? 'bg-neutral-800 text-white font-semibold'
                                : 'text-neutral-400 hover:text-white bg-neutral-900'
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
    return <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-neutral-800 text-white border border-neutral-700">ADMIN</span>;
  }
  if (role === 'verified') {
    return <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-neutral-800/60 text-neutral-300 border border-neutral-700">VERIFIED</span>;
  }
  return <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">MEMBER</span>;
}

function StemStatusBadge({ status }: { status: string }) {
  if (status === 'published') {
    return <span className="text-[10px] text-neutral-300 font-mono">LIVE</span>;
  }
  if (status === 'pending') {
    return <span className="text-[10px] text-neutral-500 font-mono">PENDING</span>;
  }
  return <span className="text-[10px] text-neutral-400 font-mono">FLAGGED</span>;
}
