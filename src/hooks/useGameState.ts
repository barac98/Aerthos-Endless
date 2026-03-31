import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, INITIAL_PARAGONS, Paragon } from '../types';

const SAVE_KEY = 'aerthos_endless_save';

const INITIAL_STATE: GameState = {
  gold: 0,
  mp: 0,
  essence: 0,
  floor: 1,
  highestFloor: 1,
  unlockedParagons: ['kaelen'],
  activeTeam: ['kaelen'],
  essenceMultipliers: {
    atk: 1,
    gold: 1,
    speed: 1,
  },
  lastUpdate: Date.now(),
};

export function useGameState() {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_STATE, ...parsed, lastUpdate: Date.now() };
      } catch (e) {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  const [enemyHp, setEnemyHp] = useState(100);
  const [maxEnemyHp, setMaxEnemyHp] = useState(100);
  const [totalDps, setTotalDps] = useState(0);
  const [lastHitTime, setLastHitTime] = useState(0);
  const [damageNumbers, setDamageNumbers] = useState<{ id: number; value: number }[]>([]);
  
  const stateRef = useRef(state);
  stateRef.current = state;

  const save = useCallback(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(stateRef.current));
  }, []);

  // Combat Logic
  useEffect(() => {
    const interval = setInterval(() => {
      const { activeTeam, floor, essenceMultipliers } = stateRef.current;
      const team = INITIAL_PARAGONS.filter(p => activeTeam.includes(p.id));
      
      let currentTotalDmg = 0;
      team.forEach(p => {
        // Basic damage calculation
        let dmg = p.baseAtk * essenceMultipliers.atk;
        
        // Kaelen ability: DMG scales with floor height
        if (p.id === 'kaelen') {
          dmg *= (1 + floor * 0.05);
        }
        
        // Silas ability: % Max HP damage (Boss Specialist)
        if (p.id === 'silas' && floor % 10 === 0) {
          dmg += maxEnemyHp * 0.02;
        }

        // Elara: Crit scaling (simplified for idle)
        if (p.id === 'elara') {
          const crit = Math.random() < p.critChance ? 2 : 1;
          dmg *= crit;
        }

        // Oghul: AoE (simplified as flat multiplier for now)
        if (p.id === 'oghul') {
          dmg *= 1.2;
        }

        currentTotalDmg += dmg * p.atkSpeed * essenceMultipliers.speed;
      });

      setTotalDps(currentTotalDmg);
      
      if (currentTotalDmg > 0) {
        setLastHitTime(Date.now());
        setDamageNumbers(prev => [...prev.slice(-10), { id: Date.now(), value: Math.floor(currentTotalDmg) }]);
      }

      setEnemyHp(prev => {
        const next = prev - currentTotalDmg;
        if (next <= 0) {
          // Enemy Defeated
          const goldGain = Math.floor(floor * 10 * essenceMultipliers.gold);
          const mpGain = Math.floor(floor * 2);
          
          setState(s => ({
            ...s,
            gold: s.gold + goldGain,
            mp: s.mp + mpGain,
            floor: s.floor + 1,
            highestFloor: Math.max(s.highestFloor, s.floor + 1)
          }));
          
          const nextMaxHp = Math.floor(100 * Math.pow(1.15, floor));
          setMaxEnemyHp(nextMaxHp);
          return nextMaxHp;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [maxEnemyHp]);

  // Auto-save
  useEffect(() => {
    const interval = setInterval(save, 10000);
    return () => clearInterval(interval);
  }, [save]);

  const recruitParagon = (id: string) => {
    const paragon = INITIAL_PARAGONS.find(p => p.id === id);
    if (!paragon) return;
    
    setState(s => {
      if (s.gold < paragon.cost || s.unlockedParagons.includes(id)) return s;
      return {
        ...s,
        gold: s.gold - paragon.cost,
        unlockedParagons: [...s.unlockedParagons, id]
      };
    });
  };

  const toggleTeamMember = (id: string) => {
    setState(s => {
      if (!s.unlockedParagons.includes(id)) return s;
      
      const isActive = s.activeTeam.includes(id);
      if (isActive) {
        if (s.activeTeam.length <= 1) return s; // Must have at least one
        return { ...s, activeTeam: s.activeTeam.filter(tid => tid !== id) };
      } else {
        if (s.activeTeam.length >= 4) return s; // Max 4
        return { ...s, activeTeam: [...s.activeTeam, id] };
      }
    });
  };

  const sunder = () => {
    setState(s => {
      const essenceGain = Math.floor(s.highestFloor / 10);
      return {
        ...INITIAL_STATE,
        essence: s.essence + essenceGain,
        unlockedParagons: s.unlockedParagons, // Keep unlocks? Usually yes in modern idles
        essenceMultipliers: s.essenceMultipliers, // Keep multipliers
        highestFloor: s.highestFloor
      };
    });
    setEnemyHp(100);
    setMaxEnemyHp(100);
  };

  const upgradeEssence = (type: keyof GameState['essenceMultipliers']) => {
    setState(s => {
      const cost = Math.floor(10 * Math.pow(1.5, s.essenceMultipliers[type] - 1));
      if (s.essence < cost) return s;
      return {
        ...s,
        essence: s.essence - cost,
        essenceMultipliers: {
          ...s.essenceMultipliers,
          [type]: s.essenceMultipliers[type] + 0.1
        }
      };
    });
  };

  return {
    state,
    enemyHp,
    maxEnemyHp,
    totalDps,
    lastHitTime,
    damageNumbers,
    recruitParagon,
    toggleTeamMember,
    sunder,
    upgradeEssence
  };
}
