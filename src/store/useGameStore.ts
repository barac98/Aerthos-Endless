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
          activeTeam: ['silas-vane', 'kaelen-bold', null, null],
          ownedParagons: [
            { id: 'kaelen-bold', level: 1, xp: 0, nextLevelXp: 100 },
            { id: 'silas-vane', level: 1, xp: 0, nextLevelXp: 100 }
          ],
          temporalUpgrades: { atk: 1, speed: 1, crit: 1, gold: 1 },
          permanentUpgrades: {
            atkMult: 0,
            goldMult: 0,
            shardMult: 0,
            essenceGain: 0,
            critRate: 0,
            speedMult: 0,
          },
          altarSlots: ['atkMult', 'goldMult', 'shardMult', 'essenceGain', 'critRate', 'speedMult'],
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
      activeTeam: ['kaelen-bold', null, null, null],
      ownedParagons: [{ id: 'kaelen-bold', level: 1, xp: 0, nextLevelXp: 100 }],
      temporalUpgrades: { atk: 1, speed: 1, crit: 1, gold: 1 },
      permanentUpgrades: {
        atkMult: 1,
        goldMult: 1,
        shardMult: 1,
        essenceGain: 1,
        critRate: 1,
        speedMult: 1,
      },
      altarSlots: ['atkMult', 'goldMult', 'shardMult', 'essenceGain', 'critRate', 'speedMult'],
      gameSpeed: 1,
      autoProgress: true,
      isMuted: false,
      lastSaved: Date.now(),
      lastLogout: Date.now(),
      hasHydrated: false,
      bossDropSuccess: null,
      lastBossShardReward: 0,
      totalBossShardsCollected: 0,
      lastEnemyRewards: null,

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
          temporalUpgrades: { atk: 1, speed: 1, crit: 1, gold: 1 }, // Wipe temporal power
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

        // Cost doubles for every upgrade in that specific slot
        const currentLevel = state.permanentUpgrades[statId];
        const cost = Math.floor(5 * Math.pow(2, currentLevel - 1));
        
        if (state.essence < cost) return state;

        // 1. Increase level
        const nextUpgrades = {
          ...state.permanentUpgrades,
          [statId]: state.permanentUpgrades[statId] + 1
        };

        return {
          essence: state.essence - cost,
          permanentUpgrades: nextUpgrades,
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

      calculateOfflineProgress: () => {
        const state = get();
        const now = Date.now();
        const secondsOffline = (now - state.lastLogout) / 1000;

        if (secondsOffline < 60) return null;

        // 1. Calculate Team DPS
        const activeIds = state.activeTeam.filter((id): id is string => id !== null);
        const team = activeIds.map(id => INITIAL_PARAGONS.find(p => p.id === id)).filter((p): p is typeof INITIAL_PARAGONS[0] => !!p);
        
        // Soul Chain: +10% ATK per additional member (2 members = 10%, 3 = 20%, 4 = 30%)
        const soulChainMult = 1 + (activeIds.length - 1) * 0.1;

        let currentTotalDps = 0;
        team.forEach(p => {
          const owned = state.ownedParagons.find(op => op.id === p.id);
          const levelMult = owned ? 1 + (owned.level - 1) * 0.1 : 1;
          const temporalAtkMult = 1 + state.temporalUpgrades.atk * 0.1;
          const permanentAtkMult = 1 + state.permanentUpgrades.atkMult * 0.1;
          const temporalSpeedMult = 1 + state.temporalUpgrades.speed * 0.05;
          const permanentSpeedMult = 1 + state.permanentUpgrades.speedMult * 0.05;
          const temporalCritMult = state.temporalUpgrades.crit * 0.01;
          const permanentCritMult = state.permanentUpgrades.critRate * 0.01;
          
          let dmg = p.baseAtk * levelMult * temporalAtkMult * permanentAtkMult * soulChainMult;
          if (p.id === 'kaelen-bold') dmg *= (1 + state.currentFloor * 0.05);
          if (p.id === 'oghul') dmg *= 1.2;

          const effectiveAtkSpeed = p.atkSpeed * temporalSpeedMult * permanentSpeedMult;
          const totalCrit = p.critChance + temporalCritMult + permanentCritMult;
          const critDmgMult = 1 + totalCrit;
          const charDps = dmg * effectiveAtkSpeed * critDmgMult;
          currentTotalDps += charDps;
        });

        if (currentTotalDps <= 0) return null;

        // 2. Monster HP
        const monsterHP = Math.floor(100 * Math.pow(1.15, state.currentFloor - 1));
        
        // 3. TTK
        const TTK = Math.max(0.5, monsterHP / currentTotalDps);
        
        // 4. Total Kills (Capped at 12 hours)
        const maxSeconds = 12 * 60 * 60;
        const effectiveSeconds = Math.min(secondsOffline, maxSeconds);
        const totalKills = Math.floor(effectiveSeconds / TTK);

        if (totalKills <= 0) return null;

        // 5. Rewards
        const temporalGoldMult = 1 + state.temporalUpgrades.gold * 0.1;
        const baseGold = state.currentFloor * 10 * (1 + state.permanentUpgrades.goldMult * 0.1) * temporalGoldMult;
        const baseXP = 5; // Normal monster XP

        const efficiency = 0.7;
        const totalGold = Math.floor(totalKills * baseGold * efficiency);
        const totalXP = Math.floor(totalKills * baseXP * efficiency);

        return {
          gold: totalGold,
          xp: totalXP,
          kills: totalKills,
          timeAway: secondsOffline
        };
      },

      claimOfflineRewards: (gold, xp) => {
        get().addGold(gold);
        get().addXpToTeam(xp);
      },

      resetBossDropFlag: () => set({ bossDropSuccess: null }),

      defeatEnemy: (goldMultiplier = 1) => set((state) => {
        const isBoss = state.currentFloor % 10 === 0;
        
        // 1. Gold Drop
        const temporalGoldMult = 1 + state.temporalUpgrades.gold * 0.1;
        const goldGain = Math.floor(state.currentFloor * 10 * (1 + state.permanentUpgrades.goldMult * 0.1) * temporalGoldMult * goldMultiplier);
        
        // 2. XP Distribution
        const xpGain = isBoss ? 50 : 5;
        
        // 3. Shard Drop Logic
        let shardReward = 0;
        let bossDropSuccess = null;
        let totalBossShardsCollected = state.totalBossShardsCollected;

        if (isBoss) {
          const roll = Math.random();
          if (roll < 0.3) {
            shardReward = Math.floor(state.currentFloor / 10);
            bossDropSuccess = true;
            totalBossShardsCollected += shardReward;
          } else {
            bossDropSuccess = false;
          }
        } else if (Math.random() < 0.05) {
          // Normal monster shard drop (keep existing logic or update?)
          // User didn't specify changing normal drops, but let's keep it for consistency
          const shardMult = 1 + (state.permanentUpgrades.shardMult - 1) * 0.1;
          shardReward = Math.floor((Math.random() * 3 + 1) * shardMult);
        }

        // Apply rewards (using nested set or just returning object)
        // We need to trigger addXpToTeam logic too.
        // Since we are inside set, we can't easily call other actions that use set.
        // But we can just inline the logic or use get() if we were outside.
        // Let's inline the XP logic for simplicity or call it after.
        
        // Actually, let's just return the new state for resources and floor.
        // For XP, we'll need to do the same mapping.
        
        const activeIds = state.activeTeam.filter(id => id !== null) as string[];
        const nextOwned = state.ownedParagons.map(p => {
          if (!activeIds.includes(p.id)) return p;
          let newXp = p.xp + xpGain;
          let newLevel = p.level;
          let nextReq = p.nextLevelXp;
          while (newXp >= nextReq) {
            newXp -= nextReq;
            newLevel++;
            nextReq = Math.floor(100 * Math.pow(1.5, newLevel - 1));
          }
          return { ...p, xp: newXp, level: newLevel, nextLevelXp: nextReq };
        });

        const nextFloor = state.autoProgress ? state.currentFloor + 1 : state.currentFloor;
        const potentialHighest = state.currentFloor + 1;

        return {
          gold: state.gold + goldGain,
          soulShards: state.soulShards + shardReward,
          ownedParagons: nextOwned,
          currentFloor: nextFloor,
          highestFloor: Math.max(state.highestFloor, potentialHighest),
          bossDropSuccess,
          lastBossShardReward: shardReward,
          totalBossShardsCollected,
          lastEnemyRewards: {
            gold: goldGain,
            xp: xpGain,
            shards: shardReward,
            timestamp: Date.now()
          },
          lastSaved: Date.now()
        };
      }),
    }),
    {
      name: 'aerthos-save-v2',
      version: 2,
      partialize: (state) => {
        const { ...rest } = state;
        return { ...rest, lastLogout: Date.now() };
      },
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
            altarSlots: ['atkMult', 'goldMult', 'shardMult', 'essenceGain', 'critRate', 'speedMult'],
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
