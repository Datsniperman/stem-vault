'use client';

import React, { useState, useEffect } from 'react';
import { X, Music2, AlertCircle, Loader2, CheckCircle2, User as UserIcon } from 'lucide-react';
import { Mix, Multi } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface EditMixModalProps {
  isOpen: boolean;
  onClose: () => void;
  mix: Mix | null;
  onSuccess?: () => void;
}

interface AdminUser {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  isPro?: boolean;
}

export function EditMixModal({
  isOpen,
  onClose,
  mix,
  onSuccess,
}: EditMixModalProps) {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || user?.role === 'admin';

  const [title, setTitle] = useState('');
  const [selectedMultiId, setSelectedMultiId] = useState('');
  const [isSundayReview, setIsSundayReview] = useState(false);
  const [ownerId, setOwnerId] = useState('');
  const [multis, setMultis] = useState<Multi[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && mix) {
      setTitle(mix.title || '');
      setSelectedMultiId(mix.multi_id || '');
      setIsSundayReview(Boolean(mix.is_sunday_review));
      setOwnerId(mix.owner_id || '');
      setError(null);

      fetch('/api/multis')
        .then(res => res.json())
        .then(data => setMultis(data.multis || []))
        .catch(err => console.warn('Could not load multis:', err));

      if (isAdmin) {
        setLoadingUsers(true);
        fetch('/api/admin/users')
          .then(res => res.json())
          .then(data => {
            if (data.users) setUsers(data.users);
          })
          .catch(err => console.warn('Could not load members for reassignment:', err))
          .finally(() => setLoadingUsers(false));
      }
    }
  }, [isOpen, mix, isAdmin]);

  if (!isOpen || !mix) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Mix title is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: any = {
        title: title.trim(),
        multi_id: selectedMultiId || null,
        is_sunday_review: isSundayReview,
      };

      if (isAdmin && ownerId && ownerId !== mix.owner_id) {
        payload.owner_id = ownerId;
      }

      const res = await fetch(`/api/mixes/${mix.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update mix.');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error updating mix details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fade-in_0.15s_ease-out]">
      <div className="bg-[#121212] border border-neutral-800 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Music2 className="w-5 h-5 text-neutral-300" />
              <span>Edit Mix Details</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Modify title, linked multitrack, Sunday review status, or uploader.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-lg text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Mix Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={saving}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Linked Multi / Song (Optional)
              </label>
              <select
                value={selectedMultiId}
                onChange={e => setSelectedMultiId(e.target.value)}
                disabled={saving}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-500 cursor-pointer"
              >
                <option value="">None (Standalone Mix)</option>
                {multis.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Sunday Mix Review Toggle */}
            <div className={`p-3 rounded-lg border transition-colors ${
              isSundayReview
                ? 'bg-purple-950/40 border-purple-800/80'
                : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
            }`}>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSundayReview}
                  onChange={e => setIsSundayReview(e.target.checked)}
                  disabled={saving}
                  className="w-4 h-4 rounded border-neutral-700 text-purple-600 focus:ring-0 bg-neutral-800 cursor-pointer mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white">
                      Sunday Mix Review
                    </span>
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-700/50">
                      PREMIUM
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Direct review queue for feedback from Jared and pro engineers.
                  </p>
                </div>
              </label>
            </div>

            {/* Admin Controls */}
            {isAdmin && (
              <div className="space-y-3 pt-2 border-t border-neutral-800/80">
                <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                  Administrator Privileges
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Uploaded By / Owner</span>
                    </span>
                    {loadingUsers && (
                      <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-mono">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Loading members...</span>
                      </span>
                    )}
                  </label>
                  <select
                    value={ownerId}
                    onChange={e => setOwnerId(e.target.value)}
                    disabled={saving || loadingUsers}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-500 cursor-pointer"
                  >
                    {users.map(u => {
                      const badge = u.isPro && u.role === 'admin'
                        ? 'Pro / Admin'
                        : u.isPro
                        ? 'Pro'
                        : u.role === 'admin'
                        ? 'Admin'
                        : u.role || 'Member';
                      return (
                        <option key={u.id} value={u.id}>
                          {u.displayName} ({badge}{u.email ? ` - ${u.email}` : ''})
                        </option>
                      );
                    })}
                    {!users.some(u => u.id === ownerId) && (
                      <option value={ownerId}>
                        Current Owner ({mix.uploader_name || ownerId})
                      </option>
                    )}
                  </select>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Reassigning ownership updates the visible uploader handle and edit permissions for this mix.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-3.5 py-1.5 rounded text-xs font-medium text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="bg-white hover:bg-neutral-200 disabled:opacity-50 text-black font-semibold text-xs px-4 py-2 rounded transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
