import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Shield, Sparkles, Coins, Clock, Zap, Play, Pause } from 'lucide-react';
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
  damageNumbers: { id: string | number; value: number; color: string; isCrit?: boolean }[];
  enemyImageUrl: string;
  paragonMp: Record<string, number>;
  activeAbilities: { id: string | number; name: string; color: string }[];
  floorTimer: number;
  screenEffect: { type: 'flash' | 'shake'; color: string } | null;
  gameSpeed: number;
  onSetGameSpeed: (speed: number) => void;
  onSelectParagon: (id: string) => void;
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
  gameSpeed,
  onSetGameSpeed,
  onSelectParagon,
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
        id: Math.random() + store.lastEnemyRewards.timestamp + Math.random(),
        gold: store.lastEnemyRewards.gold,
        xp: store.lastEnemyRewards.xp,
        shards: store.lastEnemyRewards.shards
      };
      setRewardPopups(prev => [...prev.slice(-5), newReward]);
      const timer = setTimeout(() => {
        setRewardPopups(prev => prev.filter(r => r.id !== newReward.id));
      }, 1500 / gameSpeed);
      return () => clearTimeout(timer);
    }
  }, [store.lastEnemyRewards?.timestamp]);

  // Clear boss drop flag after animation
  React.useEffect(() => {
    if (store.bossDropSuccess !== null) {
      const timer = setTimeout(() => {
        store.resetBossDropFlag();
      }, 4000 / gameSpeed);
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
      transition={screenEffect?.type === 'shake' ? { duration: 0.5 / gameSpeed } : { type: 'spring', damping: 25, stiffness: 200 }}
      className="h-full w-full relative flex flex-col items-center justify-between overflow-hidden select-none"
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
      <div className="w-full h-full flex flex-col items-center justify-between p-0 relative z-10">
        
        {/* Combat HUD (Top) - Compact & Closer to currencies */}
        <div className="w-full max-w-2xl flex items-center justify-center px-2 pt-1 pb-0">
          <div className="flex items-center justify-around gap-4 md:gap-8 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg px-6 py-1 shadow-2xl">
            {/* Timer */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-luminary/60" />
              <div className={`text-lg md:text-xl font-runic font-bold drop-shadow-[0_0_10px_rgba(0,255,255,0.6)] ${floorTimer < 10 ? 'text-red-500 animate-pulse' : 'text-luminary'}`}>
                {floorTimer.toFixed(1)}s
              </div>
            </div>

            <div className="w-px h-4 bg-white/10" />

            {/* Speed Toggle */}
            <button
              onClick={() => {
                const nextSpeed = gameSpeed === 1 ? 2 : gameSpeed === 2 ? 4 : 1;
                onSetGameSpeed(nextSpeed);
              }}
              className={`flex items-center gap-1.5 group px-2 py-0.5 rounded transition-all ${gameSpeed > 1 ? 'bg-luminary/10 border border-luminary/30 shadow-[0_0_10px_rgba(0,255,255,0.2)]' : ''}`}
            >
              <Zap className={`w-3.5 h-3.5 transition-colors ${gameSpeed > 1 ? 'text-luminary' : 'text-white/40'} group-hover:text-luminary`} />
              <div className={`text-sm md:text-base font-bold transition-colors ${gameSpeed > 1 ? 'text-luminary glow-cyan' : 'text-white group-hover:text-luminary'}`}>x{gameSpeed}</div>
            </button>

            <div className="w-px h-4 bg-white/10" />

            {/* Auto Toggle */}
            <button 
              onClick={() => store.toggleAutoProgress()}
              className="flex items-center gap-1.5 group"
            >
              {store.autoProgress ? (
                <Play className="w-3.5 h-3.5 text-luminary shadow-[0_0_10px_rgba(0,255,255,0.5)]" />
              ) : (
                <Pause className="w-3.5 h-3.5 text-white/40" />
              )}
              <div className={`text-sm md:text-base font-bold transition-colors ${store.autoProgress ? 'text-luminary glow-cyan' : 'text-white/40'}`}>
                AUTO
              </div>
            </button>
          </div>
        </div>

        {/* Monster Section (Middle - Squeezed to 35vh) */}
        <div className="flex-1 w-full flex flex-col items-center justify-center relative min-h-0 max-h-[35vh]">
          {/* Navigation Paddles - Anchored to Monster Area */}
          <button 
            onClick={() => store.descendFloor()}
            disabled={store.currentFloor <= 1}
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-[40px] h-[80px] flex items-center justify-center transition-all z-[100] ${
              store.currentFloor > 1 
                ? 'opacity-30 hover:opacity-80 active:opacity-80 cursor-pointer' 
                : 'opacity-0 cursor-not-allowed pointer-events-none'
            }`}
          >
            <div className="w-full h-full flex items-center justify-center bg-black/40 backdrop-blur-md border-r border-y border-luminary/30 rounded-r-lg shadow-[0_0_20px_rgba(0,255,255,0.2)]">
              <Sword className="w-4 h-4 rotate-180 text-luminary" />
            </div>
          </button>

          <button 
            onClick={() => store.climbFloor()}
            disabled={store.currentFloor >= store.highestFloor}
            className={`absolute right-0 top-1/2 -translate-y-1/2 w-[40px] h-[80px] flex items-center justify-center transition-all z-[100] ${
              store.currentFloor < store.highestFloor 
                ? 'opacity-30 hover:opacity-80 active:opacity-80 cursor-pointer' 
                : 'opacity-0 cursor-not-allowed pointer-events-none'
            }`}
          >
            <div className="w-full h-full flex items-center justify-center bg-black/40 backdrop-blur-md border-l border-y border-luminary/30 rounded-l-lg shadow-[0_0_20px_rgba(0,255,255,0.2)]">
              <Sword className="w-4 h-4 text-luminary" />
            </div>
          </button>

          <div className="relative flex flex-col items-center w-full max-w-3xl h-full justify-center min-h-0">
            {/* Reward Popups */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-full h-8 flex items-center justify-center z-30 pointer-events-none">
              <AnimatePresence>
                {rewardPopups.map((reward) => (
                  <motion.div
                    key={reward.id}
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: -5 }}
                    exit={{ opacity: 0, scale: 1.5, y: -20 }}
                    className="absolute flex flex-col items-center gap-0 pointer-events-none bg-black/90 backdrop-blur-2xl p-1 rounded-lg border border-luminary/40 shadow-[0_0_20px_rgba(0,255,255,0.3)]"
                    style={{ willChange: 'transform, opacity' }}
                  >
                    <div className="flex items-center gap-1 text-yellow-400 font-bold text-[9px]">
                      <Coins className="w-2.5 h-2.5" />
                      <span>+{reward.gold.toLocaleString()}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Monster Sprite */}
            <div className="w-full h-full relative flex items-center justify-center min-h-0">
              <div className="absolute inset-0 bg-shadow-magic/5 blur-[60px] rounded-full animate-pulse" />
              <motion.img 
                key={`enemy-${store.currentFloor}`}
                initial={{ x: 0, filter: 'contrast(1.2) brightness(0.9) drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}
                animate={lastHitTime ? { 
                  x: [0, -5, 5, -5, 5, 0],
                  filter: gameSpeed >= 4 ? 'none' : ['contrast(1.2) brightness(0.9) drop-shadow(0 0 10px rgba(0,0,0,0.5))', 'contrast(1.5) brightness(1.2) drop-shadow(0 0 20px rgba(0,255,255,0.5))', 'contrast(1.2) brightness(0.9) drop-shadow(0 0 10px rgba(0,0,0,0.5))']
                } : {}}
                transition={{ duration: 0.2 / gameSpeed }}
                src={enemyImageUrl} 
                alt="Enemy"
                className="w-full h-full object-contain relative z-10 enemy-image mix-blend-screen"
                style={{ willChange: 'transform, filter' }}
                referrerPolicy="no-referrer"
              />
              
              {/* Floating Damage Numbers */}
              <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                <AnimatePresence>
                  {damageNumbers.map((dmg) => (
                    <motion.span
                      key={dmg.id}
                      initial={{ opacity: 1, y: 0, scale: 0.5, x: (Math.random() - 0.5) * 30 }}
                      animate={{ opacity: 0, y: -120, scale: 1.6, x: (Math.random() - 0.5) * 60 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8 / gameSpeed, ease: "easeOut" }}
                      className="absolute text-2xl md:text-4xl font-bold font-runic"
                      style={{ 
                        color: dmg.color,
                        textShadow: gameSpeed >= 4 ? 'none' : `0 0 8px ${dmg.color}CC, 0 0 16px ${dmg.color}60`,
                        transform: 'translate3d(0,0,0)',
                        willChange: 'transform, opacity'
                      }}
                    >
                      {dmg.isCrit && <span className="block text-[9px] md:text-[11px] uppercase tracking-tighter mb-[-6px] text-white">Crit!</span>}
                      -{dmg.value}
                    </motion.span>
                  ))}

                  {activeAbilities.map((ability) => (
                    <motion.div
                      key={ability.id}
                      initial={{ opacity: 0, y: 15, scale: 0.8 }}
                      animate={{ opacity: 1, y: -60, scale: 1.1 }}
                      exit={{ opacity: 0, scale: 1.3 }}
                      className="absolute whitespace-nowrap font-bold tracking-[0.2em] text-base md:text-2xl italic font-runic"
                      style={{ 
                        color: ability.color,
                        textShadow: gameSpeed >= 4 ? 'none' : `0 0 15px ${ability.color}`,
                        willChange: 'transform, opacity'
                      }}
                    >
                      {ability.name}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* HP Bar & DPS Badge Integration */}
        <div className="w-full max-w-sm flex flex-col items-center gap-0.5 px-4">
          <div className="w-full flex items-center justify-between gap-3">
            <div className="flex-1 h-1 md:h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5 shadow-[inset_0_1px_4px_rgba(0,0,0,0.8)]">
              <motion.div 
                className="h-full bg-gradient-to-r from-red-900 via-red-600 to-luminary shadow-[0_0_10px_rgba(0,255,255,0.4)]"
                initial={{ width: '100%' }}
                animate={{ width: `${(enemyHp / maxEnemyHp) * 100}%` }}
              />
            </div>
            {/* DPS Badge Integrated Right */}
            <div className="flex items-center gap-1 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded border border-white/10">
              <span className="text-[6px] uppercase tracking-widest text-white/40">DPS</span>
              <span className="text-[9px] font-runic font-bold text-luminary">{Math.floor(totalDps).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex justify-between w-full px-1 text-[7px] md:text-[8px] font-runic uppercase tracking-[0.1em]">
            <span className="text-white/30">Enemy Vitality</span>
            <span className="text-luminary/80 font-bold">
              {Math.ceil(enemyHp).toLocaleString()} / {maxEnemyHp.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Team Section (Bottom - Soul Chain) */}
        <div className="w-full flex flex-col items-center gap-1 pb-0 min-h-0">
          <div className="flex flex-col items-center gap-1 w-full min-h-0">
            <div className="flex items-center gap-2 px-4 w-full max-w-4xl">
              <h2 className="text-[7px] md:text-[9px] font-bold text-shadow-magic uppercase tracking-[0.4em] opacity-90">
                The Soul Chain
              </h2>
              <div className="h-px flex-1 bg-shadow-magic/30" />
            </div>
            
            <div className="flex flex-row gap-2 md:gap-4 h-[130px] min-h-0 items-center mb-1">
              {activeParagons.map((p, index) => {
                if (!p) {
                  return (
                    <div key={`empty-${index}`} className="relative w-20 sm:w-28 h-full obsidian-border rounded-md bg-black/20 flex items-center justify-center border-dashed border-luminary/30 shadow-[0_0_10px_rgba(0,255,255,0.05)]">
                      <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <Sparkles className="w-6 h-6 text-luminary" />
                      </div>
                      <div className="text-[14px] font-runic text-luminary/40">+</div>
                    </div>
                  );
                }
                const ownedData = store.ownedParagons.find(op => op.id === p.id);
                return (
                  <div 
                    key={p.id} 
                    className="flex flex-col items-center gap-0.5 group h-full min-h-0"
                  >
                    <div className="relative h-[85%] aspect-[2/3]">
                      <Card 
                        paragon={p} 
                        variant="small" 
                        isActive={true}
                        lastHitTime={lastAttackTimes[p.id]}
                        mp={paragonMp[p.id] || 0}
                        level={ownedData?.level}
                        xp={ownedData?.xp}
                        nextLevelXp={ownedData?.nextLevelXp}
                        starRating={ownedData?.starRating}
                        biomeColor={currentBiome.color}
                        gameSpeed={gameSpeed}
                        onClick={() => onSelectParagon(p.id)}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full shadow-[0_0_6px_currentColor]" style={{ backgroundColor: p.color, color: p.color }} />
                      <span className="text-[7px] md:text-[8px] uppercase tracking-widest font-bold text-white/70 group-hover:text-white transition-colors truncate max-w-[50px] md:max-w-none">{p.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Footer (Floor & Biome) - Anchored at the very bottom */}
          <div className="w-full flex items-center justify-center py-1 border-t border-white/5 bg-black/20 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="text-[9px] md:text-[11px] uppercase tracking-[0.3em] text-white/40 font-runic">Floor {store.currentFloor}</div>
              <div className="w-1 h-1 rounded-full bg-luminary/10" />
              <div className="text-[9px] md:text-[11px] uppercase tracking-[0.2em] text-luminary/60 font-runic">{currentBiome.name}</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>

  );
};
