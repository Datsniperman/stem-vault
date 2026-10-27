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

  // Users tab state
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('verified');
  const [loading, setLoading] = useState(false);
  const [fetchingProfiles, setFetchingProfiles] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');

  // Stems tabs state
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
      addToast('Stem session approved & published.', 'success');
      setPendingStems(prev => prev.filter(s => s.id !== id));
      loadStems();
    } else {
      addToast(res.message, 'error');
    }
  };

  const handleReject = async (id: string) => {
    const res = await rejectStem(id);
    if (res.success) {
      addToast('Stem session rejected.', 'info');
      setPendingStems(prev => prev.filter(s => s.id !== id));
      loadStems();
    } else {
      addToast(res.message, 'error');
    }
  };

  const handleRestore = async (id: string) => {
    const res = await restoreStem(id);
    if (res.success) {
      addToast('Stem restored to active feed.', 'success');
      setFlaggedStems(prev => prev.filter(s => s.id !== id));
      loadStems();
    } else {
      addToast(res.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this session?')) return;
    const res = await deleteStem(id);
    if (res.success) {
      addToast('Stem deleted.', 'info');
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
    { id: 'users',   label: 'Users', icon: <User className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-md animate-[fade-in_0.15s_ease-out]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface-raised border border-border/80 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-m3-3 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-error/15 border border-error/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-error" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-warm-white">Admin Control Center</h2>
              <p className="text-xs text-dim font-body mt-0.5">Manage multitrack submissions and community roles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-dim hover:text-warm-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Filter Chips Tabs */}
        <div className="flex gap-1.5 px-6 py-3 border-b border-border/60 shrink-0 bg-surface/50">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-amber/20 border-amber/50 text-amber shadow-sm'
                  : 'bg-surface border-border/60 text-dim hover:text-warm-white hover:bg-surface-high'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={clsx(
                  'text-[10px] px-2 py-0.2 rounded-full font-mono',
                  tab.id === 'pending' ? 'bg-amber text-obsidian font-bold' : 'bg-error text-white font-bold'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-6">

          {/* ── PENDING TAB ── */}
          {activeTab === 'pending' && (
            <div className="space-y-3">
              {loadingStems ? (
                <p className="text-xs text-dim py-4 text-center">Loading pending submissions...</p>
              ) : pendingStems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm font-semibold text-dim">No pending submissions.</p>
                  <p className="text-xs text-dim/60 mt-1">All submissions go live instantly in The Mixing Vault!</p>
                </div>
              ) : (
                pendingStems.map(stem => (
                  <div key={stem.id} className="bg-surface-high border border-border/70 rounded-2xl p-4 space-y-2.5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-warm-white truncate">{stem.title}</p>
                        <p className="text-xs text-amber font-semibold">{stem.artist}</p>
                        <p className="text-[11px] text-dim mt-0.5">by {stem.uploader_handle} &middot; {stem.format} &middot; {stem.host_platform}</p>
                      </div>
                      <a
                        href={stem.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-amber hover:underline text-xs flex items-center gap-1 shrink-0 font-medium"
                      >
                        Preview <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    {stem.description && (
                      <p className="text-xs text-mid leading-relaxed bg-surface/50 p-2.5 rounded-xl border border-border/40">{stem.description}</p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleApprove(stem.id)}
                        className="flex-1 bg-amber hover:bg-amber-muted text-obsidian font-bold text-xs py-2 rounded-full transition-all shadow-sm active:scale-95"
                      >
                        Approve & Publish
                      </button>
                      <button
                        onClick={() => handleReject(stem.id)}
                        className="px-4 py-2 text-xs font-semibold text-error hover:bg-error/10 border border-error/30 rounded-full transition-colors"
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
            <div className="space-y-3">
              {loadingStems ? (
                <p className="text-xs text-dim py-4 text-center">Loading flagged stems...</p>
              ) : flaggedStems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm font-semibold text-dim">No flagged stems.</p>
                </div>
              ) : (
                flaggedStems.map(stem => (
                  <div key={stem.id} className="bg-surface-high border border-error/25 rounded-2xl p-4 space-y-2.5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-warm-white truncate">{stem.title}</p>
                        <p className="text-xs text-amber font-semibold">{stem.artist}</p>
                        <p className="text-[11px] text-dim mt-0.5">by {stem.uploader_handle}</p>
                      </div>
                      <a
                        href={stem.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber hover:underline text-xs flex items-center gap-1 shrink-0 font-medium"
                      >
                        Check Link <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleRestore(stem.id)}
                        className="flex-1 bg-surface border border-border hover:border-amber text-warm-white font-semibold text-xs py-2 rounded-full transition-colors"
                      >
                        Restore to Live
                      </button>
                      <button
                        onClick={() => handleDelete(stem.id)}
                        className="px-4 py-2 text-xs font-semibold text-error hover:bg-error/10 border border-error/30 rounded-full transition-colors"
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
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dim pointer-events-none" />
                <input
                  type="text"
                  value={stemFilter}
                  onChange={e => setStemFilter(e.target.value)}
                  placeholder="Search all stems..."
                  className="w-full bg-surface border border-border/80 rounded-full pl-9 pr-3 py-2 text-xs text-warm-white focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/40 placeholder:text-dim/50"
                />
              </div>
              {loadingStems ? (
                <p className="text-xs text-dim py-4 text-center">Loading stems...</p>
              ) : (
                <div className="border border-border/70 rounded-2xl divide-y divide-border/60 overflow-hidden bg-surface-high/50">
                  {filteredAllStems.map(stem => (
                    <div key={stem.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-surface-high transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-warm-white truncate">{stem.title}</p>
                          <StemStatusBadge status={stem.status} />
                          {stem.is_verified && <span className="text-[10px] text-amber font-mono font-bold">PRO</span>}
                        </div>
                        <p className="text-[11px] text-dim">{stem.artist} &middot; {stem.uploader_handle}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleVerify(stem.id, stem.is_verified)}
                          title={stem.is_verified ? 'Remove Pro' : 'Mark as Pro'}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-amber/60 hover:text-amber hover:bg-amber/15 transition-colors"
                        >
                          {stem.is_verified ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(stem.id)}
                          title="Delete stem"
                          className="w-7 h-7 rounded-full flex items-center justify-center text-error/60 hover:text-error hover:bg-error/15 transition-colors"
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
            <div className="space-y-6">

              {/* Quick Promote Form */}
              <div className="bg-surface-high border border-border/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
                <h3 className="text-sm font-bold text-warm-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber" />
                  Promote Member Role
                </h3>
                <p className="text-xs text-dim">
                  Grant a member Super User / Pro status or Admin permissions by typing their email.
                </p>

                <form onSubmit={handlePromote} className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="user@church.org"
                    className="flex-1 bg-surface border border-border/80 rounded-xl px-3.5 py-2 text-xs text-warm-white focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/40 placeholder:text-dim/50"
                  />

                  <select
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value as UserRole)}
                    className="bg-surface border border-border/80 rounded-xl px-3 py-2 text-xs text-warm-white focus:outline-none focus:border-amber cursor-pointer"
                  >
                    <option value="verified" className="bg-surface">Super User / Pro (Verified)</option>
                    <option value="admin" className="bg-surface">Admin</option>
                    <option value="user" className="bg-surface">Member (Standard)</option>
                  </select>

                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-amber hover:bg-amber-muted disabled:opacity-50 text-obsidian font-bold text-xs px-5 py-2 rounded-full transition-all shadow-sm active:scale-95 whitespace-nowrap"
                  >
                    {loading ? 'Saving...' : 'Update Role'}
                  </button>
                </form>
              </div>

              {/* User Directory */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-bold text-warm-white">User Directory</h3>
                  <div className="relative w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dim pointer-events-none" />
                    <input
                      type="text"
                      value={filterSearch}
                      onChange={e => setFilterSearch(e.target.value)}
                      placeholder="Filter users..."
                      className="w-full bg-surface border border-border/80 rounded-full pl-8 pr-3 py-1.5 text-xs text-warm-white focus:outline-none focus:border-amber placeholder:text-dim/50"
                    />
                  </div>
                </div>

                {fetchingProfiles ? (
                  <p className="text-xs text-dim py-4 text-center">Loading user profiles...</p>
                ) : filteredProfiles.length === 0 ? (
                  <p className="text-xs text-dim py-4 text-center">No profiles found in the database.</p>
                ) : (
                  <div className="border border-border/70 rounded-2xl divide-y divide-border/60 overflow-hidden bg-surface-high/50">
                    {filteredProfiles.map(p => (
                      <div key={p.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-surface-high transition-colors">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-warm-white truncate">{p.email || 'No email'}</p>
                            <RoleBadge role={p.role} />
                          </div>
                          <p className="text-xs text-dim mt-0.5">{p.display_name ? `@${p.display_name}` : 'No handle'}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleRoleChangeForUser(p.email || '', 'verified')}
                            title="Promote to Pro Tech"
                            className={clsx(
                              'text-xs px-3 py-1 rounded-full font-medium transition-all',
                              p.role === 'verified'
                                ? 'bg-amber/20 text-amber border border-amber/40 font-bold'
                                : 'text-dim hover:text-warm-white hover:bg-surface-raised border border-border/70'
                            )}
                          >
                            {p.role === 'verified' && <Check className="w-3 h-3 inline mr-1" />}
                            Pro Tech
                          </button>

                          <button
                            onClick={() => handleRoleChangeForUser(p.email || '', 'admin')}
                            title="Make Admin"
                            className={clsx(
                              'text-xs px-3 py-1 rounded-full font-medium transition-all',
                              p.role === 'admin'
                                ? 'bg-error/20 text-error border border-error/40 font-bold'
                                : 'text-dim hover:text-warm-white hover:bg-surface-raised border border-border/70'
                            )}
                          >
                            {p.role === 'admin' && <Check className="w-3 h-3 inline mr-1" />}
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
    return (
      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-error/15 text-error border border-error/30">
        ADMIN
      </span>
    );
  }
  if (role === 'verified') {
    return (
      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-amber/15 text-amber border border-amber/30">
        SUPER USER / PRO
      </span>
    );
  }
  return (
    <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-surface border border-border/70 text-dim">
      MEMBER
    </span>
  );
}

function StemStatusBadge({ status }: { status: string }) {
  if (status === 'published') {
    return <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.2 rounded-full font-mono">LIVE</span>;
  }
  if (status === 'pending') {
    return <span className="text-[10px] font-bold text-yellow-400 bg-yellow-950/60 border border-yellow-800/50 px-2 py-0.2 rounded-full font-mono">PENDING</span>;
  }
  return <span className="text-[10px] font-bold text-error bg-error/15 border border-error/30 px-2 py-0.2 rounded-full font-mono">FLAGGED</span>;
}
