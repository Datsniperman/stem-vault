'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sliders,
  Search,
  Plus,
  Upload,
  Calendar,
  User,
  Info,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { PluginChain } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { CreatePluginChainModal } from '@/components/CreatePluginChainModal';
import { ImportPluginChainModal } from '@/components/ImportPluginChainModal';
import { Header } from '@/components/Header';
import { FluidOrb } from '@/components/ui/fluid-orb';
import { AnimatedCounter } from '@/components/ui/animated-counter';

const COMMON_DAWS = [
  'All DAWs',
  'Logic Pro',
  'Pro Tools',
  'Ableton Live',
  'FL Studio',
  'Studio One',
  'Reaper',
  'Cubase',
];

export default function PluginChainsPage() {
  const { user } = useAuth();
  const [chains, setChains] = useState<PluginChain[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDaw, setSelectedDaw] = useState('All DAWs');
  const [pluginFilter, setPluginFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const fetchChains = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (selectedDaw !== 'All DAWs') params.set('daw', selectedDaw);
      if (pluginFilter.trim()) params.set('plugin', pluginFilter.trim());

      const res = await fetch(`/api/plugin-chains?${params.toString()}`);
      const data = await res.json();
      setChains(data.chains || []);
    } catch (e) {
      console.warn('Error fetching chains:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChains();
  }, [search, selectedDaw, pluginFilter]);

  return (
    <div className="min-h-screen bg-[#0d0d0e] text-neutral-100 pb-24">
      <Header />

      {/* Rare UI Hero Canvas */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-6">
        <div className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#121215]/80 backdrop-blur-xl p-8 sm:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]">
          <div className="absolute -right-16 -top-16 opacity-25 blur-2xl pointer-events-none">
            <FluidOrb size={360} color="#302a35" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>SIGNAL PROCESSING BLUEPRINTS</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
                <Sliders className="w-8 h-8 text-neutral-300 shrink-0" />
                <span>Plugin Chains</span>
              </h1>

              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Save, import, and share structured audio signal chains. Order your EQ, compression, saturation, and spatial FX plugins with exact parameters and notes.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-3 text-xs font-mono">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-neutral-500">Chains:</span>
                  <AnimatedCounter value={chains.length} className="text-white font-semibold" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {user ? (
                <>
                  <button
                    onClick={() => setImportOpen(true)}
                    className="bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.1] font-semibold text-xs px-4 py-2.5 rounded-full transition-all flex items-center gap-2 backdrop-blur-xl"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import JSON</span>
                  </button>
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-5 py-2.5 rounded-full transition-all flex items-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Chain</span>
                  </button>
                </>
              ) : (
                <div className="text-xs text-neutral-400 bg-white/[0.04] border border-white/[0.08] px-4 py-2.5 rounded-full">
                  Connect Discord to build chains
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-8 space-y-6">
        {/* Search & DAW Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by chain name, track type (e.g. Lead Vocals)..."
              className="w-full bg-[#141416]/90 border border-white/[0.08] hover:border-white/[0.15] rounded-full pl-11 pr-10 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-all backdrop-blur-xl shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={selectedDaw}
              onChange={e => setSelectedDaw(e.target.value)}
              className="bg-[#141416]/90 border border-white/[0.08] rounded-full px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white/30 transition-all backdrop-blur-xl cursor-pointer"
            >
              {COMMON_DAWS.map(daw => (
                <option key={daw} value={daw} className="bg-neutral-900 text-white">
                  {daw}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chains Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div
                key={n}
                className="h-44 rounded-[22px] bg-white/[0.02] border border-white/[0.06] animate-pulse"
              />
            ))}
          </div>
        ) : chains.length === 0 ? (
          <div className="rounded-[28px] border border-white/[0.08] p-16 text-center bg-[#141416]/60 backdrop-blur-xl">
            <Sliders className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-neutral-200">No Chains Found</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
              {search
                ? 'Try adjusting your search criteria.'
                : 'Be the first to share an audio processing chain.'}
            </p>
            {user && (
              <button
                onClick={() => setCreateOpen(true)}
                className="mt-5 bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-4 py-2 rounded-full transition-all inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Chain</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chains.map(chain => {
              const pluginCount = chain.plugin_count || (chain.items?.length ?? 0);
              return (
                <Link
                  key={chain.id}
                  href={`/plugin-chains/${chain.id}`}
                  className="rare-card group p-5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-white group-hover:text-neutral-200 transition-colors line-clamp-1">
                          {chain.name}
                        </h3>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-neutral-300 border border-white/[0.08] shrink-0">
                        {chain.daw}
                      </span>
                    </div>

                    {chain.description && (
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                        {chain.description}
                      </p>
                    )}

                    {chain.items && chain.items.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {chain.items.slice(0, 4).map((p, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-neutral-300"
                          >
                            {p.plugin_name}
                          </span>
                        ))}
                        {chain.items.length > 4 && (
                          <span className="text-[10px] font-mono text-neutral-500">
                            +{chain.items.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-500 font-mono mt-4">
                    <div className="flex items-center gap-1.5 text-neutral-400 truncate max-w-[140px]">
                      <User className="w-3 h-3 text-neutral-500 shrink-0" />
                      <span className="truncate">{chain.owner_name || 'Member'}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-neutral-300 font-semibold">
                        {pluginCount} plugins
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-neutral-500" />
                        <span>{new Date(chain.created_at).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <CreatePluginChainModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => fetchChains()}
      />

      <ImportPluginChainModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => fetchChains()}
      />
    </div>
  );
}
