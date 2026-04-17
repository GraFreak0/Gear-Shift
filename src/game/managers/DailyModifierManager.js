/**
 * DailyModifierManager — provides a rotating daily gameplay modifier seeded by date.
 */

export const DAILY_MODIFIERS = [
    { id: 'double_speed', icon: '⚡', name: 'TURBO DAY', desc: 'Belt is 50% faster — but score x2!', beltMult: 1.5, scoreMult: 2 },
    { id: 'triple_score', icon: '💰', name: 'PAYDAY', desc: 'All machines give 3x score today!', beltMult: 1, scoreMult: 3 },
    { id: 'one_life', icon: '💀', name: 'HARDCORE', desc: 'Only 1 life — can you survive?', beltMult: 1, scoreMult: 4, livesOverride: 1 },
    { id: 'no_skills', icon: '🚫', name: 'NO SKILLS', desc: 'Skills disabled — pure skill!', beltMult: 1, scoreMult: 2.5, disableSkills: true },
    { id: 'boss_rush', icon: '🤖', name: 'BOSS RUSH', desc: 'All machines are boss-tier today!', beltMult: 0.8, scoreMult: 5, bossOnly: true },
    { id: 'slow_day', icon: '🐢', name: 'CHILL DAY', desc: 'Belt is slow — enjoy the ride.', beltMult: 0.5, scoreMult: 1 },
    { id: 'chain_reaction', icon: '🔗', name: 'CHAIN REACTION', desc: 'Combos start at x2 and go higher!', beltMult: 1, scoreMult: 1, startCombo: 2 },
];

export default class DailyModifierManager {
    constructor() {
        const today = new Date().toDateString();
        const seed = this._dateSeed(today);
        this.modifier = DAILY_MODIFIERS[seed % DAILY_MODIFIERS.length];
    }

    get() {
        return this.modifier;
    }

    _dateSeed(dateStr) {
        let hash = 0;
        for (let i = 0; i < dateStr.length; i++) {
            hash = (hash * 31 + dateStr.charCodeAt(i)) | 0;
        }
        return Math.abs(hash);
    }
}