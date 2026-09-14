'use client';

import { X, Sparkles, History, GitCommit } from 'lucide-react';
import changelogData from '@/data/changelog.json';

interface UpdateLogEntry {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

interface UpdateLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpdateLogsModal({ isOpen, onClose }: UpdateLogsModalProps) {
  if (!isOpen) return null;

  const changelog = changelogData as UpdateLogEntry[];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface border border-border rounded-sm w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-amber/10 border border-amber/30 flex items-center justify-center text-amber">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-xl text-warm-white">System Update Logs</h2>
              <p className="text-dim text-xs font-body">Latest releases & platform updates for Stem Vault</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-dim hover:text-warm-white transition-colors p-1"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {changelog.map((entry, idx) => (
            <div
              key={entry.version}
              className={`space-y-3 ${idx < changelog.length - 1 ? 'pb-6 border-b border-border/60' : ''}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-amber/10 text-amber border border-amber/30 px-2 py-0.5 rounded-sm">
                    v{entry.version}
                  </span>
                  <h3 className="font-display text-lg text-warm-white font-semibold">{entry.title}</h3>
                </div>
                <span className="text-xs font-mono text-dim">{entry.date}</span>
              </div>

              <ul className="space-y-2 pl-1">
                {entry.changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs font-body text-mid leading-relaxed">
                    <span className="text-amber mt-0.5 shrink-0">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-surface-raised flex items-center justify-between text-xs text-dim font-body shrink-0">
          <div className="flex items-center gap-1.5">
            <GitCommit className="w-3.5 h-3.5 text-amber" />
            <span>Updated automatically on production release</span>
          </div>
          <button
            onClick={onClose}
            className="bg-obsidian border border-border hover:border-amber text-warm-white px-4 py-1.5 rounded-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}