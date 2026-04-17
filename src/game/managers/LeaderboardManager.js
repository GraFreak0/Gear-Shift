import apiClient from '@/api/apiClient';

export default class LeaderboardManager {
    /**
     * Fetch global leaderboard
     * @returns {Promise<Array>} List of scores [{username, score, rank}]
     */
    async getGlobal() {
        try {
            const response = await apiClient.get('/leaderboard/global');
            return response.data || [];
        } catch (error) {
            console.error('Failed to fetch global leaderboard:', error);
            // Fallback to local high score if API fails
            return [];
        }
    }

    /**
     * Submit score to global leaderboard
     * @param {number} score 
     */
    async submitScore(score) {
        try {
            await apiClient.post('/leaderboard/submit', { score });
            return true;
        } catch (error) {
            console.error('Failed to submit score:', error);
            return false;
        }
    }
}