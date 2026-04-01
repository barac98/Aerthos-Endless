import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { Card } from '../Card';
import { INITIAL_PARAGONS } from '../../types';

interface TowerScreenProps {
  enemyHp: number;
  maxEnemyHp: number;
  totalDps: number;
  lastHitTime: number;
  lastAttackTimes: Record<string, number>;
  damageNumbers: { id: number; value: number; color: string; isCrit?: boolean }[];
  enemyImageUrl: string;
}

export const TowerScreen: React.FC<TowerScreenProps> = ({
  enemyHp,
  maxEnemyHp,
  totalDps,
  lastHitTime,
  lastAttackTimes,
  damageNumbers,
  enemyImageUrl,
}) => {
  const store = useGameStore();

  const unlockedParagons = React.useMemo(() => 
    INITIAL_PARAGONS.filter(p => store.ownedParagons.some(op => op.id === p.id)),
    [store.ownedParagons]
  );

  return (
    <motion.div 
      key="tower"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col items-center justify-center gap-6"
    >
      {/* Game Speed Toggle */}
      <div className="flex items-center gap-2 p-1 bg-black/40 rounded-lg border border-white/5">
        {[1, 2, 4].map(speed => (
          <button
            key={speed}
            onClick={() => store.setGameSpeed(speed)}
            className={`px-4 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
              store.gameSpeed === speed 
                ? 'bg-luminary text-black shadow-[0_0_15px_rgba(0,255,255,0.3)]' 
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            x{speed}
          </button>
        ))}
      </div>

      {/* Enemy Section */}
      <div className="relative flex flex-col items-center w-full max-w-md">
        <div className="w-48 h-48 sm:w-64 sm:h-64 relative mb-4">
          <div className="absolute inset-0 bg-shadow-magic/20 blur-3xl rounded-full animate-pulse" />
          <motion.img 
            key={`enemy-${store.currentFloor}`}
            initial={{ x: 0, filter: 'brightness(1)' }}
            animate={lastHitTime ? { 
              x: [0, -5, 5, -5, 5, 0],
              filter: ['brightness(1)', 'brightness(2) contrast(1.5)', 'brightness(1)']
            } : {}}
            transition={{ duration: 0.2 }}
            src={enemyImageUrl} 
            alt="Enemy"
            className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_30px_rgba(138,43,226,0.5)]"
            referrerPolicy="no-referrer"
          />
          
          {/* Floating Damage Numbers */}
          <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
            <AnimatePresence>
              {damageNumbers.map((dmg) => (
                <motion.span
                  key={dmg.id}
                  initial={{ opacity: 1, y: 0, scale: 0.5, x: (Math.random() - 0.5) * 40 }}
                  animate={{ opacity: 0, y: -120, scale: 1.5, x: (Math.random() - 0.5) * 80 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute text-xl sm:text-2xl font-bold font-runic"
                  style={{ 
                    color: dmg.color,
                    textShadow: `0 0 10px ${dmg.color}80, 0 0 20px ${dmg.color}40`
                  }}
                >
                  {dmg.isCrit && <span className="block text-[10px] uppercase tracking-tighter mb-[-4px]">Crit!</span>}
                  -{dmg.value}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
        
        <div className="w-full max-w-[280px] sm:max-w-xs h-3 sm:h-4 bg-white/5 rounded-full overflow-hidden obsidian-border">
          <motion.div 
            className="h-full bg-gradient-to-r from-shadow-magic to-red-600"
            initial={{ width: '100%' }}
            animate={{ width: `${(enemyHp / maxEnemyHp) * 100}%` }}
          />
        </div>
        <p className="text-[10px] sm:text-xs font-runic mt-2 text-white/50">
          {Math.ceil(enemyHp).toLocaleString()} / {maxEnemyHp.toLocaleString()} HP
        </p>
        <div className="mt-4 flex items-center gap-2 px-3 sm:px-4 py-1 bg-white/5 rounded-full border border-white/10">
          <Sword className="w-3 h-3 text-red-500" />
          <span className="text-[8px] sm:text-[10px] font-runic text-white/70 uppercase tracking-widest">
            DPS: <span className="text-white font-bold">{Math.floor(totalDps).toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* Team HUD */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-h-[30vh] overflow-y-auto no-scrollbar p-2">
        {unlockedParagons.map(p => (
          <div key={p.id} className="flex flex-col items-center gap-1 sm:gap-2">
            <motion.div 
              key={p.id}
            >
              <Card 
                paragon={p} 
                variant="small" 
                isActive={store.activeTeam.includes(p.id)}
                lastHitTime={lastAttackTimes[p.id]}
              />
            </motion.div>
            <div className="flex items-center gap-1">
              {store.activeTeam.includes(p.id) && <div className="w-1.5 h-1.5 rounded-full glow-cyan" style={{ backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}` }} />}
              <span className="text-[8px] sm:text-[10px] uppercase tracking-widest font-bold" style={{ color: p.color }}>{p.name}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
