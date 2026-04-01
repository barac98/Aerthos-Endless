import React from 'react';
import { Sword, Coins, Shield, Sparkles, Zap } from 'lucide-react';
import { PermanentStatId } from './types';

export const STAT_METADATA: Record<PermanentStatId, { name: string; icon: React.ReactNode; description: string; bonusText: (lvl: number) => string }> = {
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
