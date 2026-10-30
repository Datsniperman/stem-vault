'use client';

import React, { useState, useEffect } from 'react';
import { X, Sliders, Plus, Trash2, ArrowUp, ArrowDown, Loader2, AlertCircle } from 'lucide-react';
import { PluginChain, PluginChainItem } from '@/types';

interface CreatePluginChainModalProps {
  isOpen: boolean;
  onClose: () => void;
  chainToEdit?: PluginChain | null;
  onSuccess?: () => void;
}

const COMMON_DAWS = [
  'Logic Pro',
  'Pro Tools',
  'Ableton Live',
  'FL Studio',
  'Studio One',
  'Reaper',
  'Cubase',
  'Bitwig Studio',
  'Luna',
  'Reason',
];

const COMMON_CATEGORIES = [
  'Preamp',
  'EQ',
  'Dynamic EQ',
  'Compressor',
  'Multiband',
  'De-Esser',
  'Saturation',
  'Modulation',
  'Delay',
  'Reverb',
  'Pitch Correction',
  'Limiter',
  'Bus',
  'Master',
  'Utility',
];

export function CreatePluginChainModal({
  isOpen,
  onClose,
  chainToEdit,
  onSuccess,
}: CreatePluginChainModalProps) {
  const [name, setName] = useState('');
  const [daw, setDaw] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<PluginChainItem[]>([
    { position: 1, plugin_name: '', vendor: '', category: '', notes: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (chainToEdit) {
        setName(chainToEdit.name);
        setDaw(chainToEdit.daw);
        setDescription(chainToEdit.description || '');
        setItems(
          chainToEdit.items && chainToEdit.items.length > 0
            ? chainToEdit.items.map((it, idx) => ({ ...it, position: idx + 1 }))
            : [{ position: 1, plugin_name: '', vendor: '', category: '', notes: '' }]
        );
      } else {
        setName('');
        setDaw('');
        setDescription('');
        setItems([
          { position: 1, plugin_name: '', vendor: '', category: '', notes: '' },
        ]);
      }
    }
  }, [isOpen, chainToEdit]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      { position: items.length + 1, plugin_name: '', vendor: '', category: '', notes: '' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    const updated = items.filter((_, idx) => idx !== index).map((it, idx) => ({ ...it, position: idx + 1 }));
    setItems(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const copy = [...items];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    const reordered = copy.map((it, idx) => ({ ...it, position: idx + 1 }));
    setItems(reordered);
  };

  const handleItemChange = (index: number, field: keyof PluginChainItem, value: any) => {
    const copy = [...items];
    copy[index] = { ...copy[index], [field]: value };
    setItems(copy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Chain name is required.');
      return;
    }
    if (!daw.trim()) {
      setError('DAW is required.');
      return;
    }

    const validPlugins = items.filter(it => it.plugin_name.trim());
    if (validPlugins.length === 0) {
      setError('Please add at least one plugin with a valid name.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        daw: daw.trim(),
        description: description.trim() || null,
        items: validPlugins.map((it, idx) => ({ ...it, position: idx + 1 })),
      };

      const url = chainToEdit ? `/api/plugin-chains/${chainToEdit.id}` : '/api/plugin-chains';
      const method = chainToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save plugin chain');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error saving plugin chain.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fade-in_0.15s_ease-out]">
      <div className="bg-[#121212] border border-neutral-800 rounded-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 sticky top-0 bg-[#121212] z-10">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-neutral-300" />
              <span>{chainToEdit ? 'Edit Plugin Chain' : 'Create Plugin Chain'}</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Build an ordered audio plugin processing chain with settings & notes.
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
        <div className="p-4 sm:p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-lg text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Chain Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Lead Vocal Polish Chain"
                  disabled={saving}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  DAW <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  list="daw-suggestions"
                  value={daw}
                  onChange={e => setDaw(e.target.value)}
                  placeholder="e.g. Logic Pro, Pro Tools, Ableton..."
                  disabled={saving}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                />
                <datalist id="daw-suggestions">
                  {COMMON_DAWS.map(d => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Description & Mix Context (Optional)
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Routing notes, mix context, ideal vocal range, tracking tips..."
                rows={2}
                disabled={saving}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
              />
            </div>

            {/* Plugin Slots */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  Plugins in Signal Chain ({items.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-xs text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-2.5 py-1 rounded transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Plugin</span>
                </button>
              </div>

              <datalist id="category-suggestions">
                {COMMON_CATEGORIES.map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="bg-neutral-900 border border-neutral-800 rounded-lg p-3.5 flex flex-col gap-2.5 relative group"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-neutral-800/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-neutral-800 text-neutral-300 font-mono text-[11px] font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-xs font-medium text-neutral-400">Slot {index + 1}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                          className="p-1 rounded text-neutral-500 hover:text-white disabled:opacity-30 hover:bg-neutral-800 transition-colors"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === items.length - 1}
                          className="p-1 rounded text-neutral-500 hover:text-white disabled:opacity-30 hover:bg-neutral-800 transition-colors"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-neutral-800 transition-colors ml-1"
                            title="Remove plugin"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-0.5">Plugin Name *</label>
                        <input
                          type="text"
                          value={item.plugin_name}
                          onChange={e => handleItemChange(index, 'plugin_name', e.target.value)}
                          placeholder="e.g. Pro-Q 3, CLA-76"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-0.5">Vendor (Optional)</label>
                        <input
                          type="text"
                          value={item.vendor || ''}
                          onChange={e => handleItemChange(index, 'vendor', e.target.value)}
                          placeholder="e.g. FabFilter, Waves"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-0.5">Category / Slot</label>
                        <input
                          type="text"
                          list="category-suggestions"
                          value={item.category || ''}
                          onChange={e => handleItemChange(index, 'category', e.target.value)}
                          placeholder="e.g. EQ, Compressor"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-neutral-400 mb-0.5">Notes & Settings (Free text)</label>
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={e => handleItemChange(index, 'notes', e.target.value)}
                        placeholder="e.g. HPF at 80Hz, 4:1 ratio, fast attack, 3dB gain reduction"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
              <span className="text-[11px] text-neutral-500">
                DAW plugin support coming later — export/import schema ready.
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim() || !daw.trim()}
                  className="bg-white hover:bg-neutral-200 disabled:opacity-50 text-black font-semibold text-xs px-4 py-2 rounded transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{chainToEdit ? 'Save Changes' : 'Create Chain'}</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
