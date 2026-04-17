import IntegrityManager from './IntegrityManager.js';

export default class ScoreManager {
  constructor(modifiers = {}) {
    this.score = 0;
    this.combo = modifiers.startCombo || 1;
    this._integrity = new IntegrityManager();
    this.maxCombo = this.combo;
    this.lives = 3 + (modifiers.startLives || 0);
    if (modifiers.livesOverride !== undefined) this.lives = modifiers.livesOverride;
    this.machinesFixed = 0;
    this.machinesLost = 0;
    this.xp = 0;
    this.streak = 0;
    this.perfectMachines = 0;
    this.bossFixed = false;
    this._currentMachineWrongParts = 0;
    this._scorePctBonus = modifiers.scorePctBonus || 0;
    this._comboGuard = modifiers.comboGuard || false;
    this._dailyScoreMult = modifiers.dailyScoreMult || 1;
  }

  onMachineFixed(speedBonus = false, isBoss = false) {
    const base = isBoss ? 500 : 100;
    const speedBonusPts = speedBonus ? 50 : 0;
    const streakBonus = this.streak >= 10 ? 100 : this.streak >= 5 ? 50 : 0;
    const pct = 1 + this._scorePctBonus;
    const gained = Math.floor((base + speedBonusPts + streakBonus) * this.combo * pct * this._dailyScoreMult);
    this.score += gained;
    this._integrity.recordDelta(gained);
    this.machinesFixed++;
    this.combo = Math.min(this.combo + 1, 12);
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.xp += Math.floor(gained / 10);
    this.streak++;
    if (this._currentMachineWrongParts === 0) this.perfectMachines++;
    if (isBoss) this.bossFixed = true;
    this._currentMachineWrongParts = 0;
    return { gained, streakBonus, speedBonus };
  }

  addBonus(points) {
    if (points <= 0) return;
    this.score += points;
    this._integrity.recordDelta(points);
    // XP also scales with bonuses
    this.xp += Math.floor(points / 10);
  }

  onMachineLost() {
    this.lives = Math.max(0, this.lives - 1);
    this.combo = 1;
    this.streak = 0;
    this.machinesLost++;
    this._currentMachineWrongParts = 0;
  }

  onWrongPart() {
    if (this._comboGuard) {
      this.combo = Math.max(1, Math.floor(this.combo / 2));
    } else {
      this.combo = Math.max(1, this.combo - 1);
    }
    this.streak = 0;
    this._currentMachineWrongParts++;
  }

  addLife() {
    this.lives = Math.min(this.lives + 1, 6);
  }

  isGameOver() {
    return this.lives <= 0;
  }

  getStats() {
    return {
      score: this.score,
      combo: this.combo,
      maxCombo: this.maxCombo,
      lives: this.lives,
      machinesFixed: this.machinesFixed,
      xp: this.xp,
      streak: this.streak,
      perfectMachines: this.perfectMachines,
      bossFixed: this.bossFixed,
    };
  }
}