import React from 'react';
import { motion } from 'motion/react';
import { useGameStore } from '../../store/useGameStore';
import { Card } from '../Card';
import { INITIAL_PARAGONS } from '../../types';

export const TeamScreen: React.FC = () => {
  const store = useGameStore();

  const unlockedParagons = React.useMemo(() => 
    INITIAL_PARAGONS.filter(p => store.ownedParagons.some(op => op.id === p.id)),
    [store.ownedParagons]
  );

  return (
    <motion.div 
      key="team"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center"
    >
      {unlockedParagons.map(p => (
        <Card 
          key={p.id} 
          paragon={p} 
          isActive={store.activeTeam.includes(p.id)}
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
      ))}
    </motion.div>
  );
};
