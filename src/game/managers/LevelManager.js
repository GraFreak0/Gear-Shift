import { MACHINE_TYPES } from '../data/machines.js';

export default class LevelManager {
  constructor() {
    this.machineCount = 0;
    this.level = 1;
    this.beltSpeed = 28; // px/s
    this.spawnInterval = 4200; // ms
  }

  onMachineProcessed() {
    this.machineCount++;

    // Level up every 10 machines
    if (this.machineCount % 10 === 0) {
      this.level++;
      this.beltSpeed = Math.min(28 + (this.level - 1) * 6, 90);
      this.spawnInterval = Math.max(4200 - (this.level - 1) * 220, 1800);
      return true; // leveled up
    }
    return false;
  }

  shouldSpawnBoss() {
    // Boss appears every 10 levels starting at level 10
    return this.level > 1 && this.machineCount % 10 === 0 && this.level % 10 === 0;
  }

  getRandomMachineType() {
    const available = MACHINE_TYPES.filter(mt => mt.minLevel <= this.level);
    // Weight toward newer types at higher levels
    const weighted = [];
    available.forEach((mt, i) => {
      const weight = i === available.length - 1 ? 3 : (i === available.length - 2 ? 2 : 1);
      for (let w = 0; w < weight; w++) weighted.push(mt);
    });
    return weighted[Math.floor(Math.random() * weighted.length)];
  }

  getBeltSpeed() {
    return this.beltSpeed;
  }

  getSpawnInterval() {
    return this.spawnInterval;
  }
}