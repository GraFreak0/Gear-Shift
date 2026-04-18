import { apiClient } from '@/api/apiClient';
import { appParams } from '@/lib/app-params';

export default class LeaderboardManager {
    constructor() {
        this.storageKey = 'gearworks_local_leaderboard';
        this.usernameKey = 'gearworks_username';
        this.apiEnabled = !!appParams.appBaseUrl;
        this.seedInitialData();
    }

    seedInitialData() {
        if (!localStorage.getItem(this.storageKey)) {
            const initial = [
                { username: 'TopMechanic', score: 25000 },
                { username: 'GearHead99', score: 18500 },
                { username: 'CrankShaft', score: 12000 },
                { username: 'WrenchMaster', score: 8500 },
                { username: 'VoltTech', score: 6200 }
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
        // If an API is configured, attempt to fetch real worldwide scores
        if (this.apiEnabled) {
            try {
                const response = await apiClient.get('/leaderboard/global');
                if (response.data && Array.isArray(response.data)) {
                    return response.data;
                }
            } catch (error) {
                console.warn('Leaderboard API fetch failed, falling back to local');
            }
        }
        
        // Fallback or Local Mode
        const local = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        return local.sort((a, b) => b.score - a.score);
    }

    async submitScore(score) {
        const username = this.getUsername();
        if (!username) return false;

        // 1. Persist to Local Storage (Always)
        let local = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        const existingIdx = local.findIndex(e => e.username === username);
        if (existingIdx > -1) {
            if (score > local[existingIdx].score) local[existingIdx].score = score;
        } else {
            local.push({ username, score });
        }
        local.sort((a, b) => b.score - a.score);
        localStorage.setItem(this.storageKey, JSON.stringify(local.slice(0, 20)));

        // 2. Persist to Global API (If configured)
        if (this.apiEnabled) {
            try {
                await apiClient.post('/leaderboard/submit', { 
                    username, 
                    score,
                    timestamp: Date.now()
                });
                return true;
            } catch (error) {
                console.error('Global score submission failed:', error);
                return false;
            }
        }

        return true; 
    }
}