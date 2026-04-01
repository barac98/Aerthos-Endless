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
  shardCost: number;
  color: string;
}

export interface OwnedParagon {
  id: string;
  level: number;
  xp: number;
}

export type PermanentStatId = 'atkMult' | 'goldMult' | 'shardMult' | 'essenceGain' | 'critRate' | 'speedMult';

export interface GameStoreState {
  // Resources
  gold: number;
  essence: number;
  soulShards: number;
  gems: number;
  
  // Progress
  currentFloor: number;
  highestFloor: number;
  totalResets: number;
  
  // Team & Collection
  activeTeam: (string | null)[]; // 5 slots
  ownedParagons: OwnedParagon[];
  
  // Upgrades
  temporalUpgrades: {
    atk: number;
    speed: number;
    crit: number;
  };
  permanentUpgrades: Record<PermanentStatId, number>;
  altarSlots: PermanentStatId[];
  
  // Settings & Meta
  gameSpeed: number;
  isMuted: boolean;
  lastSaved: number;
  hasHydrated: boolean;
}

export interface GameStoreActions {
  addGold: (amount: number) => void;
  addSoulShards: (amount: number) => void;
  climbFloor: () => void;
  recruitParagon: (paragonId: string) => void;
  performSunder: () => void;
  upgradeTemporal: (type: 'atk' | 'speed' | 'crit') => void;
  purchaseAltarUpgrade: (slotIndex: number) => void;
  setHasHydrated: (state: boolean) => void;
  toggleMute: () => void;
  setGameSpeed: (speed: number) => void;
  updateActiveTeam: (slotIndex: number, paragonId: string | null) => void;
}

export type GameStore = GameStoreState & GameStoreActions;

export const INITIAL_PARAGONS: Paragon[] = [
  {
    id: 'kaelen-bold',
    name: 'Kaelen Bold',
    race: 'Human',
    affinity: 'Luminary',
    baseAtk: 10,
    atkSpeed: 1.0,
    critChance: 0.05,
    ability: 'DMG scales with floor height.',
    description: 'A fallen knight of the Luminary Order, seeking redemption in the tower.',
    portrait: 'https://loremflickr.com/1024/1024/knight,fantasy/all',
    shardCost: 0, // Starting character
    color: '#00FFFF', // Cyan
  },
  {
    id: 'silas-vane',
    name: 'Silas Vane',
    race: 'Vampire',
    affinity: 'Shadow',
    baseAtk: 15,
    atkSpeed: 0.8,
    critChance: 0.1,
    ability: 'Deals % Max HP damage (Boss Specialist).',
    description: 'An ancient vampire who feeds on the shadows of the tower.',
    portrait: 'https://loremflickr.com/1024/1024/vampire,fantasy/all',
    shardCost: 50,
    color: '#FF00FF', // Magenta
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
    portrait: 'https://loremflickr.com/1024/1024/elf,archer,fantasy/all',
    shardCost: 150,
    color: '#00FF00', // Lime
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
    portrait: 'https://loremflickr.com/1024/1024/giant,monster,fantasy/all',
    shardCost: 500,
    color: '#FFA500', // Orange
  },
];
