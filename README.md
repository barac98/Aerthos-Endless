# Aerthos: Endless Ascent (v0.1.6)

**Aerthos: Endless Ascent** is a high-performance, Gothic-themed Incremental RPG built for the browser. Command the **Soul Chain**, a team of legendary Paragons, as you climb the infinite Tower of Sundering. 

---

## ⚔️ Core Gameplay Mechanics

### 1. The Soul Chain (Team System)
Assemble a team of up to **4 Paragons**. The Soul Chain is more than just a lineup; it provides a **Synergy Bonus**:
*   **+10% ATK** for every additional member in the chain (up to +30% total).
*   **Real-Time Combat**: Heroes attack automatically based on their individual Attack Speed.
*   **DPS Tracking**: Monitor your team's total damage output with a real-time, base-normalized DPS display.

### 2. Signature Abilities (Mana System)
Every hero generates **Mana (MP)** at a rate of 5 MP per second. At **100 MP**, they unleash a unique Signature Ability:
*   **Kaelen Bold**: *Throne-Breaker Strike* — Massive burst damage scaling with the current floor.
*   **Silas Vane**: *Shadow Harvest* — High-damage strike that grants a **+20% Gold Bonus** for 5 seconds.
*   **Elara**: *Luminous Rain* — A rapid volley of 10 arrows, each dealing a portion of her DPS.
*   **Oghul**: *Mountain Crusher* — A devastating slam that **stuns the Floor Timer** for 2 seconds.

### 3. Tower Progression & Biomes
*   **Endless Floors**: Monster HP scales exponentially (1.15x per floor).
*   **The 60s Rule**: You have 60 seconds to clear a floor. Failure resets the current monster's HP.
*   **Dynamic Biomes**: The environment shifts every **50 floors**, changing the background, atmosphere, and color palette (e.g., *Obsidian Depths*, *Sanguine Spires*, *Ethereal Reach*).

### 4. Hero Growth & XP
*   **Combat XP**: Defeating monsters awards XP to all active team members.
*   **Auto-Leveling**: Heroes level up automatically when their XP bar fills.
*   **Scaling**: Each level provides a **+10% multiplicative boost** to the hero's base stats.

---

## 📈 Progression Systems

### Battle Training (Temporal Upgrades)
Hone your team's efficiency for the current climb:
*   **Attack**: Increases base damage.
*   **Speed**: Increases attack frequency.
*   **Crit**: Boosts critical strike chance.
*   **Greed**: Increases gold drops from monsters.

### Runic Altar (Permanent Upgrades)
Spend **Soul Shards** (from bosses) and **Essence** (from achievements) for permanent, account-wide power:
*   **Multiplicative Bonuses**: Permanent boosts to ATK, Speed, Gold, and Shard drop rates.
*   **Stat Archive**: A dedicated screen to track the cumulative power of your Runic Altar.

---

## ⚡ Performance & Technical Excellence (v0.1.6)

Aerthos is optimized for smooth gameplay even at extreme speeds:
*   **Dual-Tick Engine**: Internal math runs at **33ms (30fps)** for precision, while UI re-renders are throttled to **100ms** to save CPU/Battery.
*   **Game Speed Toggles**: Play at **x1, x2, or x4** speed. All logic (timers, MP, animations) scales perfectly.
*   **Visual Culling**: A strict **8-number cap** on floating damage numbers prevents DOM clutter.
*   **Damage Batching**: At x4 speed, multiple hero hits are batched into single, high-impact numbers.
*   **GPU Acceleration**: Uses `translate3d` and `will-change` hints to offload animations to the GPU.
*   **Light-Mode Rendering**: Automatically disables heavy filters (shadows/blurs) at high speeds to maintain 60fps.

---

## 📱 User Experience
*   **100dvh Layout**: Guaranteed full-screen immersion on all mobile and desktop browsers.
*   **Offline Progress**: Earn Gold and XP while the game is closed (calculated up to 24 hours).
*   **Gothic Aesthetic**: Custom UI using **Inter** for readability and **JetBrains Mono** for runic data.
*   **Zero-Scroll**: A locked viewport ensures no accidental scrolling during intense combat.

---
*Built with React, Vite, Tailwind CSS, Zustand, and Framer Motion.*
