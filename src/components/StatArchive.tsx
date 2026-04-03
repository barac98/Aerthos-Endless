import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { PermanentStatId } from '../types';
import { STAT_METADATA } from '../constants';
import { useGameStore } from '../store/useGameStore';
import { Shield } from 'lucide-react';

export const StatArchive: React.FC<{ upgrades: Record<PermanentStatId, number>, onClose: () => void }> = ({ upgrades, onClose }) => {
  const store = useGameStore();
  const sortedStats = (Object.keys(STAT_METADATA) as PermanentStatId[]).sort((a, b) => 
    STAT_METADATA[a].name.localeCompare(STAT_METADATA[b].name)
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-obsidian border border-white/10 rounded-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/50">
          <div>
            <h2 className="text-xl font-bold text-luminary tracking-widest uppercase">Runic Record</h2>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Archive of Permanent Ascension</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {/* General Stats */}
          <div className="p-4 rounded-xl border bg-luminary/5 border-luminary/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-luminary/10 rounded-lg">
                <Shield className="w-6 h-6 text-luminary" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">Boss Shards</h3>
                <p className="text-[10px] text-white/50 uppercase tracking-widest">Total Shards from Boss Defeats</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-runic font-bold text-luminary">
                {store.totalBossShardsCollected}
              </p>
            </div>
          </div>

          <div className="h-px bg-white/10 my-2" />

          {sortedStats.map(id => {
            const level = upgrades[id];
            const meta = STAT_METADATA[id];
            const isDiscovered = level > 0;

            return (
              <div 
                key={id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  isDiscovered ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5 opacity-40'
                }`}
              >
                <div className={`p-2 rounded-lg ${isDiscovered ? 'bg-white/5' : 'bg-transparent'}`}>
                  {React.cloneElement(meta.icon as React.ReactElement, { size: 24, className: isDiscovered ? '' : 'text-white/20' })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${isDiscovered ? 'text-white' : 'text-white/30'}`}>
                      {meta.name}
                    </h3>
                    <span className="text-[10px] font-runic text-luminary">LVL {level}</span>
                  </div>
                  <p className={`text-[10px] ${isDiscovered ? 'text-white/50' : 'text-white/20 italic'}`}>
                    {isDiscovered ? meta.description : 'Undiscovered Rune'}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold ${isDiscovered ? 'text-luminary' : 'text-white/10'}`}>
                    {meta.bonusText(level)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-black/50 border-t border-white/10 text-center">
          <p className="text-[8px] text-white/30 uppercase tracking-widest">The Record persists through all Sundering</p>
        </div>
      </motion.div>
    </motion.div>
  );
};
