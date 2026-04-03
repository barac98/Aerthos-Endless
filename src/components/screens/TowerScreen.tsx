import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Shield, Sparkles, Coins } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { Card } from '../Card';
import { INITIAL_PARAGONS } from '../../types';
import { BIOMES } from '../../constants';

interface TowerScreenProps {
  enemyHp: number;
  maxEnemyHp: number;
  totalDps: number;
  lastHitTime: number;
  lastAttackTimes: Record<string, number>;
  damageNumbers: { id: number; value: number; color: string; isCrit?: boolean }[];
  enemyImageUrl: string;
  paragonMp: Record<string, number>;
  activeAbilities: { id: number; name: string; color: string }[];
  floorTimer: number;
  screenEffect: { type: 'flash' | 'shake'; color: string } | null;
}

export const TowerScreen: React.FC<TowerScreenProps> = ({
  enemyHp,
  maxEnemyHp,
  totalDps,
  lastHitTime,
  lastAttackTimes,
  damageNumbers,
  enemyImageUrl,
  paragonMp,
  activeAbilities,
  floorTimer,
  screenEffect,
}) => {
  const store = useGameStore();
  const biomeIndex = Math.min(Math.floor((store.currentFloor - 1) / 50), BIOMES.length - 1);
  const currentBiome = BIOMES[biomeIndex];

  const activeParagons = React.useMemo(() => 
    INITIAL_PARAGONS.filter(p => store.activeTeam.includes(p.id)),
    [store.activeTeam]
  );

  const [rewardPopups, setRewardPopups] = React.useState<{ id: number; gold: number; xp: number; shards: number }[]>([]);

  // Track rewards
  React.useEffect(() => {
    if (store.lastEnemyRewards) {
      const newReward = {
        id: store.lastEnemyRewards.timestamp,
        gold: store.lastEnemyRewards.gold,
        xp: store.lastEnemyRewards.xp,
        shards: store.lastEnemyRewards.shards
      };
      setRewardPopups(prev => [...prev.slice(-5), newReward]);
      const timer = setTimeout(() => {
        setRewardPopups(prev => prev.filter(r => r.id !== newReward.id));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [store.lastEnemyRewards?.timestamp]);

  // Clear boss drop flag after animation
  React.useEffect(() => {
    if (store.bossDropSuccess !== null) {
      const timer = setTimeout(() => {
        store.resetBossDropFlag();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [store.bossDropSuccess]);

  return (
    <motion.div 
      key="tower"
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        x: screenEffect?.type === 'shake' ? [0, -10, 10, -10, 10, 0] : 0
      }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col items-center justify-center gap-4 sm:gap-6 relative transition-[background-image] duration-[2000ms] ease-in-out"
      style={{ 
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url(${currentBiome.url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#0a0a0a'
      }}
    >
      {/* Screen Flash Effect */}
      <AnimatePresence>
        {screenEffect?.type === 'shake' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-[100]"
            style={{ backgroundColor: screenEffect.color }}
          />
        )}
      </AnimatePresence>

      {/* Boss Victory Banner */}
      <AnimatePresence>
        {store.bossDropSuccess !== null && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.5, y: -100 }}
            className="fixed top-1/4 left-1/2 -translate-x-1/2 z-[150] flex flex-col items-center pointer-events-none"
          >
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [-2, 2, -2]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="bg-black/80 backdrop-blur-xl border-2 border-luminary/50 px-8 py-4 rounded-2xl shadow-[0_0_50px_rgba(0,255,255,0.3)] flex flex-col items-center gap-2"
            >
              <h3 className="text-2xl font-runic font-bold text-luminary tracking-[0.2em] animate-pulse">VICTORY</h3>
              
              {store.bossDropSuccess ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8 text-shadow-magic drop-shadow-[0_0_10px_#8A2BE2]" />
                    <span className="text-3xl font-runic font-bold text-shadow-magic">+{store.lastBossShardReward} SHARDS!</span>
                  </div>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest">The Tower yields its essence</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <p className="text-sm font-bold text-white/70 uppercase tracking-widest">THE SHADOWS REMAIN SILENT</p>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest italic">Better luck next time</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floor Timer & Navigation */}
      <div className="w-full flex flex-col items-center gap-1 sm:gap-2 mb-1 sm:mb-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => store.descendFloor()}
            disabled={store.currentFloor <= 1}
            className={`p-2 rounded-lg border flex items-center gap-2 transition-all ${
              store.currentFloor > 1 
                ? 'border-white/20 text-white/80 hover:border-luminary hover:text-luminary bg-white/5' 
                : 'border-white/5 text-white/10 cursor-not-allowed bg-transparent'
            }`}
            title="Previous Floor"
          >
            <Sword className="w-4 h-4 rotate-180" />
            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">PREV</span>
          </button>

          <div className="flex flex-col items-center min-w-[100px]">
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">Floor {store.currentFloor}</div>
            <div className="text-[8px] uppercase tracking-[0.2em] text-luminary/60 mb-1 font-bold">{currentBiome.name}</div>
            <div className={`text-3xl font-runic font-bold ${floorTimer < 10 ? 'text-red-500 animate-pulse' : 'text-luminary'}`}>
              {floorTimer.toFixed(1)}s
            </div>
          </div>

          <button 
            onClick={() => store.climbFloor()}
            disabled={store.currentFloor >= store.highestFloor}
            className={`p-2 rounded-lg border flex items-center gap-2 transition-all ${
              store.currentFloor < store.highestFloor 
                ? 'border-white/20 text-white/80 hover:border-luminary hover:text-luminary bg-white/5' 
                : 'border-white/5 text-white/10 cursor-not-allowed bg-transparent'
            }`}
            title="Next Floor"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">NEXT</span>
            <Sword className="w-4 h-4" />
          </button>
        </div>

        <button 
          onClick={() => store.toggleAutoProgress()}
          className={`px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg ${
            store.autoProgress 
              ? 'border-luminary text-luminary bg-luminary/20 glow-cyan' 
              : 'border-white/20 text-white/60 bg-white/5 hover:border-white/40'
          }`}
        >
          Auto-Advance: {store.autoProgress ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Game Speed Toggle */}
      <div className="absolute top-0 right-0 p-2">
        <button
          onClick={() => {
            const nextSpeed = store.gameSpeed === 1 ? 2 : store.gameSpeed === 2 ? 4 : 1;
            store.setGameSpeed(nextSpeed);
          }}
          className="px-4 py-1 bg-black/40 rounded-lg border border-white/10 text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-white/10 active:scale-95 shadow-[0_0_15px_rgba(0,255,255,0.1)]"
        >
          <span className="text-luminary">x{store.gameSpeed}</span>
        </button>
      </div>

      {/* Enemy Section */}
      <div className="relative flex flex-col items-center w-full max-w-md scale-95 sm:scale-100">
        <div className="w-48 h-48 sm:w-56 sm:h-56 relative mb-2">
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
            className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_30px_rgba(138,43,226,0.5)] enemy-image"
            referrerPolicy="no-referrer"
          />
          
          {/* Floating Damage Numbers & Ability Names */}
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

              {activeAbilities.map((ability) => (
                <motion.div
                  key={ability.id}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: -60, scale: 1.2 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  className="absolute whitespace-nowrap font-bold tracking-[0.3em] text-lg sm:text-2xl italic"
                  style={{ 
                    color: ability.color,
                    textShadow: `0 0 20px ${ability.color}`
                  }}
                >
                  {ability.name}
                </motion.div>
              ))}

              {rewardPopups.map((reward) => (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 0, scale: 0.8 }}
                  animate={{ opacity: 1, y: -100 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  className="absolute flex flex-col items-center gap-1 pointer-events-none"
                >
                  <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm drop-shadow-md">
                    <Coins className="w-3 h-3" />
                    <span>+{reward.gold}</span>
                  </div>
                  <div className="flex items-center gap-1 text-luminary font-bold text-xs drop-shadow-md">
                    <Sparkles className="w-3 h-3" />
                    <span>+{reward.xp} XP</span>
                  </div>
                  {reward.shards > 0 && (
                    <div className="flex items-center gap-1 text-shadow-magic font-bold text-sm drop-shadow-md animate-bounce">
                      <Shield className="w-3 h-3" />
                      <span>+{reward.shards} SHARDS</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        
        <div className="w-full max-w-[240px] sm:max-w-[280px] h-2.5 sm:h-3 bg-white/5 rounded-full overflow-hidden obsidian-border">
          <motion.div 
            className="h-full bg-gradient-to-r from-shadow-magic to-red-600"
            initial={{ width: '100%' }}
            animate={{ width: `${(enemyHp / maxEnemyHp) * 100}%` }}
          />
        </div>
        <p className="text-[9px] sm:text-[10px] font-runic mt-1 text-white/50">
          {Math.ceil(enemyHp).toLocaleString()} / {maxEnemyHp.toLocaleString()} HP
        </p>
        <div className="mt-2 flex items-center gap-2 px-3 py-0.5 bg-white/5 rounded-full border border-white/10">
          <Sword className="w-2.5 h-2.5 text-red-500" />
          <span className="text-[8px] sm:text-[9px] font-runic text-white/70 uppercase tracking-widest">
            DPS: <span className="text-white font-bold">{Math.floor(totalDps).toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* Team HUD */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-3 max-h-[35vh] overflow-y-auto no-scrollbar p-1">
        {activeParagons.map(p => {
          const ownedData = store.ownedParagons.find(op => op.id === p.id);
          return (
            <div key={p.id} className="flex flex-col items-center gap-1 sm:gap-1 scale-100 sm:scale-100">
              <motion.div 
                key={p.id}
              >
                <Card 
                  paragon={p} 
                  variant="small" 
                  isActive={true}
                  lastHitTime={lastAttackTimes[p.id]}
                  mp={paragonMp[p.id] || 0}
                  level={ownedData?.level}
                  xp={ownedData?.xp}
                  nextLevelXp={ownedData?.nextLevelXp}
                  biomeColor={currentBiome.color}
                />
              </motion.div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full glow-cyan" style={{ backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}` }} />
                <span className="text-[8px] sm:text-[10px] uppercase tracking-widest font-bold" style={{ color: p.color }}>{p.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
