import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';
import { GameStore, INITIAL_PARAGONS, PermanentStatId } from '../types';

// Configure localforage
localforage.config({
  name: 'AerthosEndless',
  storeName: 'game_save'
});

// Environment Detection
const isDevelopment = 
  window.location.hostname === 'localhost' || 
  window.location.hostname.includes('stackblitz') || 
  window.location.hostname.includes('webcontainer') ||
  window.location.hostname.includes('run.app') ||
  window.location.hostname.includes('googleusercontent.com');

console.log(`[Aerthos] Hostname: ${window.location.hostname}`);
console.log(`[Aerthos] Persistence running in ${isDevelopment ? 'DEVELOPMENT (Mock)' : 'PRODUCTION (IndexedDB)'} mode.`);

// Mock Storage for Development
const memoryStorage: Record<string, string> = {};
const mockStorage = {
  getItem: (name: string) => {
    console.log(`[Aerthos] MockStorage: getItem(${name})`);
    // Seed data if empty
    if (!memoryStorage[name] && isDevelopment) {
      console.log(`[Aerthos] MockStorage: Seeding initial data...`);
      const seedData = {
        state: {
          gold: 1000,
          essence: 50,
          soulShards: 10,
          currentFloor: 1,
          highestFloor: 1,
          totalResets: 0,
          activeTeam: ['silas-vane', 'kaelen-bold', null, null, null],
          ownedParagons: [
            { id: 'kaelen-bold', level: 1, xp: 0, nextLevelXp: 100 },
            { id: 'silas-vane', level: 1, xp: 0, nextLevelXp: 100 }
          ],
          temporalUpgrades: { atk: 1, speed: 1, crit: 1 },
          permanentUpgrades: {
            atkMult: 0,
            goldMult: 0,
            shardMult: 0,
            essenceGain: 0,
            critRate: 0,
            speedMult: 0,
          },
          altarSlots: ['atkMult', 'goldMult', 'shardMult'],
          gameSpeed: 1,
          isMuted: false,
          lastSaved: Date.now(),
          hasHydrated: true
        },
        version: 2
      };
      memoryStorage[name] = JSON.stringify(seedData);
    }
    return memoryStorage[name] || null;
  },
  setItem: (name: string, value: string) => {
    memoryStorage[name] = value;
  },
  removeItem: (name: string) => {
    delete memoryStorage[name];
  }
};

const ALL_PERMANENT_STATS: PermanentStatId[] = ['atkMult', 'goldMult', 'shardMult', 'essenceGain', 'critRate', 'speedMult'];

const storage = createJSONStorage(() => isDevelopment ? mockStorage : ({
  getItem: async (name) => {
    const value = await localforage.getItem<string>(name);
    return value;
  },
  setItem: async (name, value) => {
    await localforage.setItem(name, value);
  },
  removeItem: async (name) => {
    await localforage.removeItem(name);
  },
}));

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial State
      gold: 0,
      essence: 0,
      soulShards: 0,
      gems: 0,
      currentFloor: 1,
      highestFloor: 1,
      totalResets: 0,
      activeTeam: [null, null, null, null, null],
      ownedParagons: [{ id: 'kaelen-bold', level: 1, xp: 0, nextLevelXp: 100 }],
      temporalUpgrades: { atk: 1, speed: 1, crit: 1 },
      permanentUpgrades: {
        atkMult: 1,
        goldMult: 1,
        shardMult: 1,
        essenceGain: 1,
        critRate: 1,
        speedMult: 1,
      },
      altarSlots: ['atkMult', 'goldMult', 'shardMult'],
      gameSpeed: 1,
      autoProgress: true,
      isMuted: false,
      lastSaved: Date.now(),
      hasHydrated: false,

      // Actions
      setHasHydrated: (state) => set({ hasHydrated: state }),
      
      addGold: (amount) => set((state) => ({ 
        gold: state.gold + amount,
        lastSaved: Date.now() 
      })),

      addSoulShards: (amount) => set((state) => ({
        soulShards: state.soulShards + amount,
        lastSaved: Date.now()
      })),

      climbFloor: () => set((state) => {
        const nextFloor = state.currentFloor + 1;
        return {
          currentFloor: nextFloor,
          highestFloor: Math.max(state.highestFloor, nextFloor),
          lastSaved: Date.now()
        };
      }),

      descendFloor: () => set((state) => {
        if (state.currentFloor <= 1) return state;
        return {
          currentFloor: state.currentFloor - 1,
          autoProgress: false, // Automatically disable auto-progress when farming previous floors
          lastSaved: Date.now()
        };
      }),

      recruitParagon: (paragonId) => set((state) => {
        const paragon = INITIAL_PARAGONS.find(p => p.id === paragonId);
        if (!paragon || state.soulShards < paragon.shardCost) return state;
        
        const alreadyOwned = state.ownedParagons.some(p => p.id === paragonId);
        if (alreadyOwned) return state;

        return {
          soulShards: state.soulShards - paragon.shardCost,
          ownedParagons: [...state.ownedParagons, { id: paragonId, level: 1, xp: 0, nextLevelXp: 100 }],
          lastSaved: Date.now()
        };
      }),

      performSunder: () => set((state) => {
        const baseEssence = Math.floor(state.currentFloor / 10);
        const essenceMult = 1 + state.permanentUpgrades.essenceGain * 0.1;
        const totalEssence = Math.floor(baseEssence * essenceMult);
        
        return {
          gold: 0,
          currentFloor: 1,
          essence: state.essence + totalEssence,
          totalResets: state.totalResets + 1,
          temporalUpgrades: { atk: 1, speed: 1, crit: 1 }, // Wipe temporal power
          lastSaved: Date.now()
        };
      }),

      upgradeTemporal: (type) => set((state) => {
        const cost = Math.floor(50 * Math.pow(1.3, state.temporalUpgrades[type] - 1));
        if (state.gold < cost) return state;
        
        return {
          gold: state.gold - cost,
          temporalUpgrades: {
            ...state.temporalUpgrades,
            [type]: state.temporalUpgrades[type] + 1
          },
          lastSaved: Date.now()
        };
      }),

      purchaseAltarUpgrade: (slotIndex) => set((state) => {
        const statId = state.altarSlots[slotIndex];
        if (!statId) return state;

        // Cost scales based on total level of all permanent upgrades
        const totalLevels = Object.values(state.permanentUpgrades).reduce((a, b) => a + b, 0);
        const cost = Math.floor(5 * Math.pow(1.5, totalLevels));
        
        if (state.essence < cost) return state;

        // 1. Increase level
        const nextUpgrades = {
          ...state.permanentUpgrades,
          [statId]: state.permanentUpgrades[statId] + 1
        };

        // 2. Replace slot with new random stat not in other slots
        const otherSlots = state.altarSlots.filter((_, i) => i !== slotIndex);
        const availableStats = ALL_PERMANENT_STATS.filter(id => !otherSlots.includes(id));
        const nextStatId = availableStats[Math.floor(Math.random() * availableStats.length)];
        
        const nextSlots = [...state.altarSlots];
        nextSlots[slotIndex] = nextStatId;

        return {
          essence: state.essence - cost,
          permanentUpgrades: nextUpgrades,
          altarSlots: nextSlots,
          lastSaved: Date.now()
        };
      }),

      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

      toggleAutoProgress: () => set((state) => ({ autoProgress: !state.autoProgress })),

      setGameSpeed: (speed) => set({ gameSpeed: speed }),

      updateActiveTeam: (slotIndex, paragonId) => set((state) => {
        const newTeam = [...state.activeTeam];
        newTeam[slotIndex] = paragonId;
        return { activeTeam: newTeam };
      }),

      addXpToTeam: (amount) => set((state) => {
        const activeIds = state.activeTeam.filter(id => id !== null) as string[];
        if (activeIds.length === 0) return state;

        const nextOwned = state.ownedParagons.map(p => {
          if (!activeIds.includes(p.id)) return p;

          let newXp = p.xp + amount;
          let newLevel = p.level;
          let nextReq = p.nextLevelXp;

          // Check for level ups (can be multiple if amount is large)
          while (newXp >= nextReq) {
            newXp -= nextReq;
            newLevel++;
            nextReq = Math.floor(100 * Math.pow(1.5, newLevel - 1));
          }

          return {
            ...p,
            xp: newXp,
            level: newLevel,
            nextLevelXp: nextReq
          };
        });

        return {
          ownedParagons: nextOwned,
          lastSaved: Date.now()
        };
      }),
    }),
    {
      name: 'aerthos-save-v2',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        console.log(`[Aerthos] Migrating from version ${version} to 2`);
        
        let nextState = { ...persistedState };

        // Ensure ownedParagons have XP fields
        if (nextState.ownedParagons) {
          nextState.ownedParagons = nextState.ownedParagons.map((p: any) => ({
            ...p,
            level: p.level || 1,
            xp: p.xp || 0,
            nextLevelXp: p.nextLevelXp || Math.floor(100 * Math.pow(1.5, (p.level || 1) - 1))
          }));
        }

        if (version < 2) {
          nextState = {
            ...nextState,
            permanentUpgrades: {
              atkMult: nextState.permanentUpgrades?.atkMult || 1,
              goldMult: nextState.permanentUpgrades?.goldMult || 1,
              shardMult: nextState.permanentUpgrades?.shardMult || 1,
              essenceGain: 1,
              critRate: 1,
              speedMult: 1,
            },
            altarSlots: ['atkMult', 'goldMult', 'shardMult'],
          };
        }
        return nextState;
      },
      storage,
      onRehydrateStorage: (state) => {
        return () => {
          state?.setHasHydrated(true);
        };
      },
    }
  )
);
