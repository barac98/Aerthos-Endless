import React from 'react';
import { motion } from 'motion/react';
import { Sword, Zap, Shield } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

export const TrainingScreen: React.FC = () => {
  const store = useGameStore();

  return (
    <motion.div 
      key="training"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto flex flex-col items-center gap-6 pt-4"
    >
      <div className="text-center">
        <h2 className="text-xl font-bold text-luminary mb-1 tracking-widest uppercase">Battle Training</h2>
        <p className="text-[10px] text-white/60 italic mb-2">"Hone your skills for the current ascent. These gains are lost to the Sundering."</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        <div className="flex flex-col items-center gap-2 p-3 obsidian-border rounded-lg bg-white/5">
          <Sword className="w-6 h-6 text-red-500" />
          <div className="text-center">
            <h3 className="text-xs font-bold uppercase tracking-widest">Attack</h3>
            <p className="text-[9px] text-luminary uppercase">Level {store.temporalUpgrades.atk}</p>
          </div>
          <button 
            onClick={() => store.upgradeTemporal('atk')}
            disabled={store.gold < Math.floor(50 * Math.pow(1.3, store.temporalUpgrades.atk - 1))}
            className={`w-full py-1.5 rounded-md border text-[9px] font-bold uppercase tracking-widest transition-all ${
              store.gold >= Math.floor(50 * Math.pow(1.3, store.temporalUpgrades.atk - 1))
                ? 'border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black glow-cyan' 
                : 'border-white/10 text-white/20 cursor-not-allowed'
            }`}
          >
            Train: {Math.floor(50 * Math.pow(1.3, store.temporalUpgrades.atk - 1)).toLocaleString()} Gold
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 p-3 obsidian-border rounded-lg bg-white/5">
          <Zap className="w-6 h-6 text-luminary" />
          <div className="text-center">
            <h3 className="text-xs font-bold uppercase tracking-widest">Speed</h3>
            <p className="text-[9px] text-luminary uppercase">Level {store.temporalUpgrades.speed}</p>
          </div>
          <button 
            onClick={() => store.upgradeTemporal('speed')}
            disabled={store.gold < Math.floor(50 * Math.pow(1.3, store.temporalUpgrades.speed - 1))}
            className={`w-full py-1.5 rounded-md border text-[9px] font-bold uppercase tracking-widest transition-all ${
              store.gold >= Math.floor(50 * Math.pow(1.3, store.temporalUpgrades.speed - 1))
                ? 'border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black glow-cyan' 
                : 'border-white/10 text-white/20 cursor-not-allowed'
            }`}
          >
            Train: {Math.floor(50 * Math.pow(1.3, store.temporalUpgrades.speed - 1)).toLocaleString()} Gold
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 p-3 obsidian-border rounded-lg bg-white/5">
          <Shield className="w-6 h-6 text-blue-500" />
          <div className="text-center">
            <h3 className="text-xs font-bold uppercase tracking-widest">Crit</h3>
            <p className="text-[9px] text-luminary uppercase">Level {store.temporalUpgrades.crit}</p>
          </div>
          <button 
            onClick={() => store.upgradeTemporal('crit')}
            disabled={store.gold < Math.floor(50 * Math.pow(1.3, store.temporalUpgrades.crit - 1))}
            className={`w-full py-1.5 rounded-md border text-[9px] font-bold uppercase tracking-widest transition-all ${
              store.gold >= Math.floor(50 * Math.pow(1.3, store.temporalUpgrades.crit - 1))
                ? 'border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black glow-cyan' 
                : 'border-white/10 text-white/20 cursor-not-allowed'
            }`}
          >
            Train: {Math.floor(50 * Math.pow(1.3, store.temporalUpgrades.crit - 1)).toLocaleString()} Gold
          </button>
        </div>
      </div>
    </motion.div>
  );
};
