import React from 'react';
import { motion } from 'motion/react';
import { Shield } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { Card } from '../Card';
import { INITIAL_PARAGONS } from '../../types';
import { BIOMES } from '../../constants';

export const RecruitScreen: React.FC = () => {
  const store = useGameStore();
  const biomeIndex = Math.min(Math.floor((store.currentFloor - 1) / 50), BIOMES.length - 1);
  const currentBiome = BIOMES[biomeIndex];

  return (
    <motion.div 
      key="recruit"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-8 justify-items-center content-start"
    >
      {INITIAL_PARAGONS.filter(p => !store.ownedParagons.some(op => op.id === p.id)).map(p => {
        return (
          <motion.div 
            layout
            key={p.id} 
            className="flex flex-col items-center gap-2 sm:gap-4"
          >
            <Card paragon={p} isLocked={true} biomeColor={currentBiome.color} />
            <button 
              onClick={() => store.recruitParagon(p.id)}
              disabled={store.soulShards < p.shardCost}
              className={`px-3 py-1.5 sm:px-6 sm:py-2 rounded-full border transition-all flex items-center gap-1 sm:gap-2 ${
                store.soulShards >= p.shardCost 
                  ? 'border-luminary text-luminary hover:bg-luminary hover:text-obsidian glow-cyan' 
                  : 'border-white/20 text-white/20 cursor-not-allowed'
              }`}
            >
              <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-[8px] sm:text-xs">Recruit: {p.shardCost}</span>
            </button>
          </motion.div>
        );
      })}
    </motion.div>
  );
};
