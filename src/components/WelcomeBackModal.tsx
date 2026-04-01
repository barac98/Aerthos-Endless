import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Coins, Sword, Clock, X } from 'lucide-react';

interface WelcomeBackModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewards: {
    gold: number;
    xp: number;
    kills: number;
    timeAway: number;
  } | null;
}

export const WelcomeBackModal: React.FC<WelcomeBackModalProps> = ({ isOpen, onClose, rewards }) => {
  if (!rewards) return null;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md obsidian-border bg-obsidian rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,255,255,0.2)]"
          >
            {/* Header */}
            <div className="relative h-32 flex items-center justify-center bg-gradient-to-b from-luminary/20 to-transparent">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
              </div>
              <div className="relative z-10 text-center">
                <motion.div
                  initial={{ rotate: -10, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                >
                  <Sparkles className="w-12 h-12 text-luminary mx-auto mb-2 glow-cyan" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white tracking-widest uppercase">Welcome Back!</h2>
              </div>
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-center gap-2 text-white/60 font-runic text-sm">
                <Clock className="w-4 h-4" />
                <span>You were gone for {formatTime(rewards.timeAway)}</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                      <Sword className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Monsters Slain</p>
                      <p className="text-lg font-bold text-white">{rewards.kills.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                      <Coins className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Gold Earned</p>
                      <p className="text-lg font-bold text-yellow-500">{rewards.gold.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Hero XP Earned</p>
                      <p className="text-lg font-bold text-purple-500">{rewards.xp.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-center text-white/30 italic">
                Offline progress is calculated at 70% efficiency.
              </p>

              <button
                onClick={onClose}
                className="w-full py-4 bg-luminary text-obsidian font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all glow-cyan uppercase tracking-widest"
              >
                Claim Rewards
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
