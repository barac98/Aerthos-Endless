import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { Paragon } from '../types';

interface CardProps {
  paragon: Paragon;
  isActive?: boolean;
  onToggle?: () => void;
  isLocked?: boolean;
  variant?: 'default' | 'small';
  lastHitTime?: number;
  mp?: number;
  level?: number;
  xp?: number;
  nextLevelXp?: number;
  biomeColor?: string;
}

export const Card: React.FC<CardProps> = ({ 
  paragon, 
  isActive, 
  onToggle, 
  isLocked, 
  variant = 'default', 
  lastHitTime, 
  mp = 0,
  level = 1,
  xp = 0,
  nextLevelXp = 100,
  biomeColor = '#00FFFF'
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const prevLevel = React.useRef(level);
  const controls = useAnimation();

  useEffect(() => {
    if (level > prevLevel.current) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 2000);
    }
    prevLevel.current = level;
  }, [level]);

  useEffect(() => {
    if (isActive && lastHitTime) {
      controls.start({
        y: [0, -10, 0],
        transition: { duration: 0.2 }
      });
    }
  }, [lastHitTime, isActive, controls]);

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  if (variant === 'small') {
    return (
      <div className="relative w-20 sm:w-28 aspect-[2/3] perspective-1000 group cursor-pointer" style={{ touchAction: 'manipulation' }}>
        <motion.div
          className="relative w-full h-full transition-all duration-500 preserve-3d"
          animate={{ 
            rotateY: isFlipped ? 180 : 0,
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <motion.div
            className="w-full h-full preserve-3d"
            animate={controls}
          >
            {/* Front */}
            <div 
              className={`absolute inset-0 backface-hidden obsidian-border rounded-md overflow-hidden flex flex-col transition-all duration-500 ${mp >= 100 ? 'ring-2 animate-pulse' : ''}`} 
              style={{ 
                boxShadow: mp >= 100 ? `0 0 15px ${biomeColor}CC` : `0 0 5px ${biomeColor}40`,
                borderColor: mp >= 100 ? biomeColor : undefined,
                outlineColor: mp >= 100 ? biomeColor : undefined
              }}
              onClick={handleFlip}
            >
              <img 
                src={paragon.portrait} 
                alt={paragon.name} 
                className="w-full h-full object-cover paragon-portrait"
                referrerPolicy="no-referrer"
              />
              
              {/* Level Badge */}
              <div className="absolute top-1 right-1 bg-black/80 px-1 rounded border border-white/10 z-10">
                <span className="text-[6px] font-bold text-luminary">Lv.{level}</span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-obsidian to-transparent p-1">
                <h3 className="text-[8px] font-bold text-white leading-tight truncate">{paragon.name}</h3>
              </div>
              
              {/* MP Bar */}
              <div className="absolute bottom-1 left-0 right-0 h-0.5 bg-black/50">
                <motion.div 
                  className="h-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${mp}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>

              {/* XP Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/50">
                <motion.div 
                  className="h-full bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.8)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${(xp / nextLevelXp) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Back */}
            <div 
              className="absolute inset-0 backface-hidden obsidian-border rounded-md bg-obsidian p-1 flex flex-col rotate-y-180"
              style={{ transform: 'rotateY(180deg)' }}
              onClick={handleFlip}
            >
              <div className="space-y-0.5 font-runic text-[6px]">
                <div className="flex justify-between border-b border-white/5">
                  <span className="text-white/50">ATK</span>
                  <span className="text-white">{paragon.baseAtk}</span>
                </div>
                <div className="flex justify-between border-b border-white/5">
                  <span className="text-white/50">SPD</span>
                  <span className="text-white">{paragon.atkSpeed}</span>
                </div>
              </div>
              <div className="mt-1">
                <p className="text-[5px] text-white/80 leading-tight italic truncate">"{paragon.ability}"</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[256px] aspect-[2/3] perspective-1000 group cursor-pointer" style={{ touchAction: 'manipulation' }}>
      <motion.div
        className="relative w-full h-full transition-all duration-500 preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* Front */}
        <div 
          className={`absolute inset-0 backface-hidden obsidian-border rounded-xl overflow-hidden flex flex-col transition-all duration-500 ${isLocked ? 'grayscale opacity-50' : ''} ${isActive ? 'ring-2' : ''} ${mp >= 100 ? 'ring-4 animate-pulse' : ''}`}
          style={{ 
            boxShadow: isActive || mp >= 100 ? `0 0 30px ${biomeColor}80` : 'none',
            borderColor: isActive || mp >= 100 ? biomeColor : undefined,
            outlineColor: isActive || mp >= 100 ? biomeColor : undefined
          }}
        >
          <div className="relative flex-1 cursor-pointer" onClick={handleFlip}>
            <img 
              src={paragon.portrait} 
              alt={paragon.name} 
              className="w-full h-full object-cover paragon-portrait"
              referrerPolicy="no-referrer"
            />

            {/* Level Badge */}
            <div className="absolute top-2 right-2 bg-black/90 px-2.5 py-1 rounded-md border-2 border-white/30 z-10 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
              <span className="text-sm font-bold text-luminary tracking-widest drop-shadow-sm">Lv.{level}</span>
            </div>

            {/* Level Up Animation Overlay */}
            <AnimatePresence>
              {showLevelUp && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1.2, y: -20 }}
                  exit={{ opacity: 0, scale: 1.5, y: -40 }}
                  className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                >
                  <div className="bg-luminary/20 backdrop-blur-sm px-4 py-2 rounded-full border border-luminary shadow-[0_0_20px_rgba(0,255,255,0.5)]">
                    <span className="text-xl font-runic font-bold text-white animate-pulse">LEVEL UP!</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-obsidian to-transparent p-4 flex flex-col items-center">
              <h3 className="text-xl font-bold text-white tracking-wider text-center">{paragon.name}</h3>
              <p className="text-xs text-luminary uppercase tracking-widest text-center">{paragon.race} • {paragon.affinity}</p>
            </div>

            {/* MP Bar */}
            <div className="absolute bottom-2 left-0 right-0 h-2 bg-black/50">
              <motion.div 
                className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                initial={{ width: 0 }}
                animate={{ width: `${mp}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            {/* XP Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/50">
              <motion.div 
                className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]"
                initial={{ width: 0 }}
                animate={{ width: `${(xp / nextLevelXp) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
          
          <div className="p-2 bg-obsidian/80 flex flex-col gap-2 border-t border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-[8px] uppercase tracking-tighter text-white/30">
                Tap card for Stats & Lore
              </span>
              {isActive && <span className="text-[10px] text-luminary font-bold animate-pulse">DEPLOYED</span>}
            </div>
            {!isLocked && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle?.();
                }}
                className={`w-full py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${
                  isActive 
                    ? 'bg-zinc-800 border-2 text-zinc-300 hover:bg-zinc-700' 
                    : 'bg-luminary/20 border border-luminary/50 text-luminary hover:bg-luminary/40'
                }`}
                style={{
                  borderColor: isActive ? paragon.color : undefined,
                  boxShadow: isActive ? `0 0 10px ${paragon.color}40` : 'none'
                }}
              >
                {isActive ? 'Recall' : 'Deploy'}
              </button>
            )}
          </div>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 backface-hidden obsidian-border rounded-xl bg-obsidian p-2 sm:p-6 flex flex-col rotate-y-180 cursor-pointer overflow-hidden"
          style={{ transform: 'rotateY(180deg)' }}
          onClick={handleFlip}
        >
          <div className="flex justify-between items-start mb-1 sm:mb-4">
            <h3 className="text-xs sm:text-lg font-bold text-luminary truncate">{paragon.name}</h3>
          </div>

          <div className="space-y-0.5 sm:space-y-3 font-runic text-[9px] sm:text-sm">
            <div className="flex justify-between border-b border-white/5 pb-0.5 sm:pb-1">
              <span className="text-white/50">ATK</span>
              <span className="text-white">{paragon.baseAtk}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-0.5 sm:pb-1">
              <span className="text-white/50">SPD</span>
              <span className="text-white">{paragon.atkSpeed}x</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-0.5 sm:pb-1">
              <span className="text-white/50">CRIT</span>
              <span className="text-white">{(paragon.critChance * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div className="mt-1 sm:mt-6">
            <h4 className="text-[7px] sm:text-[10px] uppercase text-luminary mb-0.5 sm:mb-1 tracking-widest">Special Ability</h4>
            <p className="text-[8px] sm:text-xs text-white/80 leading-tight sm:leading-relaxed italic line-clamp-3">"{paragon.ability}"</p>
          </div>

          <div className="mt-auto pt-1 sm:pt-4 border-t border-white/10">
            <p className="text-[7px] sm:text-[10px] text-white/40 leading-tight line-clamp-2">{paragon.description}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
