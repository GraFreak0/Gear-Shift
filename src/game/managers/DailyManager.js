/**
 * DailyManager — handles daily streaks, daily challenge goals, and persistent XP.
 */
export default class DailyManager {
  constructor() {
    const today = new Date().toDateString();
    const data = this._load();

    // Daily streak
    const lastPlayed = data.lastPlayed || '';
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastPlayed === today) {
      this.streak = data.streak || 1;
      this.playedToday = true;
    } else if (lastPlayed === yesterday) {
      this.streak = (data.streak || 0) + 1;
      this.playedToday = false;
    } else {
      this.streak = 1;
      this.playedToday = false;
    }

    // Daily challenge: score target seeded by date
    const seed = this._dateSeed(today);
    this.dailyTarget = 500 + (seed % 10) * 200; // 500–2300
    this.dailyCompleted = data.dailyCompleted === today;
    this.totalXP = data.totalXP || 0;
  }

  markPlayed(sessionXP, finalScore) {
    const today = new Date().toDateString();
    this.totalXP += sessionXP;
    const dailyCompleted = finalScore >= this.dailyTarget;
    this._save({
      lastPlayed: today,
      streak: this.streak,
      dailyCompleted: dailyCompleted ? today : (this._load().dailyCompleted || ''),
      totalXP: this.totalXP,
    });
    if (dailyCompleted && !this.dailyCompleted) {
      this.dailyCompleted = true;
      return true; // newly completed
    }
    return false;
  }

  _dateSeed(dateStr) {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = (hash * 31 + dateStr.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }

  _load() {
    try {
      return JSON.parse(localStorage.getItem('gearworks_daily') || '{}');
    } catch {
      return {};
    }
  }

  _save(data) {
    localStorage.setItem('gearworks_daily', JSON.stringify(data));
  }
}