import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Sword, Users, ShoppingCart, Sparkles, BookOpen, Coins, Zap, Shield } from 'lucide-react';
import { useGameStore } from './store/useGameStore';
import { INITIAL_PARAGONS } from './types';

// Screens
import { TowerScreen } from './components/screens/TowerScreen';
import { TrainingScreen } from './components/screens/TrainingScreen';
import { TeamScreen } from './components/screens/TeamScreen';
import { RecruitScreen } from './components/screens/RecruitScreen';
import { AltarScreen } from './components/screens/AltarScreen';
import { LoreScreen } from './components/screens/LoreScreen';
import { StatArchive } from './components/StatArchive';

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
  const [lastAttackTimes, setLastAttackTimes] = useState<Record<string, number>>({});
  const [damageNumbers, setDamageNumbers] = useState<{ id: number; value: number; color: string; isCrit?: boolean }[]>([]);
  const attackTimersRef = React.useRef<Record<string, number>>({});

  // Calculate Max HP for current floor
  useEffect(() => {
    const nextMaxHp = Math.floor(100 * Math.pow(1.15, store.currentFloor - 1));
    setMaxEnemyHp(nextMaxHp);
    setEnemyHp(nextMaxHp);
  }, [store.currentFloor]);

  // Global Game Tick
  useEffect(() => {
    if (!store.hasHydrated) {
      return;
    }

    const TICK_RATE = 100; // 100ms for smoother combat
    const interval = setInterval(() => {
      // Use getState to get the most fresh values without triggering effect re-runs
      const state = useGameStore.getState();
      const activeIds = state.activeTeam.filter((id): id is string => id !== null);
      
      // Explicitly find team members to avoid any filter issues
      const team = activeIds.map(id => INITIAL_PARAGONS.find(p => p.id === id)).filter((p): p is typeof INITIAL_PARAGONS[0] => !!p);
      
      let totalDamageThisTick = 0;
      let currentTotalDps = 0;
      const newDamageNumbers: { id: number; value: number; color: string; isCrit?: boolean }[] = [];
      const attackingIds: string[] = [];

      team.forEach(p => {
        const owned = state.ownedParagons.find(op => op.id === p.id);
        const levelMult = owned ? 1 + (owned.level - 1) * 0.1 : 1;
        
        // New Multipliers
        const temporalAtkMult = 1 + (state.temporalUpgrades.atk - 1) * 0.2;
        const permanentAtkMult = 1 + state.permanentUpgrades.atkMult * 0.1;
        const temporalSpeedMult = 1 + (state.temporalUpgrades.speed - 1) * 0.1;
        const permanentSpeedMult = 1 + state.permanentUpgrades.speedMult * 0.05;
        const temporalCritMult = (state.temporalUpgrades.crit - 1) * 0.02;
        const permanentCritMult = state.permanentUpgrades.critRate * 0.01;
        
        let dmg = p.baseAtk * levelMult * temporalAtkMult * permanentAtkMult;
        
        // Simple ability logic
        if (p.id === 'kaelen-bold') dmg *= (1 + state.currentFloor * 0.05);
        if (p.id === 'oghul') dmg *= 1.2;

        const effectiveAtkSpeed = p.atkSpeed * temporalSpeedMult * permanentSpeedMult;
        const totalCrit = p.critChance + temporalCritMult + permanentCritMult;
        
        // Calculate DPS for display
        const critDmgMult = 1 + totalCrit;
        const charDps = dmg * effectiveAtkSpeed * critDmgMult;
        currentTotalDps += charDps;

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

            // Add damage number occasionally to avoid clutter
            if (Math.random() < 0.3) {
              newDamageNumbers.push({
                id: Date.now() + Math.random(),
                value: Math.floor(finalDmg),
                color: p.color,
                isCrit
              });
            }
          }
          attackTimersRef.current[p.id] = newTimer - attacks;
        } else {
          attackTimersRef.current[p.id] = newTimer;
        }
      });

      // Apply Game Speed to DPS display
      const dpsWithSpeed = currentTotalDps * state.gameSpeed;

      if (totalDamageThisTick > 0) {
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
        const next = prev - totalDamageThisTick;
        if (next <= 0) {
          // Enemy Defeated - Schedule store updates to avoid React warning
          Promise.resolve().then(() => {
            const currentState = useGameStore.getState();
            
            // Gold Drop
            const goldGain = Math.floor(currentState.currentFloor * 10 * (1 + (currentState.permanentUpgrades.goldMult - 1) * 0.1));
            currentState.addGold(goldGain);
            
            // Soul Shard Drop
            const isBoss = currentState.currentFloor % 10 === 0;
            const shardMult = 1 + (currentState.permanentUpgrades.shardMult - 1) * 0.1;
            
            if (isBoss) {
              const bossShards = Math.floor((Math.random() * 6 + 5) * shardMult);
              currentState.addSoulShards(bossShards);
            } else if (Math.random() < 0.05) {
              const normalShards = Math.floor((Math.random() * 3 + 1) * shardMult);
              currentState.addSoulShards(normalShards);
            }

            currentState.climbFloor();
          });
          return 100; // Temporary value, will be reset by floor effect
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
            <TowerScreen 
              enemyHp={enemyHp}
              maxEnemyHp={maxEnemyHp}
              totalDps={totalDps}
              lastHitTime={lastHitTime}
              lastAttackTimes={lastAttackTimes}
              damageNumbers={damageNumbers}
              enemyImageUrl={enemyImageUrl}
            />
          )}

          {activeTab === 'training' && <TrainingScreen />}

          {activeTab === 'team' && <TeamScreen />}

          {activeTab === 'recruit' && <RecruitScreen />}

          {activeTab === 'altar' && <AltarScreen setShowArchive={setShowArchive} />}

          {activeTab === 'lore' && <LoreScreen />}
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
