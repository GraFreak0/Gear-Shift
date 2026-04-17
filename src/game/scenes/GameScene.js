const Phaser = window.Phaser;
import Machine from '../objects/Machine.js';
import Part from '../objects/Part.js';
import ConveyorBelt from '../objects/ConveyorBelt.js';
import ScoreManager from '../managers/ScoreManager.js';
import LevelManager from '../managers/LevelManager.js';
import SkillManager from '../managers/SkillManager.js';
import DailyManager from '../managers/DailyManager.js';
import SoundManager from '../managers/SoundManager.js';
import ThemeManager from '../managers/ThemeManager.js';
import EnvironmentManager from '../managers/EnvironmentManager.js';
import AchievementManager from '../managers/AchievementManager.js';
import UpgradeManager from '../managers/UpgradeManager.js';
import DailyModifierManager from '../managers/DailyModifierManager.js';
import { PART_TYPES, MACHINE_TYPES } from '../data/machines.js';
import { saveHighScore, loadHighScore } from '../managers/IntegrityManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init() {
    this.beltY = 280;
    this.trayY = 490;
    this.isMobile = false;
    this.uiScale = 1;
  }

  create() {
    const { width, height } = this.cameras.main;
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(400);

    this.soundManager = new SoundManager();
    this.themeManager = new ThemeManager();
    this.envManager = new EnvironmentManager();
    this.achievementManager = new AchievementManager();
    this.upgradeManager = new UpgradeManager();
    this.dailyModifier = new DailyModifierManager().get();
    this.theme = this.themeManager.get();

    const upgMods = this.upgradeManager.getModifiers();
    const modifiers = {
      ...upgMods,
      dailyScoreMult: this.dailyModifier.scoreMult || 1,
      livesOverride: this.dailyModifier.livesOverride,
      startCombo: this.dailyModifier.startCombo,
    };

    this.scoreManager = new ScoreManager(modifiers);
    this.levelManager = new LevelManager();
    this.skillManager = new SkillManager();
    this.dailyManager = new DailyManager();

    if (upgMods.beltSlowPct > 0) this.levelManager.baseBeltSpeed *= (1 - upgMods.beltSlowPct);

    this.machines = [];
    this.parts = [];
    this.gameRunning = false;
    this.paused = false;
    this.freezeActive = false;
    this.slowmoActive = false;
    this.elapsedMs = 0;
    this.distanceSinceLastSpawn = 300; 
    this.requiredDistance = 300; 
    this.bossSpawned = false;

    this.envManager.onEvent((evt) => this.handleEnvEvent(evt));

    this.layout();
    
    this.scale.on('resize', () => this.layout());

    this.showCountdown();
  }

  layout() {
    if (!this.cameras || !this.cameras.main) return;
    const { width, height } = this.cameras.main;
    this.isMobile = width < 600;
    this.uiScale = Math.min(1.4, Math.max(0.8, width / 1100));
    if (this.isMobile) this.uiScale *= 1.1;

    this.beltY = height * 0.42;
    this.trayY = height - (this.isMobile ? 90 : 115) * this.uiScale;

    if (this.bgGraphics) this.bgGraphics.destroy();
    this.buildBackground(width, height);

    this.updateBeltPath();

    if (this.hudContainer) this.hudContainer.destroy();
    this.buildHUD(width, height);

    if (this.skillContainer) this.skillContainer.destroy();
    this.buildSkillBar(width, height);

    if (this.trayContainer) this.trayContainer.destroy();
    this.buildPartsTray(width, height);

    if (this.pauseBtn) this.pauseBtn.destroy();
    this.buildPauseButton(width);
  }

  updateBeltPath() {
    const type = this.levelManager.getPathType();
    if (this.currentPathType === type && this.conveyorBelt) return;
    
    this.currentPathType = type;
    if (this.conveyorBelt) this.conveyorBelt.destroy();
    
    this.beltPath = this.createBeltPath(type);
    this.conveyorBelt = new ConveyorBelt(this, this.beltPath, this.theme);
  }

  createBeltPath(type) {
    const { width } = this.cameras.main;
    const path = new Phaser.Curves.Path(-150, this.beltY);
    
    if (type === 'S_CURVE') {
        path.cubicBezierTo(
            width * 0.3, this.beltY + 100,
            width * 0.7, this.beltY - 100,
            width + 200, this.beltY
        );
    } else if (type === 'ROUNDABOUT') {
        path.lineTo(width * 0.2, this.beltY);
        path.ellipseTo(60, 60, 180, 0, false, 0); // Bottom curve
        path.ellipseTo(60, 60, 0, 180, true, 0);  // Top curve
        path.lineTo(width + 200, this.beltY);
    } else if (type === 'ZIGZAG') {
      path.lineTo(width * 0.25, this.beltY - 40);
      path.lineTo(width * 0.5, this.beltY + 40);
      path.lineTo(width * 0.75, this.beltY - 40);
      path.lineTo(width + 200, this.beltY);
    } else if (type === 'CHAOS') {
      path.splineTo([
          width * 0.2, this.beltY + 120,
          width * 0.4, this.beltY - 80,
          width * 0.6, this.beltY + 80,
          width * 0.8, this.beltY - 120,
          width + 200, this.beltY
      ]);
    } else {
      path.lineTo(width + 200, this.beltY);
    }
    return path;
  }

  buildBackground(width, height) {
    const g = this.add.graphics();
    g.fillGradientStyle(this.theme.bgTop, this.theme.bgTop, this.theme.bgBot, this.theme.bgBot, 1);
    g.fillRect(0, 0, width, height);
    g.lineStyle(1, this.theme.gridColor, 0.4);
    const step = this.isMobile ? 30 : 40;
    for (let x = 0; x < width; x += step) g.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += step) g.lineBetween(0, y, width, y);
    g.setDepth(-10);
    this.bgGraphics = g;
  }

  buildPartsTray(width, height) {
    this.trayContainer = this.add.container(width / 2, this.trayY);
    const trayW = Math.min(width * 0.98, 620 * this.uiScale);
    const trayH = (this.isMobile ? 80 : 95) * this.uiScale;
    const bg = this.add.rectangle(0, 0, trayW, trayH, this.theme.hudBg, 0.9).setStrokeStyle(2, this.theme.hudBorder);
    this.trayContainer.add(bg);

    const spacing = trayW / (PART_TYPES.length + 1);
    this.parts = PART_TYPES.map((partDef, i) => {
      const part = new Part(this, (i + 1) * spacing - trayW / 2, 0, partDef);
      part.setUIScale(this.uiScale);
      this.trayContainer.add(part);
      return part;
    });
  }

  buildHUD(width, height) {
    this.hudContainer = this.add.container(0, 0).setDepth(100);
    const isMobile = this.isMobile;
    const bar = this.add.graphics();
    bar.fillStyle(0x000000, 0.4);
    bar.fillRect(0, 0, width, isMobile ? 55 : 65);
    this.hudContainer.add(bar);

    this.scoreText = this.add.text(isMobile ? 15 : 25, isMobile ? 12 : 15, 'SCORE: 0', { fontSize: isMobile ? '18px' : '24px', fontWeight: 'bold' });
    this.comboText = this.add.text(width / 2, isMobile ? 12 : 15, 'x1', { fontSize: isMobile ? '20px' : '26px', color: '#ffcc44' }).setOrigin(0.5, 0);
    this.levelText = this.add.text(width - (isMobile ? 120 : 150), isMobile ? 12 : 15, 'Lv1', { fontSize: isMobile ? '18px' : '24px', color: '#aaccff' }).setOrigin(1, 0);
    
    const progressBg = this.add.rectangle(width - 20, isMobile ? 25 : 30, 100, 12, 0x112233).setOrigin(1, 0.5).setStrokeStyle(1, 0x334466);
    this.progressBar = this.add.rectangle(width - 118, isMobile ? 25 : 30, 2, 8, this.theme.accentColor).setOrigin(0, 0.5);
    
    this.livesText = this.add.text(width / 2, isMobile ? 38 : 45, '♥♥♥', { fontSize: '18px', color: '#ff6666' }).setOrigin(0.5, 0);
    this.hudContainer.add([this.scoreText, this.comboText, this.levelText, progressBg, this.progressBar, this.livesText]);
  }

  buildSkillBar(width, height) {
    const spacingDelta = (this.isMobile ? 85 : 105) * this.uiScale;
    this.skillContainer = this.add.container(width / 2, this.trayY - spacingDelta).setDepth(90);
    const skills = this.skillManager.skillList;
    const spacing = (this.isMobile ? 70 : 90) * this.uiScale;
    const startX = -(skills.length - 1) * spacing / 2;

    this.skillButtons = skills.map((skill, i) => {
      const sw = (this.isMobile ? 56 : 72) * this.uiScale;
      const sh = sw;
      const c = this.add.container(startX + i * spacing, 0);
      const bg = this.add.rectangle(0, 0, sw, sh, 0x111122, 1).setStrokeStyle(2, this.theme.hudBorder);
      const icon = this.add.text(0, -6 * this.uiScale, skill.icon, { fontSize: `${24 * this.uiScale}px` }).setOrigin(0.5);
      const label = this.add.text(0, 18 * this.uiScale, skill.id.toUpperCase(), { fontSize: `${9 * this.uiScale}px`, color: '#88aaff' }).setOrigin(0.5);
      const cd = this.add.rectangle(-sw/2, sh/2, 0, sh, 0xffffff, 0.3).setOrigin(0, 1);
      c.add([bg, icon, label, cd]);
      c.setSize(sw, sh).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.activateSkill(skill));
      this.skillContainer.add(c);
      return { skill, cdOverlay: cd, bg, maxWidth: sw };
    });
  }

  buildPauseButton(width) {
    this.pauseBtn = this.add.text(width - 20, 15, '⏸', { fontSize: '24px' }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(110);
    this.pauseBtn.on('pointerdown', () => this.togglePause());
  }

  update(time, delta) {
    if (this.paused) return;
    const viewWidth = this.cameras.main.width;
    const baseSpeed = this.levelManager.getScaledSpeed(viewWidth);
    const beltSpeed = (this.freezeActive || !this.gameRunning) ? 0 : this.slowmoActive ? baseSpeed * 0.4 : baseSpeed;

    this.conveyorBelt.update(delta, beltSpeed);
    if (!this.gameRunning) return;
    
    this.elapsedMs += delta;
    this.envManager.update(this.elapsedMs, this.levelManager.level);

    this.distanceSinceLastSpawn += beltSpeed * (delta / 1000);
    if (this.distanceSinceLastSpawn >= this.requiredDistance) {
      this.spawnMachine();
      this.distanceSinceLastSpawn = 0;
      this.requiredDistance = Phaser.Math.Between(260, 420); 
    }

    this.machines.forEach(m => m.followPath(this.beltPath, beltSpeed, delta));
    const exitMachines = this.machines.filter(m => m.pathProgress > 1 || m.isDestroyed);
    exitMachines.forEach(m => {
        if (!m.isFixed) this.onMachineLost(m);
        else this.removeMachine(m);
    });

    this.updateSkillCooldowns(time);
    this.updateHUD();
  }

  spawnMachine() {
    try {
        const isBoss = !this.bossSpawned && this.levelManager.level % 5 === 0;
        let typeDef;
        if (isBoss) {
            typeDef = MACHINE_TYPES.find(m => m.isBoss);
            this.bossSpawned = true;
        } else {
            const regular = MACHINE_TYPES.filter(m => !m.bossOnly);
            typeDef = regular[Phaser.Math.Between(0, regular.length - 1)];
            if (this.levelManager.level % 5 !== 0) this.bossSpawned = false;
        }
        const machine = new Machine(this, -150, this.beltY, typeDef);
        machine.on('fixed', () => this.onMachineFixed(machine));
        this.machines.push(machine);
    } catch (e) { console.error("Spawn Error:", e); }
  }

  removeMachine(machine) {
    const idx = this.machines.indexOf(machine);
    if (idx > -1) this.machines.splice(idx, 1);
    machine.destroy();
  }

  onMachineFixed(machine) {
    const timeToExit = (1 - machine.pathProgress) * (this.beltPath.getLength() / this.levelManager.getScaledSpeed(this.cameras.main.width));
    const result = this.scoreManager.onMachineFixed(timeToExit > 3, machine.machineType.isBoss);
    
    if (this.levelManager.onMachineProcessed()) {
        this.soundManager.playLevelUp();
        this.showFloatingText(this.cameras.main.width/2, this.cameras.main.height/2, "LEVEL UP!", "#ffcc44", 48);
        this.updateBeltPath(); // Change path on level up if needed
    }

    this.soundManager.playMachineFixed();
    this.spawnParticles(machine.x, machine.y, this.theme.particleColor, 20);
    this.showFloatingText(machine.x, machine.y - 40, `+${result.gained}`, '#ffffff', 28);
    this.tweens.add({ targets: machine, scaleX: 0, scaleY: 0, alpha: 0, y: machine.y - 40, duration: 250, onComplete: () => this.removeMachine(machine) });
  }

  onMachineLost(machine) {
    if (!this.gameRunning) return;
    this.scoreManager.onMachineLost();
    this.levelManager.onMachineProcessed();
    this.soundManager.playMachineLost();
    this.cameras.main.flash(400, 255, 0, 0, true);
    this.cameras.main.shake(200, 0.012);
    this.showFloatingText(this.cameras.main.width - 60, this.beltY, '−1 LIFE', '#ff4444', 20);
    this.removeMachine(machine);
    if (this.scoreManager.isGameOver()) this.endGame();
  }

  updateHUD() {
    const stats = this.scoreManager.getStats();
    this.scoreText.setText(`SCORE: ${stats.score.toLocaleString()}`);
    this.comboText.setText(`x${stats.combo}`);
    this.levelText.setText(`Lv${this.levelManager.level}`);
    this.livesText.setText('♥'.repeat(stats.lives));
    
    const progress = this.levelManager.getLevelProgress();
    const targetWidth = Math.max(2, 96 * progress);
    
    if (this.progressBar.width !== targetWidth) {
        this.tweens.add({
            targets: this.progressBar,
            width: targetWidth,
            duration: 300,
            ease: 'Power2'
        });
    }
  }

  activateSkill(skill) {
    if (!this.skillManager.activate(skill.id, this.elapsedMs)) return;
    this.soundManager.playSkillActivate(skill.id);
    if (skill.id === 'freeze') {
      this.freezeActive = true;
      this.time.delayedCall(skill.duration, () => { this.freezeActive = false; });
    } else if (skill.id === 'slowmo') {
      this.slowmoActive = true;
      this.time.delayedCall(skill.duration, () => { this.slowmoActive = false; });
    } else if (skill.id === 'wrench') {
      const target = this.machines.find(m => !m.isFixed);
      if (target) {
          const slot = target.slots.find(s => !s.filled);
          if (slot) target.tryFillSlot(slot.requiredPart);
      }
    }
  }

  updateSkillCooldowns(now) {
    this.skillButtons.forEach(({ skill, cdOverlay, bg, maxWidth }) => {
      const progress = this.skillManager.getCooldownProgress(skill.id, now);
      const ready = progress >= 1;
      cdOverlay.width = ready ? 0 : maxWidth * (1 - progress);
      bg.setStrokeStyle(2, ready ? 0x44aaff : this.theme.hudBorder);
    });
  }

  showFloatingText(x, y, text, color, size = 20) {
    const txt = this.add.text(x, y, text, { fontSize: `${size}px`, color, fontWeight: 'bold' }).setOrigin(0.5);
    this.tweens.add({ targets: txt, y: y - 50, alpha: 0, duration: 800, onComplete: () => txt.destroy() });
  }

  spawnParticles(x, y, color, count) {
    const e = this.add.particles(x, y, 'particle', { color: [color], speed: { min: 50, max: 150 }, scale: { start: 1, end: 0 }, lifespan: 600, quantity: count, emitting: false });
    e.explode();
    this.time.delayedCall(1000, () => e.destroy());
  }

  showCountdown() {
      const { width, height } = this.cameras.main;
      const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.4).setDepth(200);
      const txt = this.add.text(width/2, height/2, '3', { fontSize: '100px', fontWeight: 'bold' }).setOrigin(0.5).setDepth(201);
      let count = 3;
      this.soundManager.playCountdown();
      const timer = this.time.addEvent({
          delay: 1000,
          callback: () => {
              count--;
              if (count > 0) { txt.setText(count); this.soundManager.playCountdown(); }
              else if (count === 0) { txt.setText('START!'); this.soundManager.playCountdownGo(); }
              else { overlay.destroy(); txt.destroy(); this.gameRunning = true; timer.destroy(); }
          },
          repeat: 3
      });
  }

  togglePause() {
      this.paused = !this.paused;
      if (this.paused) {
          const { width, height } = this.cameras.main;
          this.pOverlap = this.add.container(width/2, height/2).setDepth(500);
          const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.5).setInteractive().on('pointerdown', () => this.togglePause());
          const txt = this.add.text(0, 0, 'PAUSED', { fontSize: '48px' }).setOrigin(0.5);
          this.pOverlap.add([bg, txt]);
      } else if (this.pOverlap) this.pOverlap.destroy();
  }

  handleEnvEvent(evt) {
      this.cameras.main.shake(evt.duration, 0.005);
      this.soundManager.playEventAlert();
      this.showFloatingText(this.cameras.main.width/2, 100, evt.name, evt.color, 32);
  }

  endGame() {
    this.gameRunning = false;
    this.soundManager.playGameOver();
    this.cameras.main.fade(800, 0, 0, 0);
    const stats = this.scoreManager.getStats();
    saveHighScore(stats.score);
    this.achievementManager.check(stats);
    this.upgradeManager.addXP(stats.xp);
    this.time.delayedCall(1000, () => this.scene.start('GameOverScene', { ...stats, totalXP: this.upgradeManager.totalXP, dailyAchieved: this.dailyManager.dailyCompleted, dailyTarget: this.dailyManager.dailyTarget }));
  }
}