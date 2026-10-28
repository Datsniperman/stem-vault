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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-[fade-in_0.15s_ease-out]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#313338] border border-[#1f2023] rounded-lg w-full max-w-md shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1f2023] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-[#5865F2]" />
            <h2 className="text-sm font-bold text-[#f2f3f5]">Bug Report & Bot Feedback</h2>
          </div>
          <button onClick={onClose} className="text-[#949ba4] hover:text-[#f2f3f5] p-1 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
              Discord Handle or Email *
            </label>
            <input
              type="text"
              required
              value={contactInfo}
              onChange={e => setContactInfo(e.target.value)}
              placeholder="e.g. handle or user@email.com"
              className="w-full bg-[#1e1f22] border border-[#1f2023] rounded px-3 py-1.5 text-xs text-[#dbdee1] focus:outline-none focus:border-[#5865F2]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
              Description of Issue *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Steps to reproduce, bot issue, or feedback..."
              className="w-full bg-[#1e1f22] border border-[#1f2023] rounded px-3 py-2 text-xs text-[#dbdee1] focus:outline-none focus:border-[#5865F2] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#1f2023]">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[#dbdee1] hover:underline px-3 py-1.5 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 text-white font-medium text-xs px-3.5 py-1.5 rounded transition-colors"
            >
              {submitting ? 'Submitting…' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
