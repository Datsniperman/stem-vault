'use client';

import React, { useState, useEffect } from 'react';
import { X, Layers, AlertCircle, Loader2, CheckCircle2, User as UserIcon } from 'lucide-react';
import { Multi } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface EditMultiModalProps {
  isOpen: boolean;
  onClose: () => void;
  multi: Multi;
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

export function EditMultiModal({
  isOpen,
  onClose,
  multi,
  onSuccess,
}: EditMultiModalProps) {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || user?.role === 'admin';

  const [title, setTitle] = useState(multi.title || '');
  const [description, setDescription] = useState(multi.description || '');
  const [isPro, setIsPro] = useState(Boolean(multi.is_pro));
  const [ownerId, setOwnerId] = useState(multi.owner_id || '');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(multi.title || '');
      setDescription(multi.description || '');
      setIsPro(Boolean(multi.is_pro));
      setOwnerId(multi.owner_id || '');
      setError(null);

      if (isAdmin) {
        setLoadingUsers(true);
        fetch('/api/admin/users')
          .then(res => res.json())
          .then(data => {
            if (data.users) setUsers(data.users);
          })
          .catch(err => console.warn('Could not load users for owner reassignment:', err))
          .finally(() => setLoadingUsers(false));
      }
    }
  }, [isOpen, multi, isAdmin]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Multi title is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim() || null,
      };

      if (isAdmin) {
        payload.is_pro = isPro;
        if (ownerId && ownerId !== multi.owner_id) {
          payload.owner_id = ownerId;
        }
      }

      const res = await fetch(`/api/multis/${multi.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update multi.');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error updating multi details.');
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
              <Layers className="w-5 h-5 text-neutral-300" />
              <span>Edit Multitrack Details</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Update title, description, tier requirements, or reassign uploader.
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
                Song / Multi Title <span className="text-red-400">*</span>
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
                Description / Notes
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                disabled={saving}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
              />
            </div>

            {/* Admin Controls */}
            {isAdmin && (
              <div className="space-y-3 pt-2 border-t border-neutral-800/80">
                <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                  Administrator Privileges
                </div>

                {/* Uploader / Owner Reassignment */}
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
                        Current Owner ({multi.uploader_name || ownerId})
                      </option>
                    )}
                  </select>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Reassigning ownership updates the visible uploader badge and permissions across the website.
                  </p>
                </div>

                {/* Pro Multitrack Toggle */}
                <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-lg">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPro}
                      onChange={e => setIsPro(e.target.checked)}
                      disabled={saving}
                      className="w-4 h-4 rounded border-neutral-700 text-amber-500 focus:ring-0 bg-neutral-800 cursor-pointer mt-0.5"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white">Mark as Pro Multitrack</span>
                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-700/50">
                          PREMIUM ONLY
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Exclusive to Premium Tier members ($30/mo) recorded by pros/churches.
                      </p>
                    </div>
                  </label>
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
