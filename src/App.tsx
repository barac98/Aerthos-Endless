import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Users, ShoppingCart, Sparkles, BookOpen, Coins, Zap, Shield } from 'lucide-react';
import { useGameState } from './hooks/useGameState';
import { INITIAL_PARAGONS } from './types';
import { Card } from './components/Card';

type Tab = 'tower' | 'team' | 'recruit' | 'altar' | 'lore';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('tower');
  const { 
    state, 
    enemyHp, 
    maxEnemyHp, 
    totalDps,
    lastHitTime,
    damageNumbers,
    recruitParagon, 
    toggleTeamMember, 
    sunder, 
    upgradeEssence 
  } = useGameState();

  const activeTeamParagons = INITIAL_PARAGONS.filter(p => state.activeTeam.includes(p.id));
  const unlockedParagons = INITIAL_PARAGONS.filter(p => state.unlockedParagons.includes(p.id));

  return (
    <div className="h-screen flex flex-col bg-obsidian text-white font-gothic overflow-hidden">
      {/* Header: Resources */}
      <header className="h-auto min-h-16 border-b border-white/10 bg-black/50 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between px-4 py-2 sm:py-0 gap-2 sm:gap-0 z-50">
        <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto w-full sm:w-auto no-scrollbar py-1">
          <div className="flex items-center gap-2 shrink-0">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-xs sm:text-sm font-runic font-bold">{state.gold.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Zap className="w-4 h-4 text-luminary" />
            <span className="text-xs sm:text-sm font-runic font-bold">{state.mp.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Sparkles className="w-4 h-4 text-shadow-magic" />
            <span className="text-xs sm:text-sm font-runic font-bold">{state.essence.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="text-center order-first sm:order-none">
          <h1 className="text-sm sm:text-lg font-bold tracking-[0.2em] sm:tracking-[0.3em] text-white uppercase">Aerthos Endless</h1>
          <p className="text-[8px] sm:text-[10px] text-luminary tracking-widest uppercase">Floor {state.floor}</p>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-white/50 uppercase">Highest Floor</p>
            <p className="text-xs font-runic">{state.highestFloor}</p>
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
              className="h-full flex flex-col items-center justify-center gap-12"
            >
              {/* Enemy Section */}
              <div className="relative flex flex-col items-center w-full max-w-md">
                <div className="w-48 h-48 sm:w-64 sm:h-64 relative mb-4">
                  <div className="absolute inset-0 bg-shadow-magic/20 blur-3xl rounded-full animate-pulse" />
                  <motion.img 
                    key={`enemy-${state.floor}-${lastHitTime}`}
                    initial={{ x: 0, filter: 'brightness(1)' }}
                    animate={{ 
                      x: [0, -5, 5, -5, 5, 0],
                      filter: ['brightness(1)', 'brightness(2) contrast(1.5)', 'brightness(1)']
                    }}
                    transition={{ duration: 0.2 }}
                    src={`https://picsum.photos/seed/enemy-${state.floor}/512/512`} 
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
                        isActive={state.activeTeam.includes(p.id)}
                        lastHitTime={lastHitTime}
                      />
                    </motion.div>
                    <div className="flex items-center gap-1">
                      {state.activeTeam.includes(p.id) && <div className="w-1 h-1 rounded-full bg-luminary glow-cyan" />}
                      <span className="text-[8px] sm:text-[10px] uppercase tracking-widest text-white/70">{p.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'team' && (
            <motion.div 
              key="team"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center"
            >
              {INITIAL_PARAGONS.filter(p => state.unlockedParagons.includes(p.id)).map(p => (
                <Card 
                  key={p.id} 
                  paragon={p} 
                  isActive={state.activeTeam.includes(p.id)}
                  onToggle={() => toggleTeamMember(p.id)}
                />
              ))}
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
                const isUnlocked = state.unlockedParagons.includes(p.id);
                return (
                  <div key={p.id} className="flex flex-col items-center gap-4">
                    <Card paragon={p} isLocked={!isUnlocked} />
                    {!isUnlocked && (
                      <button 
                        onClick={() => recruitParagon(p.id)}
                        disabled={state.gold < p.cost}
                        className={`px-6 py-2 rounded-full border transition-all ${
                          state.gold >= p.cost 
                            ? 'border-luminary text-luminary hover:bg-luminary hover:text-obsidian glow-cyan' 
                            : 'border-white/20 text-white/20 cursor-not-allowed'
                        }`}
                      >
                        Recruit: {p.cost.toLocaleString()} Gold
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
                <h2 className="text-3xl font-bold text-shadow-magic mb-4 tracking-widest uppercase">Celestial Altar</h2>
                <p className="text-white/60 italic">"Sunder your progress to claim the Essence of the Tower."</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                <div className="p-6 obsidian-border rounded-xl bg-white/5 flex flex-col items-center gap-4">
                  <Sword className="w-8 h-8 text-red-500" />
                  <h3 className="text-sm font-bold uppercase">Attack Power</h3>
                  <p className="text-xs text-white/50">Current: {state.essenceMultipliers.atk.toFixed(1)}x</p>
                  <button 
                    onClick={() => upgradeEssence('atk')}
                    className="w-full py-2 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors"
                  >
                    Upgrade (10 Essence)
                  </button>
                </div>
                <div className="p-6 obsidian-border rounded-xl bg-white/5 flex flex-col items-center gap-4">
                  <Coins className="w-8 h-8 text-yellow-500" />
                  <h3 className="text-sm font-bold uppercase">Gold Gain</h3>
                  <p className="text-xs text-white/50">Current: {state.essenceMultipliers.gold.toFixed(1)}x</p>
                  <button 
                    onClick={() => upgradeEssence('gold')}
                    className="w-full py-2 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors"
                  >
                    Upgrade (10 Essence)
                  </button>
                </div>
                <div className="p-6 obsidian-border rounded-xl bg-white/5 flex flex-col items-center gap-4">
                  <Zap className="w-8 h-8 text-luminary" />
                  <h3 className="text-sm font-bold uppercase">Attack Speed</h3>
                  <p className="text-xs text-white/50">Current: {state.essenceMultipliers.speed.toFixed(1)}x</p>
                  <button 
                    onClick={() => upgradeEssence('speed')}
                    className="w-full py-2 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors"
                  >
                    Upgrade (10 Essence)
                  </button>
                </div>
              </div>

              <button 
                onClick={sunder}
                className="px-12 py-4 bg-shadow-magic text-white font-bold rounded-full hover:scale-105 transition-transform glow-purple uppercase tracking-[0.2em]"
              >
                Perform Sundering Reset
                <span className="block text-[10px] font-normal opacity-70 mt-1">
                  Gain {Math.floor(state.highestFloor / 10)} Essence
                </span>
              </button>
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
      </main>

      {/* Footer: Navigation */}
      <footer className="h-16 sm:h-20 border-t border-white/10 bg-black/80 backdrop-blur-xl flex items-center justify-around px-2 sm:px-4 z-50">
        <NavButton active={activeTab === 'tower'} onClick={() => setActiveTab('tower')} icon={<Sword />} label="Tower" />
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
