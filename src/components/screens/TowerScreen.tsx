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
    store.activeTeam.map(id => id ? INITIAL_PARAGONS.find(p => p.id === id) : null),
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
      initial={{ opacity: 0, x: 100 }}
      animate={{ 
        opacity: 1, 
        x: screenEffect?.type === 'shake' ? [0, -10, 10, -10, 10, 0] : 0
      }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="h-full w-full relative flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Image - Covers entire viewport */}
      <div 
        className="absolute inset-0 z-0 transition-[background-image] duration-[2000ms] ease-in-out"
        style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url(${currentBiome.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#0a0a0a'
        }}
      />

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
              <h3 className="text-xl font-runic font-bold text-luminary tracking-[0.2em] animate-pulse">VICTORY</h3>
              
              {store.bossDropSuccess ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-shadow-magic drop-shadow-[0_0_10px_#8A2BE2]" />
                    <span className="text-2xl font-runic font-bold text-shadow-magic">+{store.lastBossShardReward} SHARDS!</span>
                  </div>
                  <p className="text-[8px] text-white/50 uppercase tracking-widest">The Tower yields its essence</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <p className="text-xs font-bold text-white/70 uppercase tracking-widest">THE SHADOWS REMAIN SILENT</p>
                  <p className="text-[8px] text-white/30 uppercase tracking-widest italic">Better luck next time</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="w-full h-full flex flex-col md:flex-row items-center justify-start md:justify-center p-2 md:p-4 gap-4 md:gap-8 relative z-10 pt-4 md:pt-0">
        
        {/* Team Section (Left on Desktop, Bottom on Mobile) */}
        <div className="w-full md:w-auto flex flex-col items-center md:items-start gap-1 md:gap-2 order-2 md:order-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[7px] md:text-[10px] font-bold text-luminary uppercase tracking-[0.3em] opacity-50">Active Team</h2>
            <div className="h-px w-6 md:w-10 bg-luminary/20" />
            <span className="text-[7px] md:text-[8px] text-white/30 uppercase tracking-widest">Soul Chain: +{((store.activeTeam.filter(id => id !== null).length - 1) * 10)}%</span>
          </div>
          
          <div className="flex flex-row gap-1.5 md:gap-3">
            {activeParagons.map((p, index) => {
              if (!p) {
                return (
                  <div key={`empty-${index}`} className="w-14 sm:w-18 md:w-24 aspect-[2/3] obsidian-border rounded-lg bg-black/20 flex items-center justify-center border-dashed border-white/10">
                    <span className="text-[5px] md:text-[7px] text-white/10 uppercase tracking-widest text-center px-1">Empty</span>
                  </div>
                );
              }
              const ownedData = store.ownedParagons.find(op => op.id === p.id);
              return (
                <div key={p.id} className="flex flex-col items-center gap-0.5 group">
                  <div className="relative">
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
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: p.color, color: p.color }} />
                    <span className="text-[5px] md:text-[7px] uppercase tracking-widest font-bold text-white/70 group-hover:text-white transition-colors">{p.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monster Section (Right on Desktop, Top on Mobile) */}
        <div className="w-full md:w-auto flex flex-col items-center gap-4 md:gap-6 order-1 md:order-2">
          {/* Floor Navigation - Now above monster */}
          <div className="flex flex-col items-center gap-1 md:gap-2 w-full max-w-xs">
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg p-1.5 md:p-2 shadow-2xl flex items-center justify-between w-full">
              <button 
                onClick={() => store.descendFloor()}
                disabled={store.currentFloor <= 1}
                className={`p-1 md:p-1.5 rounded-md border flex items-center gap-1 transition-all ${
                  store.currentFloor > 1 
                    ? 'border-white/20 text-white/80 hover:border-luminary hover:text-luminary bg-white/5' 
                    : 'border-white/5 text-white/10 cursor-not-allowed bg-transparent'
                }`}
              >
                <Sword className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 rotate-180" />
              </button>

              <div className="flex flex-col items-center">
                <div className="text-[6px] md:text-[8px] uppercase tracking-widest text-white/40">Floor {store.currentFloor}</div>
                <div className="text-[7px] md:text-[9px] uppercase tracking-[0.2em] text-luminary font-bold">{currentBiome.name}</div>
              </div>

              <button 
                onClick={() => store.climbFloor()}
                disabled={store.currentFloor >= store.highestFloor}
                className={`p-1 md:p-1.5 rounded-md border flex items-center gap-1 transition-all ${
                  store.currentFloor < store.highestFloor 
                    ? 'border-white/20 text-white/80 hover:border-luminary hover:text-luminary bg-white/5' 
                    : 'border-white/5 text-white/10 cursor-not-allowed bg-transparent'
                }`}
              >
                <Sword className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
              </button>
            </div>

            <button 
              onClick={() => store.toggleAutoProgress()}
              className={`w-full py-0.5 md:py-1 rounded-full border text-[6px] md:text-[8px] font-bold uppercase tracking-widest transition-all shadow-lg ${
                store.autoProgress 
                  ? 'border-luminary text-luminary bg-luminary/20 glow-cyan' 
                  : 'border-white/20 text-white/60 bg-white/5 hover:border-white/40'
              }`}
            >
              Auto: {store.autoProgress ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="relative flex flex-col items-center w-full">
            {/* Reward Popups - Floating over monster */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-full h-12 flex items-center justify-center z-30">
              <AnimatePresence>
                {rewardPopups.map((reward) => (
                  <motion.div
                    key={reward.id}
                    initial={{ opacity: 0, y: 15, scale: 0.8 }}
                    animate={{ opacity: 1, y: -5 }}
                    exit={{ opacity: 0, scale: 1.5, y: -30 }}
                    className="absolute flex flex-col items-center gap-0 pointer-events-none bg-black/80 backdrop-blur-xl p-1.5 md:p-2 rounded-lg border border-luminary/30 shadow-[0_0_20px_rgba(0,255,255,0.2)]"
                  >
                    <div className="flex items-center gap-1 text-yellow-400 font-bold text-[9px] md:text-xs">
                      <Coins className="w-2.5 h-2.5" />
                      <span>+{reward.gold.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-luminary font-bold text-[8px] md:text-[10px]">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>+{reward.xp} XP</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="w-36 h-36 sm:w-48 sm:h-48 md:w-72 md:h-72 relative mb-1 md:mb-2">
              <div className="absolute inset-0 bg-shadow-magic/10 blur-[60px] rounded-full animate-pulse" />
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
                className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_30px_rgba(138,43,226,0.3)] enemy-image"
                referrerPolicy="no-referrer"
              />
              
              {/* Floating Damage Numbers */}
              <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                <AnimatePresence>
                  {damageNumbers.map((dmg) => (
                    <motion.span
                      key={dmg.id}
                      initial={{ opacity: 1, y: 0, scale: 0.5, x: (Math.random() - 0.5) * 30 }}
                      animate={{ opacity: 0, y: -100, scale: 1.4, x: (Math.random() - 0.5) * 60 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="absolute text-lg md:text-3xl font-bold font-runic"
                      style={{ 
                        color: dmg.color,
                        textShadow: `0 0 8px ${dmg.color}CC, 0 0 15px ${dmg.color}60`
                      }}
                    >
                      {dmg.isCrit && <span className="block text-[7px] md:text-[9px] uppercase tracking-tighter mb-[-5px] text-white">Crit!</span>}
                      -{dmg.value}
                    </motion.span>
                  ))}

                  {activeAbilities.map((ability) => (
                    <motion.div
                      key={ability.id}
                      initial={{ opacity: 0, y: 25, scale: 0.8 }}
                      animate={{ opacity: 1, y: -50, scale: 1.1 }}
                      exit={{ opacity: 0, scale: 1.3 }}
                      className="absolute whitespace-nowrap font-bold tracking-[0.2em] text-xs md:text-2xl italic font-runic"
                      style={{ 
                        color: ability.color,
                        textShadow: `0 0 15px ${ability.color}`
                      }}
                    >
                      {ability.name}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
            
            {/* HP Bar */}
            <div className="w-full max-w-[200px] md:max-w-[320px] flex flex-col items-center gap-0.5 md:gap-1">
              <div className="w-full h-1.5 md:h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/10 shadow-inner">
                <motion.div 
                  className="h-full bg-gradient-to-r from-shadow-magic via-red-500 to-red-600 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                  initial={{ width: '100%' }}
                  animate={{ width: `${(enemyHp / maxEnemyHp) * 100}%` }}
                />
              </div>
              <div className="flex justify-between w-full px-1">
                <span className="text-[7px] md:text-[8px] font-runic text-white/40 uppercase tracking-widest">Enemy HP</span>
                <span className="text-[7px] md:text-[8px] font-runic text-white/80 font-bold tracking-widest">
                  {Math.ceil(enemyHp).toLocaleString()} / {maxEnemyHp.toLocaleString()}
                </span>
              </div>
            </div>

            {/* DPS Display */}
            <div className="mt-2 md:mt-4 flex items-center gap-2 md:gap-3 px-3 md:px-5 py-1 md:py-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 shadow-xl">
              <Sword className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-red-500 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[6px] md:text-[7px] uppercase tracking-[0.2em] text-white/40">Total DPS</span>
                <span className="text-[10px] md:text-sm font-runic text-white font-bold tracking-wider">
                  {Math.floor(totalDps).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
