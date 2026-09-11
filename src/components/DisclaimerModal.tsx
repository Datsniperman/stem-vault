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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface border border-border rounded-sm w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-amber/10 border border-amber/30 flex items-center justify-center text-amber">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-xl text-warm-white">Platform Disclaimer & Alpha Notice</h2>
              <p className="text-dim text-xs font-body">Stem Vault Public Alpha Prototype</p>
            </div>
          </div>
          <button onClick={onClose} className="text-dim hover:text-warm-white p-1 transition-colors rounded-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm font-body text-mid leading-relaxed overflow-y-auto">
          <div className="bg-amber-dim border border-amber/30 rounded-sm p-4 text-amber text-xs space-y-1">
            <p className="font-bold text-sm">⚠️ Experimental & AI-Assisted Prototype</p>
            <p>
              Stem Vault is currently a public test/alpha prototype created to gauge demand for an open multi-track audio sharing platform for live engineers and worship producers.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-warm-white text-base">Key Guidelines & Terms:</h3>

            <ul className="list-disc pl-5 space-y-2 text-xs text-mid">
              <li>
                <strong className="text-warm-white">Security & Passwords:</strong> Do <strong>NOT</strong> use real or critical personal passwords on this alpha prototype. While authentication is managed via Supabase, this platform is in active rapid development.
              </li>
              <li>
                <strong className="text-warm-white">User Rights & Content:</strong> All multi-track sessions submitted to Stem Vault are community-sourced links (Google Drive, Dropbox, etc.). Users certifying upload confirm they hold the appropriate rights or authorization to distribute these assets.
              </li>
              <li>
                <strong className="text-warm-white">Non-Commercial Use:</strong> Files hosted or linked through Stem Vault are strictly intended for educational, mix practice, and community study purposes. Commercial resale of stems is prohibited.
              </li>
              <li>
                <strong className="text-warm-white">Future Roadmap:</strong> If community demand and usage warrant it, a custom-built production platform featuring direct self-hosted multi-gigabyte uploads and advanced stem preview tools will follow this alpha phase.
              </li>
            </ul>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-amber hover:bg-amber-muted text-obsidian font-body font-bold text-xs px-6 py-2 rounded-sm transition-colors uppercase tracking-wider"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
