import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Users, ShoppingCart, Sparkles, BookOpen, Coins, Zap, Shield, Settings } from 'lucide-react';
import { useGameStore } from './store/useGameStore';
import { INITIAL_PARAGONS, PermanentStatId } from './types';
import { Card } from './components/Card';

type Tab = 'tower' | 'training' | 'team' | 'recruit' | 'altar' | 'lore';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('tower');
  const [showArchive, setShowArchive] = useState(false);
  const store = useGameStore();

  // Combat UI State (Non-persistent)
  const [enemyHp, setEnemyHp] = useState(100);
  const [maxEnemyHp, setMaxEnemyHp] = useState(100);
  const [totalDps, setTotalDps] = useState(0);
  const [lastHitTime, setLastHitTime] = useState(0);
  const lastHitTimeRef = React.useRef(0);
  const enemyAttackTimerRef = React.useRef(0);
  const [damageNumbers, setDamageNumbers] = useState<{ id: number; value: number; type: 'dmg' | 'heal' | 'enemy-dmg'; targetId?: string }[]>([]);

  // Calculate Max HP for current floor
  useEffect(() => {
    const nextMaxHp = Math.floor(100 * Math.pow(1.15, store.currentFloor - 1));
    setMaxEnemyHp(nextMaxHp);
    setEnemyHp(nextMaxHp);
  }, [store.currentFloor]);

  // Global Game Tick
  useEffect(() => {
    if (!store.hasHydrated) return;

    const TICK_RATE = 100;
    const interval = setInterval(() => {
      const state = useGameStore.getState();
      const now = Date.now();
      
      // 1. Handle Respawn & Regen
      state.ownedParagons.forEach(p => {
        if (p.shatteredUntil > 0 && now >= p.shatteredUntil) {
          state.respawnParagon(p.id);
        } else if (p.currentHp < p.maxHp && p.shatteredUntil === 0) {
          // Out of combat regen (10% per sec)
          const regenAmount = (p.maxHp * 0.1 * TICK_RATE) / 1000;
          state.updateParagonHp(p.id, regenAmount);
        }
      });

      // 2. Combat Logic
      const activeIds = state.activeTeam.filter((id): id is string => id !== null);
      const team = state.activeTeam.map((id, index) => {
        if (!id) return null;
        const paragon = INITIAL_PARAGONS.find(p => p.id === id);
        const owned = state.ownedParagons.find(op => op.id === id);
        if (!paragon || !owned || owned.currentHp <= 0) return null;
        return { ...paragon, ...owned, slotIndex: index };
      }).filter((p): p is any => !!p);

      let currentTotalDps = 0;
      team.forEach(p => {
        const levelMult = 1 + (p.level - 1) * 0.1;
        const temporalAtkMult = 1 + (state.temporalUpgrades.atk - 1) * 0.2;
        const permanentAtkMult = 1 + state.permanentUpgrades.atkMult * 0.1;
        
        // Grid Bonus: Back Row (6, 7, 8) gets +20% ATK
        const gridAtkMult = (p.slotIndex >= 6) ? 1.2 : 1.0;
        
        let dmg = p.baseAtk * levelMult * temporalAtkMult * permanentAtkMult * gridAtkMult;
        
        if (p.id === 'kaelen-bold') dmg *= (1 + state.currentFloor * 0.05);
        if (p.id === 'oghul') dmg *= 1.2;

        const temporalSpeedMult = 1 + (state.temporalUpgrades.speed - 1) * 0.1;
        const permanentSpeedMult = 1 + state.permanentUpgrades.speedMult * 0.05;
        const effectiveAtkSpeed = p.atkSpeed * temporalSpeedMult * permanentSpeedMult;
        
        const temporalCritMult = (state.temporalUpgrades.crit - 1) * 0.02;
        const permanentCritMult = state.permanentUpgrades.critRate * 0.01;
        const totalCrit = p.critChance + temporalCritMult + permanentCritMult;
        
        const critDmgMult = 1 + totalCrit;
        currentTotalDps += dmg * effectiveAtkSpeed * critDmgMult;

        // Healing Logic (Elara heals frontline)
        if (p.id === 'elara' && Math.random() < (0.1 * state.gameSpeed * TICK_RATE / 1000)) {
          const frontLine = team.filter(tp => tp.slotIndex < 3);
          if (frontLine.length > 0) {
            const target = frontLine[Math.floor(Math.random() * frontLine.length)];
            const healAmount = p.baseAtk * 2;
            state.updateParagonHp(target.id, healAmount);
            setDamageNumbers(prev => [...prev.slice(-10), { id: Date.now(), value: Math.floor(healAmount), type: 'heal', targetId: target.id }]);
          }
        }
      });

      const dpsWithSpeed = currentTotalDps * state.gameSpeed;
      const damagePerTick = (dpsWithSpeed * TICK_RATE) / 1000;

      if (currentTotalDps > 0) {
        setTotalDps(dpsWithSpeed);
        if (now - lastHitTimeRef.current > 200) {
          setLastHitTime(now);
          lastHitTimeRef.current = now;
        }
        if (Math.random() < 0.2) {
          setDamageNumbers(prev => [...prev.slice(-10), { id: Date.now(), value: Math.floor(dpsWithSpeed), type: 'dmg' }]);
        }
      } else {
        setTotalDps(0);
      }

      // 3. Enemy Attacks Back
      enemyAttackTimerRef.current += TICK_RATE * state.gameSpeed;
      if (enemyAttackTimerRef.current >= 2000) {
        enemyAttackTimerRef.current = 0;
        
        // Find Target
        // Priority: Front (0,1,2) -> Mid (3,4,5) -> Back (6,7,8)
        const front = team.filter(p => p.slotIndex < 3);
        const mid = team.filter(p => p.slotIndex >= 3 && p.slotIndex < 6);
        const back = team.filter(p => p.slotIndex >= 6);
        
        let targets = front.length > 0 ? front : (mid.length > 0 ? mid : back);
        if (targets.length > 0) {
          // Target highest aggro
          const target = targets.reduce((prev, curr) => (curr.baseAggro > prev.baseAggro) ? curr : prev);
          const enemyDmg = Math.floor(10 * Math.pow(1.1, state.currentFloor - 1));
          const finalDmg = Math.max(1, enemyDmg - target.baseDef);
          
          state.updateParagonHp(target.id, -finalDmg);
          setDamageNumbers(prev => [...prev.slice(-10), { id: Date.now(), value: finalDmg, type: 'enemy-dmg', targetId: target.id }]);
        }
      }

      // 4. Update Enemy HP
      setEnemyHp(prev => {
        const next = prev - damagePerTick;
        if (next <= 0) {
          Promise.resolve().then(() => {
            const currentState = useGameStore.getState();
            const goldGain = Math.floor(currentState.currentFloor * 10 * (1 + (currentState.permanentUpgrades.goldMult - 1) * 0.1));
            currentState.addGold(goldGain);
            const isBoss = currentState.currentFloor % 10 === 0;
            const shardMult = 1 + (currentState.permanentUpgrades.shardMult - 1) * 0.1;
            if (isBoss) {
              currentState.addSoulShards(Math.floor((Math.random() * 6 + 5) * shardMult));
            } else if (Math.random() < 0.05) {
              currentState.addSoulShards(Math.floor((Math.random() * 3 + 1) * shardMult));
            }
            currentState.climbFloor();
          });
          return 100;
        }
        return next;
      });
    }, TICK_RATE);

    return () => clearInterval(interval);
  }, [store.hasHydrated]);

  // Hydration Shield
  if (!store.hasHydrated) {
    return (
      <div className="h-screen bg-obsidian flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-luminary border-t-transparent rounded-full animate-spin glow-cyan" />
          <p className="text-luminary font-runic tracking-widest animate-pulse">Awakening Aerthos...</p>
          <p className="text-[10px] text-white/30 uppercase tracking-widest">Synchronizing Persistence Layer</p>
        </div>
      </div>
    );
  }

  const unlockedParagons = React.useMemo(() => 
    INITIAL_PARAGONS.filter(p => store.ownedParagons.some(op => op.id === p.id)),
    [store.ownedParagons]
  );

  const enemyImageUrl = React.useMemo(() => {
    const monsterTypes = ['demon', 'wraith', 'golem', 'dragon', 'beholder', 'skeleton', 'gargoyle', 'chimera', 'hydra', 'lich'];
    const type = monsterTypes[store.currentFloor % monsterTypes.length];
    return `https://loremflickr.com/512/512/monster,${type},fantasy/all?lock=${store.currentFloor}`;
  }, [store.currentFloor]);

  return (
    <div className="h-screen flex flex-col bg-obsidian text-white font-gothic overflow-hidden">
      {/* Header: Resources */}
      <header className="h-auto min-h-16 border-b border-white/10 bg-black/50 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between px-4 py-2 sm:py-0 gap-2 sm:gap-0 z-50">
        <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto w-full sm:w-auto no-scrollbar py-1">
          <div className="flex items-center gap-2 shrink-0">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-xs sm:text-sm font-runic font-bold">{store.gold.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Sparkles className="w-4 h-4 text-shadow-magic" />
            <span className="text-xs sm:text-sm font-runic font-bold">{store.essence.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Shield className="w-4 h-4 text-luminary" />
            <span className="text-xs sm:text-sm font-runic font-bold">{store.soulShards.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="text-center order-first sm:order-none">
          <h1 className="text-sm sm:text-lg font-bold tracking-[0.2em] sm:tracking-[0.3em] text-white uppercase">Aerthos Endless</h1>
          <p className="text-[8px] sm:text-[10px] text-luminary tracking-widest uppercase">Floor {store.currentFloor}</p>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-white/50 uppercase">Highest Floor</p>
            <p className="text-xs font-runic">{store.highestFloor}</p>
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 overflow-y-auto relative p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'tower' && (
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
                  
                  {/* Floating Damage Numbers (Enemy taking damage) */}
                  <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                    <AnimatePresence>
                      {damageNumbers.filter(d => d.type === 'dmg').map((dmg) => (
                        <motion.span
                          key={dmg.id}
                          initial={{ opacity: 1, y: 0, scale: 0.5 }}
                          animate={{ opacity: 0, y: -100, scale: 1.5 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="absolute text-xl sm:text-2xl font-bold text-red-500 text-glow-purple font-runic"
                        >
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

              {/* Team HUD: 3x3 Resonance Grid */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-[8px] text-white/20 uppercase tracking-widest font-bold">Resonance Grid</p>
                <div className="grid grid-cols-3 gap-2 p-3 bg-black/40 rounded-xl border border-white/5">
                  {store.activeTeam.map((paragonId, index) => {
                    const paragon = INITIAL_PARAGONS.find(p => p.id === paragonId);
                    const owned = store.ownedParagons.find(op => op.id === paragonId);
                    if (!paragon || !owned) return <div key={index} className="w-12 h-18 sm:w-16 sm:h-24 rounded border border-white/5 bg-white/5" />;
                    
                    const effectiveMaxHp = (index < 3) ? owned.maxHp * 1.2 : owned.maxHp;

                    return (
                      <div key={index} className="flex flex-col items-center gap-1">
                        <Card 
                          paragon={paragon} 
                          variant="small" 
                          isActive={true}
                          lastHitTime={lastHitTime}
                          currentHp={owned.currentHp}
                          maxHp={effectiveMaxHp}
                          damageNumbers={damageNumbers}
                        />
                        <div className={`w-1 h-1 rounded-full ${owned.currentHp <= 0 ? 'bg-red-500' : 'bg-luminary glow-cyan'}`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'training' && (
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
          )}

          {activeTab === 'team' && (
            <motion.div 
              key="team"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col lg:flex-row gap-8 items-start justify-center"
            >
              {/* 3x3 Resonance Grid */}
              <div className="flex flex-col items-center gap-4">
                <div className="text-center mb-2">
                  <h2 className="text-xl font-bold text-luminary tracking-widest uppercase">Resonance Grid</h2>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Front (Top) • Mid • Back (Bottom)</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 p-6 bg-black/40 rounded-2xl border border-white/5 relative">
                  {/* Row Labels */}
                  <div className="absolute -left-12 top-0 bottom-0 flex flex-col justify-around text-[8px] text-white/20 uppercase tracking-widest font-bold [writing-mode:vertical-rl] rotate-180">
                    <span>Front Row (+20% HP)</span>
                    <span>Middle Row</span>
                    <span>Back Row (+20% ATK)</span>
                  </div>

                  {store.activeTeam.map((paragonId, index) => {
                    const paragon = INITIAL_PARAGONS.find(p => p.id === paragonId);
                    const owned = store.ownedParagons.find(op => op.id === paragonId);
                    
                    // Grid Bonus: Front Row (0, 1, 2) gets +20% HP
                    const effectiveMaxHp = owned ? (index < 3 ? owned.maxHp * 1.2 : owned.maxHp) : 0;
                    
                    return (
                      <div 
                        key={index}
                        className={`w-24 h-36 rounded-lg border-2 border-dashed flex items-center justify-center transition-all ${
                          paragonId ? 'border-luminary/50 bg-luminary/5' : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          const id = e.dataTransfer.getData('paragonId');
                          if (id) {
                            // Swap or move
                            const oldIndex = store.activeTeam.indexOf(id);
                            if (oldIndex !== -1) {
                              store.updateActiveTeam(oldIndex, store.activeTeam[index]);
                            }
                            store.updateActiveTeam(index, id);
                          }
                        }}
                      >
                        {paragon ? (
                          <div className="relative group">
                            <Card 
                              paragon={paragon} 
                              variant="small" 
                              currentHp={owned?.currentHp}
                              maxHp={effectiveMaxHp}
                              damageNumbers={damageNumbers}
                            />
                            <button 
                              onClick={() => store.updateActiveTeam(index, null)}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] text-white/10 uppercase tracking-widest font-bold">Empty</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Owned Paragons List */}
              <div className="flex-1 w-full max-w-md">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white tracking-widest uppercase">Paragon Roster</h2>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Drag to assign to the grid</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {unlockedParagons.map(p => {
                    const owned = store.ownedParagons.find(op => op.id === p.id);
                    const isActive = store.activeTeam.includes(p.id);
                    return (
                      <div 
                        key={p.id}
                        draggable={!isActive}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('paragonId', p.id);
                        }}
                        className={`cursor-grab active:cursor-grabbing ${isActive ? 'opacity-30 grayscale' : ''}`}
                      >
                        <Card 
                          paragon={p} 
                          variant="small"
                          currentHp={owned?.currentHp}
                          maxHp={owned?.maxHp}
                        />
                        <div className="mt-2 text-center">
                          <p className="text-[10px] font-bold uppercase text-white/70">{p.name}</p>
                          <p className="text-[8px] text-luminary uppercase">LVL {owned?.level}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'recruit' && (
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
          )}

          {activeTab === 'altar' && (
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
          )}

          {activeTab === 'lore' && (
            <motion.div 
              key="lore"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-3xl mx-auto space-y-12 py-12"
            >
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-luminary border-b border-luminary/30 pb-2">Chapter I: The Tower of Sundering</h2>
                <p className="text-white/80 leading-relaxed">
                  In the beginning, Aerthos was a world of light. The ten races lived in harmony under the Luminary Sun. 
                  But Mor'Goth, the Shadow Weaver, coveted the light. He forged the Tower of Sundering, a jagged obsidian 
                  spire that pierced the heavens and drained the world's essence.
                </p>
              </div>
              <div className="space-y-4 opacity-50">
                <h2 className="text-2xl font-bold text-white/50 border-b border-white/10 pb-2">Chapter II: The Fallen Paragons</h2>
                <p className="text-white/40 italic">Reach Floor 100 to unlock this chapter.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showArchive && (
            <StatArchive 
              upgrades={store.permanentUpgrades} 
              onClose={() => setShowArchive(false)} 
            />
          )}
        </AnimatePresence>
      </main>

      {/* Footer: Navigation */}
      <footer className="h-16 sm:h-20 border-t border-white/10 bg-black/80 backdrop-blur-xl flex items-center justify-around px-2 sm:px-4 z-50 overflow-x-auto no-scrollbar">
        <NavButton active={activeTab === 'tower'} onClick={() => setActiveTab('tower')} icon={<Sword />} label="Tower" />
        <NavButton active={activeTab === 'training'} onClick={() => setActiveTab('training')} icon={<Zap />} label="Train" />
        <NavButton active={activeTab === 'team'} onClick={() => setActiveTab('team')} icon={<Users />} label="Team" />
        <NavButton active={activeTab === 'recruit'} onClick={() => setActiveTab('recruit')} icon={<ShoppingCart />} label="Recruit" />
        <NavButton active={activeTab === 'altar'} onClick={() => setActiveTab('altar')} icon={<Sparkles />} label="Altar" />
        <NavButton active={activeTab === 'lore'} onClick={() => setActiveTab('lore')} icon={<BookOpen />} label="Lore" />
      </footer>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 sm:gap-1 transition-all ${active ? 'text-luminary scale-105 sm:scale-110' : 'text-white/40 hover:text-white/70'}`}
    >
      <div className={`${active ? 'glow-cyan' : ''}`}>
        {React.cloneElement(icon as React.ReactElement, { size: 20, className: 'sm:w-6 sm:h-6' })}
      </div>
      <span className="text-[7px] sm:text-[10px] uppercase font-bold tracking-widest">{label}</span>
    </button>
  );
}

const AltarSlot: React.FC<{ statId: PermanentStatId, level: number, onUpgrade: () => void, essence: number, totalLevels: number }> = ({ statId, level, onUpgrade, essence, totalLevels }) => {
  const metadata = STAT_METADATA[statId];
  const cost = Math.floor(5 * Math.pow(1.5, totalLevels));
  const canAfford = essence >= cost;

  return (
    <motion.button 
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onUpgrade}
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

const StatArchive: React.FC<{ upgrades: Record<PermanentStatId, number>, onClose: () => void }> = ({ upgrades, onClose }) => {
  const sortedStats = (Object.keys(STAT_METADATA) as PermanentStatId[]).sort((a, b) => 
    STAT_METADATA[a].name.localeCompare(STAT_METADATA[b].name)
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-obsidian border border-white/10 rounded-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/50">
          <div>
            <h2 className="text-xl font-bold text-luminary tracking-widest uppercase">Runic Record</h2>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Archive of Permanent Ascension</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <Settings className="w-5 h-5 text-white/50" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {sortedStats.map(id => {
            const level = upgrades[id];
            const meta = STAT_METADATA[id];
            const isDiscovered = level > 0;

            return (
              <div 
                key={id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  isDiscovered ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5 opacity-40'
                }`}
              >
                <div className={`p-2 rounded-lg ${isDiscovered ? 'bg-white/5' : 'bg-transparent'}`}>
                  {React.cloneElement(meta.icon as React.ReactElement, { size: 24, className: isDiscovered ? '' : 'text-white/20' })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${isDiscovered ? 'text-white' : 'text-white/30'}`}>
                      {meta.name}
                    </h3>
                    <span className="text-[10px] font-runic text-luminary">LVL {level}</span>
                  </div>
                  <p className={`text-[10px] ${isDiscovered ? 'text-white/50' : 'text-white/20 italic'}`}>
                    {isDiscovered ? meta.description : 'Undiscovered Rune'}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold ${isDiscovered ? 'text-luminary' : 'text-white/10'}`}>
                    {meta.bonusText(level)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-black/50 border-t border-white/10 text-center">
          <p className="text-[8px] text-white/30 uppercase tracking-widest">The Record persists through all Sundering</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

const STAT_METADATA: Record<PermanentStatId, { name: string; icon: React.ReactNode; description: string; bonusText: (lvl: number) => string }> = {
  atkMult: {
    name: 'Attack Power',
    icon: <Sword />,
    description: 'Permanently increases all damage dealt.',
    bonusText: (lvl) => `+${(lvl * 10).toFixed(0)}% Total ATK`
  },
  goldMult: {
    name: 'Gold Find',
    icon: <Coins />,
    description: 'Increases gold dropped by enemies.',
    bonusText: (lvl) => `+${(lvl * 10).toFixed(0)}% Gold Gain`
  },
  shardMult: {
    name: 'Shard Luck',
    icon: <Shield />,
    description: 'Increases Soul Shard drop amounts.',
    bonusText: (lvl) => `+${(lvl * 10).toFixed(0)}% Shard Gain`
  },
  essenceGain: {
    name: 'Essence Flow',
    icon: <Sparkles />,
    description: 'Increases Essence gained from Sundering.',
    bonusText: (lvl) => `+${(lvl * 10).toFixed(0)}% Essence Gain`
  },
  critRate: {
    name: 'Critical Eye',
    icon: <Zap className="text-orange-500" />,
    description: 'Increases critical strike chance.',
    bonusText: (lvl) => `+${(lvl * 1).toFixed(0)}% Crit Chance`
  },
  speedMult: {
    name: 'Haste Rune',
    icon: <Zap className="text-luminary" />,
    description: 'Increases attack speed of all Paragons.',
    bonusText: (lvl) => `+${(lvl * 5).toFixed(0)}% ATK Speed`
  }
};
