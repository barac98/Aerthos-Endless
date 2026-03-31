export type Race = 'Human' | 'Vampire' | 'Elf' | 'Giant';
export type Affinity = 'Luminary' | 'Shadow';

export interface Paragon {
  id: string;
  name: string;
  race: Race;
  affinity: Affinity;
  baseAtk: number;
  atkSpeed: number;
  critChance: number;
  ability: string;
  description: string;
  portrait: string;
  cost: number;
}

export interface GameState {
  gold: number;
  mp: number;
  essence: number;
  floor: number;
  highestFloor: number;
  unlockedParagons: string[]; // IDs
  activeTeam: string[]; // IDs (max 4)
  essenceMultipliers: {
    atk: number;
    gold: number;
    speed: number;
  };
  lastUpdate: number;
}

export const INITIAL_PARAGONS: Paragon[] = [
  {
    id: 'kaelen',
    name: 'Kaelen',
    race: 'Human',
    affinity: 'Luminary',
    baseAtk: 10,
    atkSpeed: 1.0,
    critChance: 0.05,
    ability: 'DMG scales with floor height.',
    description: 'A fallen knight of the Luminary Order, seeking redemption in the tower.',
    portrait: 'https://picsum.photos/seed/kaelen/1024/1024',
    cost: 0, // Starting character
  },
  {
    id: 'silas',
    name: 'Silas',
    race: 'Vampire',
    affinity: 'Shadow',
    baseAtk: 15,
    atkSpeed: 0.8,
    critChance: 0.1,
    ability: 'Deals % Max HP damage (Boss Specialist).',
    description: 'An ancient vampire who feeds on the shadows of the tower.',
    portrait: 'https://picsum.photos/seed/silas/1024/1024',
    cost: 500,
  },
  {
    id: 'elara',
    name: 'Elara',
    race: 'Elf',
    affinity: 'Luminary',
    baseAtk: 8,
    atkSpeed: 1.5,
    critChance: 0.2,
    ability: 'High Crit Chance and Attack Speed scaling.',
    description: 'A swift archer from the Silver Woods, trapped in obsidian.',
    portrait: 'https://picsum.photos/seed/elara/1024/1024',
    cost: 1200,
  },
  {
    id: 'oghul',
    name: 'Oghul',
    race: 'Giant',
    affinity: 'Luminary',
    baseAtk: 25,
    atkSpeed: 0.5,
    critChance: 0.02,
    ability: 'Massive AoE ground-slam damage.',
    description: 'A mountain-born giant whose strength shakes the tower foundations.',
    portrait: 'https://picsum.photos/seed/oghul/1024/1024',
    cost: 3000,
  },
];
