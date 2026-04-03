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

export const BIOMES = [
  { 
    name: "The Iron Crypts", 
    url: "https://picsum.photos/id/1044/1920/1080",
    color: "#4A5568"
  },
  { 
    name: "The Runic Observatory", 
    url: "https://picsum.photos/id/10/1920/1080",
    color: "#00FFFF"
  },
  { 
    name: "The Abyssal Rift", 
    url: "https://picsum.photos/id/1028/1920/1080",
    color: "#8A2BE2"
  },
  { 
    name: "The Celestial Spire", 
    url: "https://picsum.photos/id/1015/1920/1080",
    color: "#F6AD55"
  }
];
