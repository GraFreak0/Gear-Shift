/**
 * UpgradeManager — manages permanent upgrades purchasable with XP between runs.
 */

export const UPGRADES = [
    { id: 'extra_life', icon: '❤', name: 'Extra Life', desc: 'Start with +1 life', cost: 200, maxLevel: 2, effect: 'startLives' },
    { id: 'slow_belt', icon: '🐢', name: 'Easy Belt', desc: 'Belt starts 15% slower', cost: 300, maxLevel: 3, effect: 'beltSlowPct' },
    { id: 'combo_keep', icon: '🔥', name: 'Combo Guard', desc: 'Wrong parts only halve combo drop', cost: 400, maxLevel: 1, effect: 'comboGuard' },
    { id: 'skill_recharge', icon: '⚡', name: 'Quick Recharge', desc: 'Skills recharge 20% faster', cost: 500, maxLevel: 3, effect: 'skillSpeed' },
    { id: 'score_boost', icon: '💰', name: 'Score Boost', desc: '+10% score per level', cost: 350, maxLevel: 5, effect: 'scorePct' },
];

export default class UpgradeManager {
    constructor() {
        const saved = this._load();
        this.levels = saved.levels || {};
        this.totalXP = saved.totalXP || 0;
    }

    getLevel(id) {
        return this.levels[id] || 0;
    }

    canAfford(id, totalXP) {
        const upg = UPGRADES.find(u => u.id === id);
        if (!upg) return false;
        const lvl = this.getLevel(id);
        if (lvl >= upg.maxLevel) return false;
        return totalXP >= upg.cost * (lvl + 1);
    }

    purchase(id, totalXP) {
        if (!this.canAfford(id, totalXP)) return false;
        const upg = UPGRADES.find(u => u.id === id);
        const cost = upg.cost * (this.getLevel(id) + 1);
        this.levels[id] = (this.levels[id] || 0) + 1;
        this._save();
        return cost;
    }

    // Returns applied modifier values for the GameScene
    getModifiers() {
        return {
            startLives: this.getLevel('extra_life'),
            beltSlowPct: this.getLevel('slow_belt') * 0.15,
            comboGuard: this.getLevel('combo_keep') > 0,
            skillSpeedBonus: this.getLevel('skill_recharge') * 0.2,
            scorePctBonus: this.getLevel('score_boost') * 0.1,
        };
    }

    addXP(xp) {
        this.totalXP += xp;
        this._save();
    }

    _load() {
        try { return JSON.parse(localStorage.getItem('gearworks_upgrades') || '{}'); } catch { return {}; }
    }

    _save() {
        localStorage.setItem('gearworks_upgrades', JSON.stringify({ levels: this.levels, totalXP: this.totalXP }));
    }
}