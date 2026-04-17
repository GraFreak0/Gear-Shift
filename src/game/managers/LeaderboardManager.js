/**
 * LeaderboardManager — manages a localStorage top-10 leaderboard.
 * No backend required — scores are stored locally.
 * For "vs friends" sharing: encode score as a shareable URL hash.
 */
export default class LeaderboardManager {
  static KEY = 'gearworks_leaderboard';
  static MAX_ENTRIES = 10;

  static getEntries() {
    try {
      return JSON.parse(localStorage.getItem(LeaderboardManager.KEY) || '[]');
    } catch {
      return [];
    }
  }

  static addEntry(name, score, level, machinesFixed, maxCombo) {
    const entries = LeaderboardManager.getEntries();
    entries.push({
      name: name || 'PLAYER',
      score,
      level,
      machinesFixed,
      maxCombo,
      date: new Date().toLocaleDateString(),
    });
    entries.sort((a, b) => b.score - a.score);
    const top = entries.slice(0, LeaderboardManager.MAX_ENTRIES);
    localStorage.setItem(LeaderboardManager.KEY, JSON.stringify(top));
    const rank = entries.findIndex(e => e.score === score && e.name === name) + 1;
    return rank;
  }

  /**
   * Encode a score as a shareable URL fragment.
   * Friends can paste this into their browser to see the challenge score.
   */
  static encodeChallenge(name, score) {
    const payload = btoa(JSON.stringify({ name, score, game: 'gearworks' }));
    return `${window.location.origin}${window.location.pathname}#challenge=${payload}`;
  }

  static decodeChallenge() {
    const hash = window.location.hash;
    if (!hash.startsWith('#challenge=')) return null;
    try {
      const payload = atob(hash.replace('#challenge=', ''));
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }

  static isQualifying(score) {
    const entries = LeaderboardManager.getEntries();
    if (entries.length < LeaderboardManager.MAX_ENTRIES) return true;
    return score > entries[entries.length - 1].score;
  }
}