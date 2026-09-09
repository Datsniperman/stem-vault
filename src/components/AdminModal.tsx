'use client';

import { useState, useEffect } from 'react';
import { X, Shield, Award, User, Check, Search, Flag, Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import { getAllProfiles, setUserRoleByEmail, getFlaggedStems, unflagStem, deleteStem } from '@/app/actions/stems';
import { Profile, UserRole, Stem } from '@/types';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminModal({ isOpen, onClose }: AdminModalProps) {
  const { addToast } = useToast();
  const { user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'flagged'>('users');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [flaggedStems, setFlaggedStems] = useState<Stem[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('verified');
  const [loading, setLoading] = useState(false);
  const [fetchingProfiles, setFetchingProfiles] = useState(false);
  const [fetchingFlagged, setFetchingFlagged] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');

  const loadProfiles = async () => {
    setFetchingProfiles(true);
    const data = await getAllProfiles();
    setProfiles(data);
    setFetchingProfiles(false);
  };

  const loadFlaggedStems = async () => {
    setFetchingFlagged(true);
    const data = await getFlaggedStems();
    setFlaggedStems(data);
    setFetchingFlagged(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadProfiles();
      loadFlaggedStems();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUnflag = async (stemId: string) => {
    const res = await unflagStem(stemId);
    if (res.success) {
      addToast(res.message, 'success');
      setFlaggedStems(prev => prev.filter(s => s.id !== stemId));
    } else {
      addToast(res.message, 'error');
    }
  };

  const handleDeleteFlagged = async (stemId: string) => {
    if (!confirm('Are you sure you want to permanently delete this stem session?')) return;
    const res = await deleteStem(stemId);
    if (res.success) {
      addToast('Stem session deleted from archive.', 'info');
      setFlaggedStems(prev => prev.filter(s => s.id !== stemId));
    } else {
      addToast(res.message, 'error');
    }
  };

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
      if (user?.email?.toLowerCase() === email.toLowerCase()) {
        await refreshProfile();
      }
      loadProfiles();
    } else {
      addToast(res.message, 'error');
    }
  };

  const filteredProfiles = profiles.filter(p =>
    (p.email || '').toLowerCase().includes(filterSearch.toLowerCase()) ||
    (p.display_name || '').toLowerCase().includes(filterSearch.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface border border-border rounded-sm w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-error/10 border border-error/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-error" />
            </div>
            <div>
              <h2 className="font-display text-xl text-warm-white">Admin Control Center</h2>
              <p className="text-xs text-dim font-body">Manage Super Users, Pros, and Reported Content</p>
            </div>
          </div>
          <button onClick={onClose} className="text-dim hover:text-warm-white p-1.5 transition-colors rounded-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border bg-obsidian/50 px-6 pt-2 shrink-0 gap-4 text-xs font-body font-semibold">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2.5 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'users' ? 'border-amber text-amber font-bold' : 'border-transparent text-dim hover:text-warm-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>User Management ({profiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('flagged')}
            className={`pb-2.5 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'flagged' ? 'border-amber text-amber font-bold' : 'border-transparent text-dim hover:text-warm-white'
            }`}
          >
            <Flag className="w-3.5 h-3.5 text-error" />
            <span>Reported Links Inbox ({flaggedStems.length})</span>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {activeTab === 'users' ? (
            <>
              {/* Quick Promote Form */}
              <div className="bg-surface-raised border border-border rounded p-4 space-y-3">
                <h3 className="text-sm font-body font-semibold text-warm-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-verified" />
                  Promote User / Set Super User Status
                </h3>
                <p className="text-xs text-dim font-body">
                  Grant a user Super User / Pro status or Admin rights by typing their sign-in email address.
                </p>

                <form onSubmit={handlePromote} className="flex flex-col sm:flex-row gap-3 pt-1">
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="user@church.org"
                    className="flex-1 bg-obsidian border border-border rounded px-3 py-2 text-sm text-warm-white font-body focus:outline-none focus:border-amber placeholder:text-dim/50"
                  />

                  <select
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value as UserRole)}
                    className="bg-obsidian border border-border rounded px-3 py-2 text-sm text-warm-white font-body focus:outline-none focus:border-amber"
                  >
                    <option value="verified">Super User / Pro (Verified)</option>
                    <option value="admin">Admin</option>
                    <option value="user">Member (Standard)</option>
                  </select>

                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-amber hover:bg-amber-muted disabled:opacity-50 text-obsidian font-body font-semibold text-sm px-5 py-2 rounded transition-colors whitespace-nowrap"
                  >
                    {loading ? 'Saving…' : 'Update Role'}
                  </button>
                </form>
              </div>

              {/* User Directory */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-body font-semibold text-warm-white">User Directory</h3>
                  <div className="relative w-48">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-dim pointer-events-none" />
                    <input
                      type="text"
                      value={filterSearch}
                      onChange={e => setFilterSearch(e.target.value)}
                      placeholder="Filter users…"
                      className="w-full bg-obsidian border border-border rounded pl-7 pr-2 py-1 text-xs text-warm-white font-body focus:outline-none focus:border-amber placeholder:text-dim/50"
                    />
                  </div>
                </div>

                {fetchingProfiles ? (
                  <p className="text-xs text-dim font-body py-4 text-center">Loading user profiles…</p>
                ) : filteredProfiles.length === 0 ? (
                  <p className="text-xs text-dim font-body py-4 text-center">No profiles found in the database.</p>
                ) : (
                  <div className="border border-border rounded divide-y divide-border">
                    {filteredProfiles.map(p => (
                      <div key={p.id} className="p-3 flex items-center justify-between gap-4 bg-surface hover:bg-surface-raised transition-colors">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-body text-warm-white font-medium truncate">{p.email || 'No email'}</p>
                            <RoleBadge role={p.role} />
                          </div>
                          <p className="text-xs text-dim font-body mt-0.5">{p.display_name ? `@${p.display_name}` : 'No handle'}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleRoleChangeForUser(p.email || '', 'verified')}
                            title="Promote to Super User / Pro"
                            className={`text-xs px-2.5 py-1 rounded font-body transition-colors ${
                              p.role === 'verified'
                                ? 'bg-verified-dim text-verified border border-verified/30 font-semibold'
                                : 'text-dim hover:text-warm-white hover:bg-surface-raised border border-border'
                            }`}
                          >
                            {p.role === 'verified' && <Check className="w-3 h-3 inline mr-1" />}
                            Pro Tech
                          </button>

                          <button
                            onClick={() => handleRoleChangeForUser(p.email || '', 'admin')}
                            title="Make Admin"
                            className={`text-xs px-2.5 py-1 rounded font-body transition-colors ${
                              p.role === 'admin'
                                ? 'bg-error/10 text-error border border-error/30 font-semibold'
                                : 'text-dim hover:text-warm-white hover:bg-surface-raised border border-border'
                            }`}
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
            </>
          ) : (
            /* Reported Links Inbox Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-body font-semibold text-warm-white flex items-center gap-2">
                    <Flag className="w-4 h-4 text-error" />
                    Reported / Flagged Links Inbox
                  </h3>
                  <p className="text-xs text-dim font-body mt-0.5">
                    Sessions reported by users for dead links, access restriction, or invalid files.
                  </p>
                </div>
                <button
                  onClick={loadFlaggedStems}
                  className="p-1.5 text-dim hover:text-amber border border-border rounded transition-colors"
                  title="Refresh inbox"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {fetchingFlagged ? (
                <p className="text-xs text-dim font-body py-6 text-center">Loading reported links…</p>
              ) : flaggedStems.length === 0 ? (
                <div className="border border-border rounded p-8 text-center bg-surface-raised space-y-1">
                  <p className="text-sm font-body text-warm-white font-medium">No reported links!</p>
                  <p className="text-xs text-dim font-body">All stem download links are active and healthy.</p>
                </div>
              ) : (
                <div className="border border-border rounded divide-y divide-border">
                  {flaggedStems.map(s => (
                    <div key={s.id} className="p-4 bg-surface hover:bg-surface-raised transition-colors space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-base font-body font-bold text-warm-white">{s.title}</h4>
                          <p className="text-xs text-amber font-body">by {s.artist}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleUnflag(s.id)}
                            className="flex items-center gap-1 text-xs bg-surface-raised border border-border hover:border-amber text-warm-white px-3 py-1.5 rounded transition-colors font-body"
                          >
                            <RefreshCw className="w-3 h-3 text-amber" />
                            <span>Clear Report</span>
                          </button>

                          <button
                            onClick={() => handleDeleteFlagged(s.id)}
                            className="flex items-center gap-1 text-xs bg-error/10 border border-error/30 hover:bg-error/20 text-error px-3 py-1.5 rounded transition-colors font-body"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete Stem</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-dim font-body pt-1">
                        <span>Host: <strong className="text-warm-white">{s.host_platform}</strong></span>
                        <span>Uploader: <strong className="text-warm-white">{s.uploader_handle}</strong></span>
                        <a
                          href={s.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber hover:underline inline-flex items-center gap-1 font-medium ml-auto"
                        >
                          <span>Test Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
      <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded bg-error/10 text-error border border-error/20">
        ADMIN
      </span>
    );
  }
  if (role === 'verified') {
    return (
      <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded bg-verified-dim text-verified border border-verified/20">
        SUPER USER / PRO
      </span>
    );
  }
  return (
    <span className="text-[10px] font-body px-2 py-0.5 rounded bg-surface-raised text-dim border border-border">
      MEMBER
    </span>
  );
}
