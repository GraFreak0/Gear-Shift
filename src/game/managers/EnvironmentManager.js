/**
 * EnvironmentManager — triggers dynamic in-game events that affect gameplay.
 * Events fire based on time elapsed and level.
 */

export const ENV_EVENTS = [
    {
        id: 'power_surge',
        name: '⚡ POWER SURGE!',
        desc: 'Belt speed doubles for 6 seconds!',
        color: '#ffee44',
        duration: 6000,
        minLevel: 3,
        weight: 3,
        effect: 'speed_double',
    },
    {
        id: 'bonus_wave',
        name: '🎁 BONUS WAVE!',
        desc: 'Next 3 machines give 3x score!',
        color: '#44ffcc',
        duration: 0,
        minLevel: 1,
        weight: 3,
        effect: 'score_triple',
        count: 3,
    },
    {
        id: 'earthquake',
        name: '🌍 EARTHQUAKE!',
        desc: 'Screen shakes — stay focused!',
        color: '#ffaa44',
        duration: 4000,
        minLevel: 4,
        weight: 2,
        effect: 'shake',
    },
    {
        id: 'rush_hour',
        name: '🚨 RUSH HOUR!',
        desc: 'Machines spawn faster for 8 seconds!',
        color: '#ff4444',
        duration: 8000,
        minLevel: 5,
        weight: 2,
        effect: 'spawn_fast',
    },
    {
        id: 'golden_machine',
        name: '✨ GOLDEN MACHINE!',
        desc: 'Next machine gives 5x score!',
        color: '#ffcc00',
        duration: 0,
        minLevel: 2,
        weight: 4,
        effect: 'golden',
        count: 1,
    },
    {
        id: 'repair_bonus',
        name: '🔧 REPAIR BONUS!',
        desc: 'All machines give +200 bonus points!',
        color: '#88ff88',
        duration: 10000,
        minLevel: 1,
        weight: 4,
        effect: 'repair_bonus',
    },
];

export default class EnvironmentManager {
    constructor() {
        this.activeEvent = null;
        this.speedMultiplier = 1;
        this.scoreMultiplier = 1;
        this.goldenCount = 0;
        this.repairBonus = 0;
        this.spawnFast = false;
        this.nextEventTime = 20000 + Math.random() * 15000; // first event at 20-35s
        this._onEventCallback = null;
    }

    onEvent(cb) {
        this._onEventCallback = cb;
    }

    update(elapsed, level) {
        if (elapsed < this.nextEventTime) return null;
        this.nextEventTime = elapsed + 18000 + Math.random() * 20000;
        return this.triggerRandom(level);
    }

    triggerRandom(level) {
        const available = ENV_EVENTS.filter(e => e.minLevel <= level);
        if (available.length === 0) return null;
        const total = available.reduce((s, e) => s + e.weight, 0);
        let r = Math.random() * total;
        let chosen = available[0];
        for (const e of available) { r -= e.weight; if (r <= 0) { chosen = e; break; } }
        return this.startEvent(chosen);
    }

    startEvent(eventDef) {
        this.activeEvent = { ...eventDef, startTime: Date.now() };

        switch (eventDef.effect) {
            case 'speed_double':
                this.speedMultiplier = 2;
                setTimeout(() => { this.speedMultiplier = 1; this.activeEvent = null; }, eventDef.duration);
                break;
            case 'score_triple':
                this.goldenCount = eventDef.count * 3; // 3x for 3 machines
                this.scoreMultiplier = 3;
                break;
            case 'shake':
                // handled by scene
                setTimeout(() => { this.activeEvent = null; }, eventDef.duration);
                break;
            case 'spawn_fast':
                this.spawnFast = true;
                setTimeout(() => { this.spawnFast = false; this.activeEvent = null; }, eventDef.duration);
                break;
            case 'golden':
                this.goldenCount = 1;
                this.scoreMultiplier = 5;
                break;
            case 'repair_bonus':
                this.repairBonus = 200;
                setTimeout(() => { this.repairBonus = 0; this.activeEvent = null; }, eventDef.duration);
                break;
        }

        if (this._onEventCallback) this._onEventCallback(this.activeEvent);
        return this.activeEvent;
    }

    onMachineFixed() {
        if (this.goldenCount > 0) {
            this.goldenCount--;
            if (this.goldenCount <= 0) {
                this.scoreMultiplier = 1;
            }
        }
        const bonus = this.repairBonus;
        return { scoreMultiplier: this.scoreMultiplier, repairBonus: bonus };
    }

    getSpawnInterval(base) {
        return this.spawnFast ? Math.max(base * 0.55, 900) : base;
    }

    getBeltSpeed(base) {
        return base * this.speedMultiplier;
    }
}