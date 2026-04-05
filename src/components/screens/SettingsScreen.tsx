import React from 'react';
import { motion } from 'motion/react';
import { Settings, RefreshCw, Trash2, Copy, Check, Info } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { APP_VERSION } from '../../constants';

export const SettingsScreen: React.FC = () => {
  const store = useGameStore();
  const [copied, setCopied] = React.useState(false);

  const handleCheckUpdates = () => {
    // Force a hard reload to trigger PWA check
    // @ts-ignore
    window.location.reload(true);
  };

  const handleHardReset = () => {
    const confirmed = window.confirm("Are you sure? This will sacrifice all your progress to the Void (Forever).");
    if (confirmed) {
      localStorage.clear();
      // IndexedDB is handled by localforage in the store, but clearing it manually is safer
      // @ts-ignore
      if (window.indexedDB) {
        window.indexedDB.deleteDatabase('aerthos-save');
      }
      window.location.reload();
    }
  };

  const handleCopySave = () => {
    const state = useGameStore.getState();
    const saveString = btoa(JSON.stringify(state));
    navigator.clipboard.writeText(saveString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="h-full w-full flex flex-col gap-6 p-4 max-w-2xl mx-auto overflow-y-auto no-scrollbar"
    >
      {/* Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-16 h-16 rounded-full bg-luminary/10 flex items-center justify-center border border-luminary/30 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
          <Settings className="w-8 h-8 text-luminary" />
        </div>
        <h1 className="text-3xl font-runic font-bold text-luminary tracking-[0.3em] uppercase">Archive & Configuration</h1>
        <p className="text-[10px] text-white/30 uppercase tracking-[0.5em]">System Core Interface</p>
      </div>

      {/* Info Section */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <Info className="w-5 h-5 text-luminary" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/70">System Information</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-white/30 uppercase tracking-widest">Current Version</span>
            <span className="text-sm font-runic text-luminary">v{APP_VERSION}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-white/30 uppercase tracking-widest">Environment</span>
            <span className="text-sm font-runic text-white/70">Production</span>
          </div>
        </div>

        <button
          onClick={handleCheckUpdates}
          className="mt-2 w-full py-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all group"
        >
          <RefreshCw className="w-4 h-4 text-luminary group-hover:rotate-180 transition-transform duration-500" />
          <span className="text-xs font-bold uppercase tracking-widest">Check for Updates</span>
        </button>
      </div>

      {/* Save Management */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <Copy className="w-5 h-5 text-shadow-magic" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/70">Persistence Management</h2>
        </div>

        <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
          Export your soul-chain signature to transfer progress between rifts or for archival purposes.
        </p>

        <button
          onClick={handleCopySave}
          className="w-full py-3 bg-shadow-magic/20 border border-shadow-magic/30 rounded-xl flex items-center justify-center gap-3 hover:bg-shadow-magic/30 transition-all"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-shadow-magic" />}
          <span className="text-xs font-bold uppercase tracking-widest">{copied ? 'Copied to Soul-Chain' : 'Copy Save String'}</span>
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-950/10 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6 flex flex-col gap-4 mt-auto">
        <div className="flex items-center gap-3 border-b border-red-500/10 pb-4">
          <Trash2 className="w-5 h-5 text-red-500" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-red-500/70">Danger Zone</h2>
        </div>

        <p className="text-[10px] text-red-500/40 uppercase tracking-widest leading-relaxed italic">
          Warning: This action is irreversible. All Paragons, Gold, and Shards will be consumed by the Void.
        </p>

        <button
          onClick={handleHardReset}
          className="w-full py-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center gap-3 hover:bg-red-500/20 transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-red-500">Hard Reset</span>
        </button>
      </div>

      <div className="text-center pb-4">
        <p className="text-[9px] text-white/10 uppercase tracking-[0.8em]">Aerthos Endless Engine v{APP_VERSION}</p>
      </div>
    </motion.div>
  );
};
