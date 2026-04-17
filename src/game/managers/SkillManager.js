/**
 * SkillManager — manages active power-up skills the player can trigger during gameplay.
 * Skills are earned by XP milestones and can be activated once per game.
 */
export default class SkillManager {
  constructor() {
    this.skills = {
      freeze: {
        id: 'freeze',
        name: 'TIME FREEZE',
        icon: '❄',
        desc: 'Freezes belt for 5 seconds',
        cooldown: 30000,
        duration: 5000,
        xpCost: 0,
        active: false,
        lastUsed: -Infinity,
        unlocked: true,
      },
      slowmo: {
        id: 'slowmo',
        name: 'SLOW-MO',
        icon: '🐢',
        desc: 'Halves belt speed for 8 seconds',
        cooldown: 45000,
        duration: 8000,
        active: false,
        lastUsed: -Infinity,
        unlocked: true,
      },
      wrench: {
        id: 'wrench',
        name: 'SUPER WRENCH',
        icon: '🔧',
        desc: 'Auto-fixes 1 slot on nearest machine',
        cooldown: 60000,
        duration: 0,
        active: false,
        lastUsed: -Infinity,
        unlocked: true,
      },
    };
    this.skillList = Object.values(this.skills);
  }

  canActivate(id, now) {
    const s = this.skills[id];
    if (!s || !s.unlocked || s.active) return false;
    return now - s.lastUsed >= s.cooldown;
  }

  activate(id, now) {
    const s = this.skills[id];
    if (!this.canActivate(id, now)) return false;
    s.active = true;
    s.lastUsed = now;
    return true;
  }

  deactivate(id) {
    if (this.skills[id]) this.skills[id].active = false;
  }

  getCooldownProgress(id, now) {
    const s = this.skills[id];
    if (!s) return 1;
    const elapsed = now - s.lastUsed;
    return Math.min(elapsed / s.cooldown, 1);
  }
}