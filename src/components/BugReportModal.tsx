'use client';

import { useState } from 'react';
import { X, Bug } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-[fade-in_0.15s_ease-out]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#121212] border border-neutral-800 rounded-lg w-full max-w-md shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-neutral-300" />
            <h2 className="text-sm font-semibold text-white">Feedback & Bug Report</h2>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="space-y-1">
            <label className="block text-[11px] font-mono uppercase text-neutral-400">
              Contact Handle or Email *
            </label>
            <input
              type="text"
              required
              value={contactInfo}
              onChange={e => setContactInfo(e.target.value)}
              placeholder="e.g. handle or user@email.com"
              className="w-full bg-[#0d0d0e] border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-neutral-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-mono uppercase text-neutral-400">
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Steps to reproduce, bot feedback, or questions..."
              className="w-full bg-[#0d0d0e] border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-neutral-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-white hover:bg-neutral-200 disabled:opacity-50 text-black font-semibold text-xs px-3.5 py-1.5 rounded transition-colors shadow-xs"
            >
              {submitting ? 'Submitting…' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
