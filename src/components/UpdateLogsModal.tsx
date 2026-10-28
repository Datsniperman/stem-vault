'use client';

import { X, Sparkles, GitCommit } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-[fade-in_0.15s_ease-out]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#313338] border border-[#1f2023] rounded-lg w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-xs">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1f2023] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#5865F2]" />
            <h2 className="text-sm font-bold text-[#f2f3f5]">System Changelog & Updates</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#949ba4] hover:text-[#f2f3f5] p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {changelog.map((entry, idx) => (
            <div
              key={entry.version}
              className={`space-y-2 ${idx < changelog.length - 1 ? 'pb-4 border-b border-[#1f2023]' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold bg-[#5865F2]/15 text-[#5865F2] px-1.5 py-0.2 rounded">
                    v{entry.version}
                  </span>
                  <h3 className="text-xs text-[#f2f3f5] font-semibold">{entry.title}</h3>
                </div>
                <span className="text-[10px] text-[#80848e]">{entry.date}</span>
              </div>

              <ul className="space-y-1 pl-1">
                {entry.changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-[#dbdee1] leading-relaxed">
                    <span className="text-[#5865F2] shrink-0">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1f2023] bg-[#2b2d31] flex items-center justify-between text-[#949ba4] shrink-0">
          <div className="flex items-center gap-1.5">
            <GitCommit className="w-3.5 h-3.5 text-[#5865F2]" />
            <span>The Mixing Vault &bull; KerpBot</span>
          </div>
          <button
            onClick={onClose}
            className="bg-[#1e1f22] hover:bg-[#35373c] text-[#dbdee1] px-3 py-1 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
