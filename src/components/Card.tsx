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
}

export const Card: React.FC<CardProps> = ({ paragon, isActive, onToggle, isLocked, variant = 'default', lastHitTime }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const controls = useAnimation();

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
      <div className="relative w-16 sm:w-20 aspect-[2/3] perspective-1000 group cursor-pointer">
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
            <div className="absolute inset-0 backface-hidden obsidian-border rounded-md overflow-hidden flex flex-col" onClick={handleFlip}>
              <img 
                src={paragon.portrait} 
                alt={paragon.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-obsidian to-transparent p-1">
                <h3 className="text-[8px] font-bold text-white leading-tight truncate">{paragon.name}</h3>
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
    <div className="relative w-full max-w-[256px] aspect-[2/3] perspective-1000 group cursor-pointer" onClick={onToggle}>
      <motion.div
        className="relative w-full h-full transition-all duration-500 preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* Front */}
        <div className={`absolute inset-0 backface-hidden obsidian-border rounded-xl overflow-hidden flex flex-col ${isLocked ? 'grayscale opacity-50' : ''} ${isActive ? 'ring-2 ring-luminary glow-cyan' : ''}`}>
          <div className="relative flex-1 cursor-pointer" onClick={handleFlip}>
            <img 
              src={paragon.portrait} 
              alt={paragon.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-obsidian to-transparent p-4">
              <h3 className="text-xl font-bold text-white tracking-wider">{paragon.name}</h3>
              <p className="text-xs text-luminary uppercase tracking-widest">{paragon.race} • {paragon.affinity}</p>
            </div>
          </div>
          
          <div className="p-2 bg-obsidian/80 flex justify-between items-center border-t border-white/10">
            <span className="text-[10px] uppercase tracking-tighter text-white/30">
              Click image to flip
            </span>
            {isActive && <span className="text-[10px] text-luminary font-bold">ACTIVE</span>}
          </div>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 backface-hidden obsidian-border rounded-xl bg-obsidian p-6 flex flex-col rotate-y-180 cursor-pointer"
          style={{ transform: 'rotateY(180deg)' }}
          onClick={handleFlip}
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-luminary">{paragon.name}</h3>
          </div>

          <div className="space-y-3 font-runic text-sm">
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-white/50">ATK</span>
              <span className="text-white">{paragon.baseAtk}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-white/50">SPD</span>
              <span className="text-white">{paragon.atkSpeed}x</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-white/50">CRIT</span>
              <span className="text-white">{(paragon.critChance * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-[10px] uppercase text-luminary mb-1 tracking-widest">Special Ability</h4>
            <p className="text-xs text-white/80 leading-relaxed italic">"{paragon.ability}"</p>
          </div>

          <div className="mt-auto pt-4 border-t border-white/10">
            <p className="text-[10px] text-white/40 leading-tight">{paragon.description}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
