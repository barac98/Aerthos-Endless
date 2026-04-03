import React from 'react';
import { motion } from 'motion/react';
import { useGameStore } from '../../store/useGameStore';
import { Card } from '../Card';
import { INITIAL_PARAGONS } from '../../types';
import { BIOMES } from '../../constants';

interface TeamScreenProps {
  paragonMp: Record<string, number>;
}

export const TeamScreen: React.FC<TeamScreenProps> = ({ paragonMp }) => {
  const store = useGameStore();
  const biomeIndex = Math.min(Math.floor((store.currentFloor - 1) / 50), BIOMES.length - 1);
  const currentBiome = BIOMES[biomeIndex];

  const unlockedParagons = React.useMemo(() => {
    const owned = store.ownedParagons;
    return [...INITIAL_PARAGONS]
      .filter(p => owned.some(op => op.id === p.id))
      .sort((a, b) => {
        const opA = owned.find(o => o.id === a.id);
        const opB = owned.find(o => o.id === b.id);
        return (opB?.level || 0) - (opA?.level || 0); // Sort by level descending
      });
  }, [store.ownedParagons]);

  return (
    <motion.div 
      key="team"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-8 justify-items-center content-start"
    >
      {unlockedParagons.map(p => {
        const ownedData = store.ownedParagons.find(op => op.id === p.id);
        return (
          <Card 
            key={p.id} 
            paragon={p} 
            isActive={store.activeTeam.includes(p.id)}
            mp={paragonMp[p.id] || 0}
            level={ownedData?.level}
            xp={ownedData?.xp}
            nextLevelXp={ownedData?.nextLevelXp}
            biomeColor={currentBiome.color}
            onToggle={() => {
              const slotIndex = store.activeTeam.indexOf(p.id);
              if (slotIndex !== -1) {
                store.updateActiveTeam(slotIndex, null);
              } else {
                const emptySlot = store.activeTeam.indexOf(null);
                if (emptySlot !== -1) {
                  store.updateActiveTeam(emptySlot, p.id);
                }
              }
            }}
          />
        );
      })}
    </motion.div>
  );
};
