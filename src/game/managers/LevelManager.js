import { MACHINE_TYPES } from '../data/machines.js';

export default class LevelManager {
  constructor() {
    this.machineCount = 0;
    this.level = 1;
    this.baseBeltSpeed = 44; // Reduced from 48
    this.spawnInterval = 3500; 
    this.machinesPerLevel = 6; 
  }

  onMachineProcessed() {
    this.machineCount++;

    if (this.machineCount % this.machinesPerLevel === 0) {
      this.level++;
      // MUCH slow progression: +3 per level instead of +7
      this.baseBeltSpeed = Math.min(44 + (this.level - 1) * 3, 140);
      this.spawnInterval = Math.max(3500 - (this.level - 1) * 150, 1500);
      return true;
    }
    return false;
  }

  getScaledSpeed(viewWidth) {
    const scale = viewWidth / 1000;
    return this.baseBeltSpeed * Math.max(0.7, scale);
  }

  // CYCLE PATH TYPES EVERY 3 LEVELS
  getPathType() {
    if (this.level < 4) return 'LINEAR';
    if (this.level < 7) return 'S_CURVE';
    if (this.level < 10) return 'ZIGZAG';
    if (this.level < 13) return 'ROUNDABOUT';
    return 'CHAOS';
  }

  getLevelProgress() {
    return (this.machineCount % this.machinesPerLevel) / this.machinesPerLevel;
  }
}