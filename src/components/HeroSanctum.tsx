import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Sword, Zap, Shield, Coins } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { INITIAL_PARAGONS, Paragon, OwnedParagon } from '../types';

interface HeroSanctumProps {
  paragonId: string;
  onClose: () => void;
}

export const HeroSanctum: React.FC<HeroSanctumProps> = ({ paragonId, onClose }) => {
  const store = useGameStore();
  const paragon = INITIAL_PARAGONS.find(p => p.id === paragonId);
  const owned = store.ownedParagons.find(op => op.id === paragonId);

  const [successEffect, setSuccessEffect] = useState<'level' | 'star' | null>(null);

  if (!paragon || !owned) return null;

  const ascendCost = Math.floor(10 * Math.pow(2, owned.starRating));
  const canAffordAscend = store.soulShards >= ascendCost && owned.starRating < 5;

  const scaledAtk = paragon.baseAtk * (1 + (owned.level - 1) * 0.1);
  const abilityPower = paragon.baseAbilityValue * (1 + (owned.starRating * 0.25));

  const handleAscend = () => {
    if (canAffordAscend) {
      store.ascendParagon(paragonId);
      setSuccessEffect('star');
      setTimeout(() => setSuccessEffect(null), 1000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#050505]/90 backdrop-blur-md select-none"
      style={{ touchAction: 'manipulation' }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-lg bg-obsidian border-2 border-luminary/50 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,255,255,0.2)]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full border border-white/10 text-white/50 hover:text-luminary transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Top: Portrait & Name */}
        <div className="relative h-64 w-full">
          <img
            src={paragon.portrait}
            alt={paragon.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent" />
          <div className="absolute bottom-4 left-6">
            <h2 className="text-4xl font-bold text-white tracking-tighter drop-shadow-lg">{paragon.name}</h2>
            <p className="text-luminary font-runic tracking-widest uppercase text-sm">{paragon.race} • {paragon.affinity}</p>
          </div>
        </div>

        {/* Center: Stats */}
        <div className="p-6 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Level & Stars */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-white/40">Growth Status</span>
              <div className="flex items-center gap-4">
                <div className={`flex flex-col transition-all duration-300 ${successEffect === 'level' ? 'scale-110' : ''}`}>
                  <span className="text-2xl font-bold text-white">Lv.{owned.level}</span>
                </div>
                <div className={`flex items-center gap-0.5 transition-all duration-300 ${successEffect === 'star' ? 'scale-110' : ''}`}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < owned.starRating ? "fill-luminary text-luminary glow-cyan" : "text-white/10"}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Scaled Stats */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-white/40">Combat Power</span>
              <div className="flex flex-col">
                <div className={`flex items-center gap-2 transition-all duration-500 ${successEffect === 'level' ? 'text-luminary drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]' : 'text-white'}`}>
                  <Sword className="w-4 h-4 text-luminary/60" />
                  <span className="text-lg font-bold">{Math.floor(scaledAtk).toLocaleString()} ATK</span>
                </div>
                <div className={`flex items-center gap-2 transition-all duration-500 ${successEffect === 'star' ? 'text-luminary drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]' : 'text-white'}`}>
                  <Zap className="w-4 h-4 text-shadow-magic/60" />
                  <span className="text-lg font-bold">{Math.floor(abilityPower).toLocaleString()} PWR</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ability Description */}
          <div className="bg-black/40 p-4 rounded-xl border border-white/5">
            <h4 className="text-xs font-bold text-luminary uppercase tracking-widest mb-1">{paragon.specialAbilityName}</h4>
            <p className="text-xs text-white/60 leading-relaxed italic">"{paragon.abilityDescription}"</p>
          </div>

          {/* Buttons & Progress */}
          <div className="flex flex-col gap-6">
            {/* XP Progress Bar */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-white/40">Experience</span>
                  <span className="text-xl font-bold text-white">LEVEL {owned.level}</span>
                </div>
                <span className="text-xs font-runic text-white/60 tracking-widest">
                  XP: {Math.floor(owned.xp).toLocaleString()} / {Math.floor(owned.nextLevelXp).toLocaleString()}
                </span>
              </div>
              <div className="h-4 bg-[#050505] rounded-full overflow-hidden border border-white/10 p-0.5">
                <motion.div 
                  className="h-full bg-[#A020F0] rounded-full shadow-[0_0_15px_rgba(160,32,240,0.6)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${(owned.xp / owned.nextLevelXp) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Ascend Button */}
            <button
              onClick={handleAscend}
              disabled={!canAffordAscend}
              className={`h-[60px] rounded-2xl border-2 flex items-center justify-between px-6 transition-all active:scale-95 ${
                canAffordAscend 
                  ? 'border-shadow-magic bg-shadow-magic/10 text-white shadow-[0_0_20px_rgba(138,43,226,0.3)]' 
                  : 'border-white/10 bg-white/5 text-white/20 grayscale'
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold uppercase tracking-widest">Ascend</span>
                <span className="text-[10px] opacity-60">
                  {owned.starRating < 5 ? `To Star ${owned.starRating + 1}` : 'Max Stars Reached'}
                </span>
              </div>
              {owned.starRating < 5 && (
                <div className="flex items-center gap-2">
                  <Shield className={`w-4 h-4 ${canAffordAscend ? 'text-shadow-magic' : 'text-red-500'}`} />
                  <span className={`text-xl font-bold font-runic ${canAffordAscend ? 'text-white' : 'text-red-500'}`}>
                    {ascendCost.toLocaleString()}
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
