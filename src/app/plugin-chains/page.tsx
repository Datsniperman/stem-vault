'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sliders, Search, Plus, Upload, Filter, Calendar, User, Info, ArrowRight } from 'lucide-react';
import { PluginChain } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { CreatePluginChainModal } from '@/components/CreatePluginChainModal';
import { ImportPluginChainModal } from '@/components/ImportPluginChainModal';

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
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 pb-20">
      {/* Hero Header */}
      <div className="border-b border-neutral-800 bg-neutral-950/60 backdrop-blur-sm py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>THE MIXING VAULT / SIGNAL CHAINS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Sliders className="w-7 h-7 text-neutral-300" />
              <span>Plugin Chains</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
              Save and discover structured audio processing chains. Order EQ, dynamics, and time-based plugins with custom settings notes.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {user ? (
              <>
                <button
                  onClick={() => setImportOpen(true)}
                  className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white font-medium text-xs px-3.5 py-2.5 rounded transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import JSON</span>
                </button>
                <button
                  onClick={() => setCreateOpen(true)}
                  className="bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-4 py-2.5 rounded transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Chain</span>
                </button>
              </>
            ) : (
              <p className="text-xs text-neutral-500 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded">
                Log in to create or import chains
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* DAW Integration Notice Banner */}
        <div className="mb-6 p-3.5 bg-neutral-900/80 border border-neutral-800 rounded-lg flex items-start gap-3 text-xs text-neutral-400">
          <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-neutral-200 font-medium">DAW plugin support coming later — export/import schema ready.</span>
            <p className="text-neutral-400 mt-0.5">
              Signal chains can be imported and exported as standardized JSON matching our <code className="text-neutral-300">PLUGIN-CHAIN-SCHEMA.md</code> v1 specification. Native VST3/AU DAW plugin synchronizer is scheduled for the next release.
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-1">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search chains by title..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div className="relative w-full sm:w-48">
              <input
                type="text"
                value={pluginFilter}
                onChange={e => setPluginFilter(e.target.value)}
                placeholder="Filter by plugin name..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div className="w-full sm:w-40">
              <select
                value={selectedDaw}
                onChange={e => setSelectedDaw(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-500"
              >
                {COMMON_DAWS.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <span className="text-xs text-neutral-500 font-mono self-end md:self-auto">
            {chains.length} {chains.length === 1 ? 'chain' : 'chains'}
          </span>
        </div>

        {/* Chains Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-44 bg-neutral-900/40 border border-neutral-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : chains.length === 0 ? (
          <div className="border border-neutral-800 rounded-lg p-12 text-center bg-neutral-950/40">
            <Sliders className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-neutral-300">No Plugin Chains Found</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
              {search || pluginFilter || selectedDaw !== 'All DAWs'
                ? 'Try clearing or relaxing your search filters.'
                : 'Be the first to create and share a signal chain!'}
            </p>
            {user && (
              <button
                onClick={() => setCreateOpen(true)}
                className="mt-4 bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-3.5 py-1.5 rounded transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Chain</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chains.map((chain: PluginChain) => (
              <Link
                key={chain.id}
                href={`/plugin-chains/${chain.id}`}
                className="bg-[#121212] hover:bg-[#161616] border border-neutral-800 hover:border-neutral-700 rounded-lg p-4 transition-all flex flex-col justify-between group shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-white group-hover:text-neutral-200 transition-colors line-clamp-1">
                      {chain.name}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 shrink-0">
                      {chain.daw}
                    </span>
                  </div>

                  {chain.description && (
                    <p className="text-xs text-neutral-400 line-clamp-2 mb-3">
                      {chain.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500 font-mono mt-2">
                  <div className="flex items-center gap-1 text-neutral-400 truncate max-w-[140px]">
                    <User className="w-3 h-3 text-neutral-500 shrink-0" />
                    <span className="truncate">{chain.owner_name || 'Member'}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-neutral-300 font-semibold">
                      {chain.plugin_count || 0} plugins
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-neutral-500" />
                      <span>{new Date(chain.created_at).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreatePluginChainModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={fetchChains}
      />
      <ImportPluginChainModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={fetchChains}
      />
    </div>
  );
}
