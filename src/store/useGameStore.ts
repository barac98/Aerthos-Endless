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
          activeTeam: ['silas-vane', 'kaelen-bold', null, null, null, null, null, null, null],
          ownedParagons: [
            { id: 'kaelen-bold', level: 1, xp: 0, currentHp: 150, maxHp: 150, shatteredUntil: 0 },
            { id: 'silas-vane', level: 1, xp: 0, currentHp: 100, maxHp: 100, shatteredUntil: 0 }
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
      activeTeam: [null, null, null, null, null, null, null, null, null],
      ownedParagons: [{ id: 'kaelen-bold', level: 1, xp: 0, currentHp: 150, maxHp: 150, shatteredUntil: 0 }],
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

      recruitParagon: (paragonId) => set((state) => {
        const paragon = INITIAL_PARAGONS.find(p => p.id === paragonId);
        if (!paragon || state.soulShards < paragon.shardCost) return state;
        
        const alreadyOwned = state.ownedParagons.some(p => p.id === paragonId);
        if (alreadyOwned) return state;

        return {
          soulShards: state.soulShards - paragon.shardCost,
          ownedParagons: [...state.ownedParagons, { 
            id: paragonId, 
            level: 1, 
            xp: 0, 
            currentHp: paragon.baseHp, 
            maxHp: paragon.baseHp,
            shatteredUntil: 0 
          }],
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

      setGameSpeed: (speed) => set({ gameSpeed: speed }),

      updateParagonHp: (paragonId, amount) => set((state) => {
        const slotIndex = state.activeTeam.indexOf(paragonId);
        const hpBonus = (slotIndex !== -1 && slotIndex < 3) ? 1.2 : 1.0;
        
        return {
          ownedParagons: state.ownedParagons.map(p => {
            if (p.id !== paragonId) return p;
            const effectiveMaxHp = p.maxHp * hpBonus;
            const nextHp = Math.max(0, Math.min(effectiveMaxHp, p.currentHp + amount));
            const isShattered = nextHp <= 0 && p.currentHp > 0;
            return {
              ...p,
              currentHp: nextHp,
              shatteredUntil: isShattered ? Date.now() + 10000 : p.shatteredUntil
            };
          })
        };
      }),

      respawnParagon: (paragonId) => set((state) => {
        const slotIndex = state.activeTeam.indexOf(paragonId);
        const hpBonus = (slotIndex !== -1 && slotIndex < 3) ? 1.2 : 1.0;
        
        return {
          ownedParagons: state.ownedParagons.map(p => {
            if (p.id !== paragonId) return p;
            const effectiveMaxHp = p.maxHp * hpBonus;
            return {
              ...p,
              currentHp: effectiveMaxHp * 0.5,
              shatteredUntil: 0
            };
          })
        };
      }),

      updateActiveTeam: (slotIndex, paragonId) => set((state) => {
        const newTeam = [...state.activeTeam];
        newTeam[slotIndex] = paragonId;
        return { activeTeam: newTeam };
      }),
    }),
    {
      name: 'aerthos-save-v3',
      version: 3,
      migrate: (persistedState: any, version: number) => {
        console.log(`[Aerthos] Migrating from version ${version} to 3`);
        let state = persistedState;
        
        if (version < 2) {
          state = {
            ...state,
            permanentUpgrades: {
              atkMult: state.permanentUpgrades?.atkMult || 1,
              goldMult: state.permanentUpgrades?.goldMult || 1,
              shardMult: state.permanentUpgrades?.shardMult || 1,
              essenceGain: 1,
              critRate: 1,
              speedMult: 1,
            },
            altarSlots: ['atkMult', 'goldMult', 'shardMult'],
          };
        }

        if (version < 3) {
          state = {
            ...state,
            activeTeam: Array(9).fill(null).map((_, i) => state.activeTeam?.[i] || null),
            ownedParagons: state.ownedParagons.map((p: any) => {
              const base = INITIAL_PARAGONS.find(ip => ip.id === p.id);
              return {
                ...p,
                currentHp: p.currentHp ?? base?.baseHp ?? 100,
                maxHp: p.maxHp ?? base?.baseHp ?? 100,
                shatteredUntil: p.shatteredUntil ?? 0
              };
            })
          };
        }
        
        return state;
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
