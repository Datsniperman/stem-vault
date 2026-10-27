'use client';

import { X, ShieldAlert } from 'lucide-react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DisclaimerModal({ isOpen, onClose }: DisclaimerModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-md animate-[fade-in_0.15s_ease-out]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface-raised border border-border/80 rounded-3xl w-full max-w-xl shadow-m3-3 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber/15 border border-amber/30 flex items-center justify-center text-amber">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-warm-white">Community Guidelines & Terms</h2>
              <p className="text-dim text-xs font-body">The Mixing Vault • Tyler Kerpsack All Access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-dim hover:text-warm-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs font-body text-mid leading-relaxed overflow-y-auto">
          <div className="bg-amber/10 border border-amber/30 rounded-2xl p-4 text-amber text-xs space-y-1">
            <p className="font-bold text-sm">🎛️ Multitrack Hub For All Access</p>
            <p>
              The Mixing Vault is the official multitrack audio exchange for the Tyler Kerpsack All Access Discord community, integrated directly with KerpBot.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-warm-white text-sm">Key Community Terms:</h3>

            <ul className="list-disc pl-5 space-y-2 text-xs text-dim">
              <li>
                <strong className="text-warm-white">Discord Guild Authentication:</strong> Access to publishing stems and submitting mix critique entries requires membership in the official Tyler Kerpsack All Access Discord server.
              </li>
              <li>
                <strong className="text-warm-white">User Rights & Content:</strong> All multitrack sessions and DAW templates submitted to the vault are community-sourced links (Google Drive, Dropbox, OneDrive, Box). Users certifying upload confirm they hold the authorization to share these audio assets for practice.
              </li>
              <li>
                <strong className="text-warm-white">Educational & Practice Purpose:</strong> Multitracks hosted or linked through The Mixing Vault are strictly intended for mix practice, peer feedback, and community education. Commercial resale or redistribution is prohibited.
              </li>
              <li>
                <strong className="text-warm-white">KerpBot Synchronization:</strong> Submissions and mixes are posted to Discord threads automatically. Respect community critique guidelines and keep discussions constructive.
              </li>
            </ul>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border/60 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-amber hover:bg-amber-muted text-obsidian font-bold text-xs px-6 py-2.5 rounded-full transition-all shadow-m3-1 hover:shadow-m3-2 active:scale-95 uppercase tracking-wider"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
