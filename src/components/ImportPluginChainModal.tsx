'use client';

import React, { useState } from 'react';
import { X, FileCode, Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface ImportPluginChainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ImportPluginChainModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportPluginChainModalProps) {
  const [jsonText, setJsonText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
    };
    reader.onerror = () => {
      setError('Could not read JSON file.');
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonText.trim()) {
      setError('Please provide JSON content to import.');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        throw new Error('Invalid JSON format. Please verify your JSON syntax.');
      }

      const res = await fetch('/api/plugin-chains/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import chain');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error during chain import.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fade-in_0.15s_ease-out]">
      <div className="bg-[#121212] border border-neutral-800 rounded-xl w-full max-w-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <FileCode className="w-5 h-5 text-neutral-300" />
              <span>Import Plugin Chain (JSON)</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Import a plugin chain schema file (v1.0.0).
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-lg text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-400">
            <span className="font-semibold text-neutral-200 block mb-0.5">DAW plugin support coming later — export/import schema ready.</span>
            You can import any chain exported from The Mixing Vault or matching the versioned <code className="text-neutral-300">PLUGIN-CHAIN-SCHEMA.md</code> spec.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Upload Button */}
            <div className="relative border border-dashed border-neutral-800 hover:border-neutral-700 rounded-lg p-4 flex flex-col items-center justify-center text-center bg-neutral-900/40 transition-colors">
              <Upload className="w-6 h-6 text-neutral-500 mb-1" />
              <p className="text-xs text-neutral-300 font-medium">
                {fileName ? fileName : 'Choose .json file'}
              </p>
              <p className="text-[10px] text-neutral-500">Or paste JSON below</p>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                disabled={importing}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            {/* Paste Area */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Chain JSON Payload
              </label>
              <textarea
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                placeholder='{"schema_version": "1.0.0", "name": "...", "daw": "...", "plugins": [...]}'
                rows={6}
                disabled={importing}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={importing}
                className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={importing || !jsonText.trim()}
                className="bg-white hover:bg-neutral-200 disabled:opacity-50 text-black font-semibold text-xs px-4 py-2 rounded transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <span>Import Chain</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
