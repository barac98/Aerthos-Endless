import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, Clock } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

export const NewVersionModal: React.FC = () => {
  const updateAvailable = useGameStore(state => state.updateAvailable);
  const setUpdateAvailable = useGameStore(state => state.setUpdateAvailable);

  const handleReload = () => {
    // Force reload as requested by user
    // Note: reload(true) is deprecated but specifically requested
    // @ts-ignore
    window.location.reload(true);
  };

  return (
    <AnimatePresence>
      {updateAvailable && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              boxShadow: [
                "0 0 20px rgba(0,255,255,0.2)",
                "0 0 40px rgba(0,255,255,0.4)",
                "0 0 20px rgba(0,255,255,0.2)"
              ]
            }}
            transition={{
              boxShadow: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              },
              duration: 0.4
            }}
            className="w-full max-w-md bg-[#050505] border-2 border-luminary/50 rounded-2xl p-8 flex flex-col items-center text-center gap-6 relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-luminary/10 blur-[60px] rounded-full" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-shadow-magic/10 blur-[60px] rounded-full" />

            <div className="w-16 h-16 rounded-full bg-luminary/10 flex items-center justify-center border border-luminary/30">
              <Sparkles className="w-8 h-8 text-luminary animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-runic font-bold text-luminary tracking-widest uppercase">A New Rift Has Opened</h2>
              <p className="text-white/70 text-sm uppercase tracking-widest leading-relaxed">
                Version [Latest] is ready for deployment. Ascend to the latest rift for enhanced stability and new powers.
              </p>
            </div>

            <div className="flex flex-col w-full gap-3">
              <button
                onClick={handleReload}
                className="w-full py-4 bg-luminary text-black font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-white transition-colors shadow-[0_0_20px_rgba(0,255,255,0.3)]"
              >
                <RefreshCw className="w-5 h-5" />
                <span>RELOAD & ASCEND</span>
              </button>
              
              <button
                onClick={() => setUpdateAvailable(false)}
                className="w-full py-3 bg-white/5 text-white/40 font-bold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                <span>LATER</span>
              </button>
            </div>

            <p className="text-[10px] text-white/20 uppercase tracking-[0.3em]">Your progress is safe in the soul-chain</p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
