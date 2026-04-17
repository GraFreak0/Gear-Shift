import { MACHINE_TYPES } from '../data/machines.js';

export default class LevelManager {
  constructor() {
    this.machineCount = 0;
    this.level = 1;
    this.beltSpeed = 45; // Increased from 28 (px/s)
    this.spawnInterval = 3500; // Decreased from 4200 (ms)
  }

  onMachineProcessed() {
    this.machineCount++;

    // Level up every 8 machines (faster pace)
    if (this.machineCount % 8 === 0) {
      this.level++;
      this.beltSpeed = Math.min(45 + (this.level - 1) * 8, 120);
      this.spawnInterval = Math.max(3500 - (this.level - 1) * 250, 1500);
      return true; // leveled up
    }
    return false;
  }

  getPathType() {
    if (this.level < 4) return 'LINEAR';
    if (this.level < 8) return 'ZIGZAG';
    return 'WAVE';
  }

  shouldSpawnBoss() {
    // Boss appears every 10 levels starting at level 10
    return this.level > 1 && this.machineCount % 10 === 0 && this.level % 10 === 0;
  }

  getRandomMachineType() {
    const available = MACHINE_TYPES.filter(mt => mt.minLevel <= this.level);
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