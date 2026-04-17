import { appParams } from '@/lib/app-params';
import { loadHighScore } from './IntegrityManager';

export default class LeaderboardManager {
    constructor() {
        this.storageKey = 'gearworks_local_leaderboard';
        this.usernameKey = 'gearworks_username';
        this.seedInitialData();
    }

    seedInitialData() {
        if (!localStorage.getItem(this.storageKey)) {
            const initial = [
                { username: 'TopMechanic', score: 25000, date: Date.now() },
                { username: 'GearHead99', score: 18500, date: Date.now() },
                { username: 'CrankShaft', score: 12000, date: Date.now() },
                { username: 'WrenchMaster', score: 8500, date: Date.now() },
                { username: 'BoltLock', score: 5000, date: Date.now() }
            ];
            localStorage.setItem(this.storageKey, JSON.stringify(initial));
        }
    }

    setUsername(name) {
        localStorage.setItem(this.usernameKey, name);
    }

    getUsername() {
        return localStorage.getItem(this.usernameKey) || null;
    }

    async getGlobal() {
        // Since there is no actual backend, we serve the local "competitive" list
        const local = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        return local.sort((a, b) => b.score - a.score);
    }

    async submitScore(score) {
        const username = this.getUsername() || 'Anonymous';
        let local = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        
        // Check if user already has a score on board
        const existingIdx = local.findIndex(e => e.username === username);
        if (existingIdx > -1) {
            if (score > local[existingIdx].score) {
                local[existingIdx].score = score;
                local[existingIdx].date = Date.now();
            }
        } else {
            local.push({ username, score, date: Date.now() });
        }

        local.sort((a, b) => b.score - a.score);
        localStorage.setItem(this.storageKey, JSON.stringify(local.slice(0, 20)));
        return true;
    }
}