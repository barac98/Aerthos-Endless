import React from 'react';
import { motion } from 'motion/react';

export const LoreScreen: React.FC = () => {
  return (
    <motion.div 
      key="lore"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
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
  );
};
