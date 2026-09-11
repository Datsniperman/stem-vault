'use client';

import { useState } from 'react';
import { X, Bug, Send } from 'lucide-react';
import { submitBugReport } from '@/app/actions/stems';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BugReportModal({ isOpen, onClose }: BugReportModalProps) {
  const { user, profile } = useAuth();
  const { addToast } = useToast();
  const [contactInfo, setContactInfo] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactInfo.trim() || !description.trim()) {
      addToast('Please fill out all fields.', 'error');
      return;
    }

    setSubmitting(true);
    const userHandle = profile?.display_name ? `@${profile.display_name}` : user?.email || undefined;
    const res = await submitBugReport(contactInfo, description, userHandle);
    setSubmitting(false);

    if (res.success) {
      addToast(res.message, 'success');
      setContactInfo('');
      setDescription('');
      onClose();
    } else {
      addToast(res.message, 'error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface border border-border rounded-sm w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-amber/10 border border-amber/30 flex items-center justify-center text-amber">
              <Bug className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-xl text-warm-white">Report a Bug / Feedback</h2>
              <p className="text-dim text-xs font-body">Stem Vault Public Alpha</p>
            </div>
          </div>
          <button onClick={onClose} className="text-dim hover:text-warm-white p-1 transition-colors rounded-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-body text-dim">
              Your Email or Discord Handle *
            </label>
            <input
              type="text"
              required
              value={contactInfo}
              onChange={e => setContactInfo(e.target.value)}
              placeholder="e.g. user@gmail.com or handle#1234"
              className="w-full bg-obsidian border border-border rounded-sm px-3 py-2 text-warm-white font-body text-sm focus:outline-none focus:border-amber transition-colors"
            />
            <p className="text-[10px] text-dim font-body">So we can follow up with you if needed.</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-body text-dim">
              Bug Description / Expected Behavior *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what happened, steps to reproduce, or feedback for the alpha..."
              className="w-full bg-obsidian border border-border rounded-sm px-3 py-2 text-warm-white font-body text-sm focus:outline-none focus:border-amber transition-colors resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="font-body text-sm text-dim hover:text-warm-white px-4 py-2 border border-border rounded-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-amber hover:bg-amber-muted disabled:opacity-50 text-obsidian font-body font-bold text-sm px-6 py-2 rounded-sm transition-colors uppercase tracking-wider flex items-center gap-2"
            >
              <span>{submitting ? 'Sending...' : 'Submit Bug Report'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
