import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { PermanentStatId } from '../../types';
import { STAT_METADATA } from '../../constants';
import { useHoldPress } from '../../hooks/useHoldPress';

interface AltarScreenProps {
  setShowArchive: (show: boolean) => void;
}

export const AltarScreen: React.FC<AltarScreenProps> = ({ setShowArchive }) => {
  const store = useGameStore();

  return (
    <motion.div 
      key="altar"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto flex flex-col items-center gap-12 pt-12"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold text-shadow-magic mb-4 tracking-widest uppercase">Runic Altar</h2>
        <p className="text-white/60 italic mb-2">"Sunder your progress to claim the Essence of the Tower."</p>
        <div className="text-[10px] text-luminary uppercase tracking-widest">Total Sundering Resets: {store.totalResets}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {store.altarSlots.map((statId, index) => (
          <AltarSlot 
            key={`${statId}-${index}`}
            statId={statId}
            level={store.permanentUpgrades[statId]}
            onUpgrade={() => store.purchaseAltarUpgrade(index)}
            essence={store.essence}
            totalLevels={Object.values(store.permanentUpgrades).reduce((a, b) => a + b, 0)}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-4">
        <button 
          onClick={() => store.performSunder()}
          className="px-12 py-4 bg-shadow-magic text-white font-bold rounded-full hover:scale-105 transition-transform glow-purple uppercase tracking-[0.2em]"
        >
          Perform Sundering Reset
          <span className="block text-[10px] font-normal opacity-70 mt-1">
            Gain {Math.floor(store.currentFloor / 10 * (1 + store.permanentUpgrades.essenceGain * 0.1))} Essence
          </span>
        </button>

        <button 
          onClick={() => setShowArchive(true)}
          className="text-xs text-luminary/50 hover:text-luminary uppercase tracking-widest border-b border-luminary/20 pb-1 transition-colors"
        >
          View Runic Record
        </button>
      </div>
    </motion.div>
  );
};

const AltarSlot: React.FC<{ statId: PermanentStatId, level: number, onUpgrade: () => void, essence: number, totalLevels: number }> = ({ statId, level, onUpgrade, essence, totalLevels }) => {
  const metadata = STAT_METADATA[statId];
  const cost = Math.floor(5 * Math.pow(1.5, totalLevels));
  const canAfford = essence >= cost;
  const handlers = useHoldPress(onUpgrade);

  return (
    <motion.button 
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...handlers}
      disabled={!canAfford}
      className={`relative p-6 obsidian-border rounded-xl bg-black/40 flex flex-col items-center gap-4 w-full group overflow-hidden transition-all ${
        canAfford ? 'hover:bg-white/5' : 'opacity-70 grayscale'
      }`}
    >
      {/* Shimmer Effect */}
      <motion.div 
        key={statId}
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-luminary/10 to-transparent pointer-events-none"
      />

      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="p-3 rounded-full bg-white/5 border border-white/10 group-hover:border-luminary/50 transition-colors">
          {metadata.icon}
        </div>
        
        <div className="text-center">
          <h3 className="text-sm font-bold uppercase tracking-widest text-luminary">{metadata.name}</h3>
          <p className="text-[10px] text-white/40 uppercase mt-0.5">Level {level}</p>
        </div>

        <div className="text-center py-2 px-4 bg-white/5 rounded-lg border border-white/5">
          <p className="text-xs font-bold text-white/90">{metadata.bonusText(level)}</p>
          <p className="text-[8px] text-white/30 uppercase mt-1 leading-tight">{metadata.description}</p>
        </div>

        <div className={`mt-2 flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${
          canAfford ? 'border-shadow-magic text-shadow-magic bg-shadow-magic/10' : 'border-white/10 text-white/20'
        }`}>
          <Sparkles className="w-3 h-3" />
          {cost.toLocaleString()} Essence
        </div>
      </div>

      {/* Runic Accents */}
      <div className="absolute top-2 left-2 text-[8px] text-luminary/20 font-runic">᚛</div>
      <div className="absolute top-2 right-2 text-[8px] text-luminary/20 font-runic">᚜</div>
      <div className="absolute bottom-2 left-2 text-[8px] text-luminary/20 font-runic">ᚙ</div>
      <div className="absolute bottom-2 right-2 text-[8px] text-luminary/20 font-runic">ᚚ</div>
    </motion.button>
  );
};
