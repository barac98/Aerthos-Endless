import React from 'react';
import { motion } from 'motion/react';
import { Shield } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { Card } from '../Card';
import { INITIAL_PARAGONS } from '../../types';

export const RecruitScreen: React.FC = () => {
  const store = useGameStore();

  return (
    <motion.div 
      key="recruit"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center"
    >
      {INITIAL_PARAGONS.map(p => {
        const isUnlocked = store.ownedParagons.some(op => op.id === p.id);
        return (
          <div key={p.id} className="flex flex-col items-center gap-4">
            <Card paragon={p} isLocked={!isUnlocked} />
            {!isUnlocked && (
              <button 
                onClick={() => store.recruitParagon(p.id)}
                disabled={store.soulShards < p.shardCost}
                className={`px-6 py-2 rounded-full border transition-all flex items-center gap-2 ${
                  store.soulShards >= p.shardCost 
                    ? 'border-luminary text-luminary hover:bg-luminary hover:text-obsidian glow-cyan' 
                    : 'border-white/20 text-white/20 cursor-not-allowed'
                }`}
              >
                <Shield className="w-4 h-4" />
                Recruit: {p.shardCost.toLocaleString()} Shards
              </button>
            )}
          </div>
        );
      })}
    </motion.div>
  );
};
