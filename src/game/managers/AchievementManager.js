/**
 * AchievementManager — tracks and awards in-game achievement badges.
 */

export const ACHIEVEMENTS = [
    { id: 'speed_demon', icon: '⚡', name: 'Speed Demon', desc: 'Fix 5 machines in 10 seconds', check: (s) => s.recentFixes >= 5 },
    { id: 'flawless', icon: '✨', name: 'Flawless', desc: 'Fix a machine with no wrong parts', check: (s) => s.lastMachinePerfect },
    { id: 'combo_king', icon: '👑', name: 'Combo King', desc: 'Reach a x8 combo', check: (s) => s.combo >= 8 },
    { id: 'survivor', icon: '💀', name: 'Survivor', desc: 'Reach level 10', check: (s) => s.level >= 10 },
    { id: 'centurion', icon: '💯', name: 'Centurion', desc: 'Fix 100 machines total', check: (s) => s.machinesFixed >= 100 },
    { id: 'streak_master', icon: '🔥', name: 'Streak Master', desc: 'Get a 15-machine streak', check: (s) => s.streak >= 15 },
    { id: 'high_score_1k', icon: '🏅', name: 'Millwright', desc: 'Score 1,000 points in one game', check: (s) => s.score >= 1000 },
    { id: 'high_score_5k', icon: '🥈', name: 'Engineer', desc: 'Score 5,000 points in one game', check: (s) => s.score >= 5000 },
    { id: 'high_score_10k', icon: '🥇', name: 'Master Engineer', desc: 'Score 10,000 points in one game', check: (s) => s.score >= 10000 },
    { id: 'boss_slayer', icon: '🤖', name: 'Boss Slayer', desc: 'Fix a BOSS machine', check: (s) => s.bossFixed },
    { id: 'daily_done', icon: '🎯', name: 'Daily Grinder', desc: 'Complete the daily challenge', check: (s) => s.dailyCompleted },
];

export default class AchievementManager {
    constructor() {
        const saved = this._load();
        this.unlocked = new Set(saved);
        this._newlyUnlocked = [];
        this._fixTimes = []; // timestamps of recent fixes
    }

    check(stats) {
        this._fixTimes = this._fixTimes.filter(t => Date.now() - t < 10000);
        stats.recentFixes = this._fixTimes.length;

        const newOnes = [];
        for (const ach of ACHIEVEMENTS) {
            if (!this.unlocked.has(ach.id) && ach.check(stats)) {
                this.unlocked.add(ach.id);
                newOnes.push(ach);
            }
        }
        if (newOnes.length > 0) {
            this._save();
            this._newlyUnlocked.push(...newOnes);
        }
        return newOnes;
    }

    recordFix() {
        this._fixTimes.push(Date.now());
    }

    popNew() {
        return this._newlyUnlocked.splice(0);
    }

    getAll() {
        return ACHIEVEMENTS.map(a => ({ ...a, earned: this.unlocked.has(a.id) }));
    }

    _load() {
        try { return JSON.parse(localStorage.getItem('gearworks_achievements') || '[]'); } catch { return []; }
    }

    _save() {
        localStorage.setItem('gearworks_achievements', JSON.stringify([...this.unlocked]));
    }
}