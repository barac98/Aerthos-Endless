import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Sword, Users, ShoppingCart, Sparkles, BookOpen, Coins, Zap, Shield, Settings } from 'lucide-react';
import { useGameStore } from './store/useGameStore';
import { INITIAL_PARAGONS } from './types';

// Screens
import { TowerScreen } from './components/screens/TowerScreen';
import { TrainingScreen } from './components/screens/TrainingScreen';
import { TeamScreen } from './components/screens/TeamScreen';
import { RecruitScreen } from './components/screens/RecruitScreen';
import { AltarScreen } from './components/screens/AltarScreen';
import { LoreScreen } from './components/screens/LoreScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { StatArchive } from './components/StatArchive';
import { WelcomeBackModal } from './components/WelcomeBackModal';
import { NewVersionModal } from './components/NewVersionModal';
import { APP_VERSION } from './constants';

type Tab = 'tower' | 'training' | 'team' | 'recruit' | 'altar' | 'lore' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('tower');
  const [showArchive, setShowArchive] = useState(false);
  const store = useGameStore();

  // Combat UI State (Non-persistent)
  const [enemyHp, setEnemyHp] = useState(100);
  const [maxEnemyHp, setMaxEnemyHp] = useState(100);
  const [totalDps, setTotalDps] = useState(0);
  const [lastHitTime, setLastHitTime] = useState(0);
  const lastHitTimeRef = useRef(0);
  const [lastAttackTimes, setLastAttackTimes] = useState<Record<string, number>>({});
  const [damageNumbers, setDamageNumbers] = useState<{ id: number; value: number; color: string; isCrit?: boolean }[]>([]);
  const attackTimersRef = useRef<Record<string, number>>({});

  // Signature Ability State
  const [paragonMp, setParagonMp] = useState<Record<string, number>>({});
  const [activeAbilities, setActiveAbilities] = useState<{ id: number; name: string; color: string }[]>([]);
  const [goldBonusTimer, setGoldBonusTimer] = useState(0);
  const [floorTimer, setFloorTimer] = useState(60);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [screenEffect, setScreenEffect] = useState<{ type: 'flash' | 'shake'; color: string } | null>(null);

  // Offline Progress State
  const [offlineRewards, setOfflineRewards] = useState<{ gold: number; xp: number; kills: number; timeAway: number } | null>(null);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);

  const isTransitioningRef = useRef(false);

  const enemyImageUrl = useMemo(() => {
    const monsterTypes = ['demon', 'wraith', 'golem', 'dragon', 'beholder', 'skeleton', 'gargoyle', 'chimera', 'hydra', 'lich'];
    const type = monsterTypes[store.currentFloor % monsterTypes.length];
    return `https://loremflickr.com/512/512/monster,${type},fantasy/all?lock=${store.currentFloor}`;
  }, [store.currentFloor]);

  // Calculate Max HP for current floor
  useEffect(() => {
    const nextMaxHp = Math.floor(100 * Math.pow(1.15, store.currentFloor - 1));
    setMaxEnemyHp(nextMaxHp);
    setEnemyHp(nextMaxHp);
    setFloorTimer(60);
    setParagonMp({}); // Reset MP on floor change as requested
    isTransitioningRef.current = false; // Unlock after HP is set
  }, [store.currentFloor]);

  const hasCheckedOfflineRef = useRef(false);

  // Global Game Tick
  useEffect(() => {
    if (!store.hasHydrated) {
      return;
    }

    // Check for offline progress once on hydration
    if (!hasCheckedOfflineRef.current) {
      const rewards = store.calculateOfflineProgress();
      if (rewards) {
        setOfflineRewards(rewards);
        setShowWelcomeBack(true);
      }
      hasCheckedOfflineRef.current = true;
    }

    const TICK_RATE = 100; // 100ms for smoother combat
    const interval = setInterval(() => {
      const state = useGameStore.getState();
      
      // Update Floor Timer
      setFloorTimer(prev => {
        if (isTimerPaused) return prev;
        const next = prev - (TICK_RATE / 1000) * state.gameSpeed;
        if (next <= 0) {
          // Timer hit 0 - Reset floor progress
          setEnemyHp(maxEnemyHp);
          return 60;
        }
        return next;
      });

      // Update Gold Bonus Timer
      setGoldBonusTimer(prev => Math.max(0, prev - (TICK_RATE / 1000) * state.gameSpeed));

      const activeIds = state.activeTeam.filter((id): id is string => id !== null);
      
      // Soul Chain: +10% ATK per additional member (2 members = 10%, 3 = 20%, 4 = 30%)
      const soulChainMult = 1 + (activeIds.length - 1) * 0.1;

      // Explicitly find team members to avoid any filter issues
      const team = activeIds.map(id => INITIAL_PARAGONS.find(p => p.id === id)).filter((p): p is typeof INITIAL_PARAGONS[0] => !!p);
      
      let totalDamageThisTick = 0;
      let currentTotalDps = 0;
      const newDamageNumbers: { id: number; value: number; color: string; isCrit?: boolean }[] = [];
      const attackingIds: string[] = [];
      const triggeredAbilities: { name: string; color: string; damage?: number }[] = [];

      team.forEach(p => {
        const owned = state.ownedParagons.find(op => op.id === p.id);
        const levelMult = owned ? 1 + (owned.level - 1) * 0.1 : 1;
        
        // New Multipliers
        const temporalAtkMult = 1 + state.temporalUpgrades.atk * 0.1;
        const permanentAtkMult = 1 + state.permanentUpgrades.atkMult * 0.1;
        const temporalSpeedMult = 1 + state.temporalUpgrades.speed * 0.05;
        const permanentSpeedMult = 1 + state.permanentUpgrades.speedMult * 0.05;
        const temporalCritMult = state.temporalUpgrades.crit * 0.01;
        const permanentCritMult = state.permanentUpgrades.critRate * 0.01;
        
        let dmg = p.baseAtk * levelMult * temporalAtkMult * permanentAtkMult * soulChainMult;
        
        // Simple ability logic
        if (p.id === 'kaelen-bold') dmg *= (1 + state.currentFloor * 0.05);
        if (p.id === 'oghul') dmg *= 1.2;

        const effectiveAtkSpeed = p.atkSpeed * temporalSpeedMult * permanentSpeedMult;
        const totalCrit = p.critChance + temporalCritMult + permanentCritMult;
        
        // Calculate DPS for display
        const critDmgMult = 1 + totalCrit;
        const charDps = dmg * effectiveAtkSpeed * critDmgMult;
        currentTotalDps += charDps;

        // Mana Generation (5 MP per second)
        setParagonMp(prev => {
          const currentMp = prev[p.id] || 0;
          if (currentMp >= 100) return prev; // Already full, waiting for trigger
          
          const mpGain = (5 * TICK_RATE / 1000) * state.gameSpeed;
          const nextMp = Math.min(100, currentMp + mpGain);
          
          if (nextMp >= 100) {
            // Trigger Signature Ability
            if (p.id === 'kaelen-bold') {
              triggeredAbilities.push({ name: 'THRONE-BREAKER STRIKE', color: p.color, damage: charDps * 5 });
            } else if (p.id === 'silas-vane') {
              triggeredAbilities.push({ name: 'SHADOW HARVEST', color: p.color, damage: charDps * 2 });
              setGoldBonusTimer(5);
            } else if (p.id === 'elara') {
              triggeredAbilities.push({ name: 'LUMINOUS RAIN', color: p.color });
              // Luminous Rain: 10 hits of 40% DPS in 1s. 
              // For simplicity in the tick, we'll just add the total damage now or spread it.
              // Let's add it as a burst for now but visually it will be a volley.
              totalDamageThisTick += charDps * 0.4 * 10;
            } else if (p.id === 'oghul') {
              triggeredAbilities.push({ name: 'MOUNTAIN CRUSHER', color: p.color, damage: charDps * 3 });
              setIsTimerPaused(true);
              setTimeout(() => setIsTimerPaused(false), 2000 / state.gameSpeed);
            }
            return { ...prev, [p.id]: 0 };
          }
          
          return { ...prev, [p.id]: nextMp };
        });

        // Attack Timer Logic
        const timer = attackTimersRef.current[p.id] || 0;
        const progress = (effectiveAtkSpeed * TICK_RATE / 1000) * state.gameSpeed;
        const newTimer = timer + progress;
        
        const attacks = Math.floor(newTimer);
        if (attacks > 0) {
          attackingIds.push(p.id);
          for (let i = 0; i < attacks; i++) {
            const isCrit = Math.random() < totalCrit;
            const finalDmg = dmg * (isCrit ? 2 : 1);
            totalDamageThisTick += finalDmg;

            // Add damage number for every attack
            newDamageNumbers.push({
              id: Math.random() + Date.now() + Math.random(),
              value: Math.floor(finalDmg),
              color: p.color,
              isCrit
            });
          }
          attackTimersRef.current[p.id] = newTimer - attacks;
        } else {
          attackTimersRef.current[p.id] = newTimer;
        }
      });

      // Apply Ability Damage
      triggeredAbilities.forEach(ability => {
        if (ability.damage) {
          totalDamageThisTick += ability.damage;
          newDamageNumbers.push({
            id: Date.now() + Math.random(),
            value: Math.floor(ability.damage),
            color: ability.color,
            isCrit: true
          });
        }
        
        // Add Ability Name Visual
        const abilityId = Math.random() + Date.now() + Math.random();
        setActiveAbilities(prev => [...prev, { id: abilityId, name: ability.name, color: ability.color }]);
        setTimeout(() => {
          setActiveAbilities(prev => prev.filter(a => a.id !== abilityId));
        }, 2000);

        // Screen Effect
        setScreenEffect({ type: 'shake', color: ability.color });
        setTimeout(() => setScreenEffect(null), 500);
      });

      // Apply Game Speed to DPS display
      const dpsWithSpeed = currentTotalDps * state.gameSpeed;

      if (totalDamageThisTick > 0 || triggeredAbilities.length > 0) {
        setTotalDps(dpsWithSpeed);
        
        // Update individual attack times for animations
        if (attackingIds.length > 0) {
          const now = Date.now();
          setLastAttackTimes(prev => {
            const next = { ...prev };
            attackingIds.forEach(id => { next[id] = now; });
            return next;
          });
        }

        // Throttled hit animation for enemy (200ms)
        const now = Date.now();
        if (now - lastHitTimeRef.current > 200) {
          setLastHitTime(now);
          lastHitTimeRef.current = now;
        }

        if (newDamageNumbers.length > 0) {
          setDamageNumbers(prev => [...prev.slice(-10), ...newDamageNumbers]);
        }
      } else {
        // Still update DPS display even if no attack this tick
        setTotalDps(dpsWithSpeed);
      }

      // 2. Update Enemy HP & Progress
      setEnemyHp(prev => {
        if (prev <= 0 || isTransitioningRef.current) return prev; // Guard against multiple triggers

        const next = prev - totalDamageThisTick;
        if (next <= 0) {
          isTransitioningRef.current = true; // Lock transition
          
          // Enemy Defeated - Schedule store updates to avoid React warning
          Promise.resolve().then(() => {
            const currentState = useGameStore.getState();
            const goldBonus = goldBonusTimer > 0 ? 1.2 : 1;
            currentState.defeatEnemy(goldBonus);
            
            if (!currentState.autoProgress) {
              // Reset same floor
              const nextMaxHp = Math.floor(100 * Math.pow(1.15, currentState.currentFloor - 1));
              setMaxEnemyHp(nextMaxHp);
              setEnemyHp(nextMaxHp);
              setFloorTimer(60);
              isTransitioningRef.current = false; // Unlock manually if not climbing
            }
          });
          return 0; // Set to 0 to prevent further damage until reset
        }
        return next;
      });
    }, TICK_RATE);

    return () => clearInterval(interval);
  }, [store.hasHydrated]); // Only depend on hydration status

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

  return (
    <div className="h-screen flex flex-col bg-obsidian text-white font-gothic overflow-hidden select-none touch-manipulation">
      {/* Header: Resources Only */}
      <header className="h-12 border-b border-white/10 bg-black/50 backdrop-blur-md flex items-center justify-center px-4 z-50">
        <div className="flex items-center gap-6 sm:gap-12 overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-2 shrink-0">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-xs sm:text-sm font-runic font-bold">{store.gold.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Shield className="w-4 h-4 text-luminary" />
            <span className="text-xs sm:text-sm font-runic font-bold">{store.soulShards.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Sparkles className="w-4 h-4 text-shadow-magic" />
            <span className="text-xs sm:text-sm font-runic font-bold">{store.essence.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <main className={`flex-1 relative ${activeTab === 'tower' ? 'overflow-hidden p-0' : 'overflow-y-auto p-2 sm:p-6'}`}>
        <AnimatePresence mode="wait">
          {activeTab === 'tower' && (
            <TowerScreen 
              enemyHp={enemyHp}
              maxEnemyHp={maxEnemyHp}
              totalDps={totalDps}
              lastHitTime={lastHitTime}
              lastAttackTimes={lastAttackTimes}
              damageNumbers={damageNumbers}
              enemyImageUrl={enemyImageUrl}
              paragonMp={paragonMp}
              activeAbilities={activeAbilities}
              floorTimer={floorTimer}
              screenEffect={screenEffect}
              gameSpeed={store.gameSpeed}
              onSetGameSpeed={store.setGameSpeed}
            />
          )}

          {activeTab === 'training' && <TrainingScreen />}

          {activeTab === 'team' && <TeamScreen paragonMp={paragonMp} />}

          {activeTab === 'recruit' && <RecruitScreen />}

          {activeTab === 'altar' && <AltarScreen setShowArchive={setShowArchive} />}

          {activeTab === 'lore' && <LoreScreen />}

          {activeTab === 'settings' && <SettingsScreen />}
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
        <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings />} label="Config" />
      </footer>
      <WelcomeBackModal 
        isOpen={showWelcomeBack} 
        onClose={() => {
          if (offlineRewards) {
            store.claimOfflineRewards(offlineRewards.gold, offlineRewards.xp);
          }
          setShowWelcomeBack(false);
        }} 
        rewards={offlineRewards} 
      />

      <NewVersionModal />

      {/* Version Display */}
      <div className="fixed bottom-1 right-1 pointer-events-none z-[1000] opacity-30">
        <span className="text-[10px] font-mono tracking-widest text-white/50">v{APP_VERSION}</span>
      </div>

      <SpeedInsights />
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 sm:gap-1 transition-all ${active ? 'text-luminary scale-105 sm:scale-110' : 'text-white/40 hover:text-white/70'}`}
    >
      <div className={`${active ? 'glow-cyan drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]' : ''}`}>
        {React.cloneElement(icon as React.ReactElement, { size: 20, className: 'sm:w-6 sm:h-6' })}
      </div>
      <span className="text-[7px] sm:text-[10px] uppercase font-bold tracking-widest">{label}</span>
    </button>
  );
}
