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

// Layout constants (relative to 800x600 base resolution)
const BELT_Y = 280;
const BELT_H = 50;
const TRAY_Y = 490;
const SPAWN_X = -100;
const EXIT_X = 900;
const URGENT_THRESHOLD = 620;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    this.soundManager = new SoundManager();
    this.themeManager = new ThemeManager();
    this.envManager = new EnvironmentManager();
    this.achievementManager = new AchievementManager();
    this.upgradeManager = new UpgradeManager();
    this.dailyModifier = new DailyModifierManager().get();
    this.theme = this.themeManager.get();

    // Apply upgrade + daily modifiers to score/level managers
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

    // Apply belt slow from upgrades
    if (upgMods.beltSlowPct > 0) {
      this.levelManager.beltSpeed *= (1 - upgMods.beltSlowPct);
    }

    this.machines = [];
    this.parts = [];
    this.gameRunning = false;
    this.paused = false;
    this.freezeActive = false;
    this.slowmoActive = false;
    this.elapsedMs = 0;
    this.distanceSinceLastSpawn = 300; // Start ready to spawn
    this.requiredDistance = 300; 
    this.consecutiveFixes = 0; // for chain reaction tracking
    this.chainReactionCount = 0;
    this.bossSpawned = false;

    // Challenge from URL
    this.challengeTarget = null;
    try {
      const hash = window.location.hash;
      if (hash.startsWith('#challenge=')) {
        const payload = JSON.parse(atob(hash.replace('#challenge=', '')));
        if (payload.game === 'gearworks') this.challengeTarget = payload;
      }
    } catch (e) { }

    // Environment event hook
    this.envManager.onEvent((evt) => this.handleEnvEvent(evt));

    this.buildBackground(width, height);
    this.buildConveyor(width);
    this.buildPartsTray(width, height);
    this.buildHUD(width, height);
    this.buildSkillBar(width, height);
    this.setupDragDrop();
    this.startSpawning();
    this.buildPauseButton(width);
    this.showDailyModifierBanner(width, height);

    this.cameras.main.fadeIn(400);
    this.showCountdown();
  }

  // ─── THEME / BACKGROUND ─────────────────────────────────────────────────────

  buildBackground(width, height) {
    const t = this.theme;
    const bg = this.add.graphics();
    bg.fillGradientStyle(t.bgTop, t.bgTop, t.bgBot, t.bgBot, 1);
    bg.fillRect(0, 0, width, height);
    bg.lineStyle(1, t.gridColor, 0.4);
    for (let x = 0; x < width; x += 40) bg.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 40) bg.lineBetween(0, y, width, y);

    // Belt area shadow
    const beltArea = this.add.graphics();
    beltArea.fillStyle(t.bgBot, 0.8);
    beltArea.fillRect(0, BELT_Y - BELT_H, width, BELT_H * 2);

    this.add.text(20, BELT_Y - 5, '→ ENTRY', { fontSize: '10px', fontFamily: 'monospace', color: '#334466' });
    this.add.text(width - 75, BELT_Y - 5, 'EXIT →', { fontSize: '10px', fontFamily: 'monospace', color: '#553333' });

    // Exit danger zone
    const dangerG = this.add.graphics();
    dangerG.fillStyle(t.dangerColor, 0.3);
    dangerG.fillRect(width - 90, BELT_Y - BELT_H, 90, BELT_H * 2);
    dangerG.lineStyle(2, t.dangerBorder, 0.6);
    dangerG.lineBetween(width - 90, BELT_Y - BELT_H, width - 90, BELT_Y + BELT_H);

    // Theme-specific background decorations
    this.buildThemeDecorations(width, height, t);
  }

  buildThemeDecorations(width, height, t) {
    if (t.id === 'cyber') {
      // Neon sign strips
      const neonG = this.add.graphics();
      neonG.lineStyle(2, 0x8800ff, 0.3);
      for (let y = 60; y < BELT_Y - BELT_H; y += 60) {
        neonG.lineBetween(0, y, width, y);
      }
      // Scanlines
      const scanG = this.add.graphics();
      scanG.lineStyle(1, 0x4400aa, 0.15);
      for (let y = 0; y < height; y += 4) scanG.lineBetween(0, y, width, y);
    } else if (t.id === 'lava') {
      // Lava glow at bottom
      const lavaG = this.add.graphics();
      lavaG.fillGradientStyle(0x000000, 0x000000, 0x330800, 0x330800, 1);
      lavaG.fillRect(0, height - 120, width, 120);
      // Lava bubble animation
      this.lavaParticleTimer = this.time.addEvent({
        delay: 1200,
        callback: () => this.spawnLavaBubble(width, height),
        loop: true,
      });
    } else if (t.id === 'factory') {
      // Industrial ceiling pipes
      const pipeG = this.add.graphics();
      pipeG.fillStyle(0x222233);
      pipeG.fillRect(0, 0, width, 8);
      pipeG.fillStyle(0x334455);
      [100, 220, 380, 540, 680].forEach(x => {
        pipeG.fillRect(x, 0, 20, 30);
        pipeG.fillRect(x + 5, 30, 10, 3);
      });
    }
  }

  spawnLavaBubble(width, height) {
    if (!this.gameRunning) return;
    const x = Phaser.Math.Between(20, width - 20);
    const bubble = this.add.circle(x, height - 10, Phaser.Math.Between(4, 10), 0xff4400, 0.6);
    bubble.setDepth(0);
    this.tweens.add({
      targets: bubble, y: height - 60, alpha: 0, scaleX: 2, scaleY: 0.5,
      duration: Phaser.Math.Between(800, 1600), ease: 'Quad.Out',
      onComplete: () => bubble.destroy(),
    });
  }

  buildConveyor(width) {
    this.conveyorBelt = new ConveyorBelt(this, BELT_Y, width);
    this.conveyorBelt.setDepth(1);
  }

  // ─── PARTS TRAY ─────────────────────────────────────────────────────────────

  buildPartsTray(width, height) {
    const t = this.theme;
    const trayBg = this.add.graphics();
    trayBg.fillStyle(t.hudBg, 0.97);
    trayBg.fillRect(0, TRAY_Y - 55, width, height - TRAY_Y + 55);
    trayBg.lineStyle(2, t.hudBorder);
    trayBg.lineBetween(0, TRAY_Y - 55, width, TRAY_Y - 55);

    this.add.text(10, TRAY_Y - 52, '🔧 PARTS TRAY', { fontSize: '11px', fontFamily: 'monospace', color: '#445566' });
    this.add.text(width - 10, TRAY_Y - 52, 'Drag to machines ↑', { fontSize: '11px', fontFamily: 'monospace', color: '#445566' }).setOrigin(1, 0);

    this.parts = [];
    const partsToShow = PART_TYPES;
    const slotSpacing = Math.floor((width - 40) / partsToShow.length);

    partsToShow.forEach((partData, i) => {
      const x = 20 + slotSpacing * i + slotSpacing / 2;
      const y = TRAY_Y - 5;
      const part = new Part(this, x, y, partData);
      part.setDepth(10);
      part.setScale(1.1);
      this.parts.push(part);
      this.add.text(x, y + 42, partData.name.toUpperCase(), { 
        fontSize: '11px', 
        fontFamily: 'monospace', 
        color: '#8899aa', 
        fontWeight: 'bold' 
      }).setOrigin(0.5).setDepth(10);
    });
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────────

  buildHUD(width, height) {
    const t = this.theme;
    const hudBg = this.add.graphics();
    hudBg.fillStyle(t.hudBg, 0.9);
    hudBg.fillRect(0, 0, width, 42);
    hudBg.lineStyle(1, t.hudBorder);
    hudBg.lineBetween(0, 42, width, 42);
    hudBg.setDepth(15);

    const label = (lx, text) => this.add.text(lx, 10, text, { fontSize: '11px', fontFamily: 'monospace', color: '#778899', fontWeight: 'bold' }).setDepth(16);
    const val = (lx, init, color) => this.add.text(lx, 21, init, { fontSize: '18px', fontFamily: 'monospace', color, fontWeight: 'bold' }).setDepth(16);

    label(25, 'SCORE'); this.scoreText = val(25, '0', '#ffffff');
    label(165, 'COMBO'); this.comboText = val(165, 'x1', t.accentColor);
    label(265, 'LEVEL'); this.levelText = val(265, '1', '#88ccff');
    label(335, 'FIXED'); this.fixedText = val(335, '0', '#66ff88');
    label(415, 'STREAK'); this.streakText = val(415, '0', '#ff88ff');

    // Lives
    this.livesContainer = this.add.container(width - 140, 18).setDepth(16);
    this.lifeIcons = [];
    for (let i = 0; i < 5; i++) {
      const heart = this.add.text(i * 24, 0, '❤', { fontSize: '16px' }).setOrigin(0.5);
      this.livesContainer.add(heart);
      this.lifeIcons.push(heart);
    }

    // Progress bar toward next level
    this.progressBarBg = this.add.rectangle(width / 2 + 10, 21, 120, 10, 0x111122).setStrokeStyle(1, t.hudBorder).setDepth(16);
    this.progressBar = this.add.rectangle(width / 2 + 10 - 60, 21, 0, 8, 0x224488).setOrigin(0, 0.5).setDepth(16);
    this.add.text(width / 2 + 10, 11, 'LVL', { fontSize: '8px', fontFamily: 'monospace', color: '#334466' }).setOrigin(0.5).setDepth(16);

    // Daily modifier indicator
    if (this.dailyModifier) {
      const mod = this.dailyModifier;
      this.add.text(width / 2 + 75, 10, `${mod.icon} ${mod.name}`, {
        fontSize: '9px', fontFamily: 'monospace', color: '#ffcc44', backgroundColor: '#110a00',
      }).setPadding(4, 2).setDepth(16);
    }

    // Sound toggle button
    const sndBtn = this.add.text(width - 68, 21, this.soundManager.enabled ? '🔊' : '🔇', { fontSize: '16px' })
      .setOrigin(0.5).setDepth(20).setInteractive({ useHandCursor: true });
    sndBtn.on('pointerdown', () => {
      const on = this.soundManager.toggle();
      sndBtn.setText(on ? '🔊' : '🔇');
    });

    // Daily challenge progress
    if (this.dailyManager) {
      this.dailyChallengeText = this.add.text(width - 10, height - 26, '', {
        fontSize: '10px', fontFamily: 'monospace', color: '#778899',
      }).setOrigin(1, 0).setDepth(16);
    }

    // Challenge vs friend
    if (this.challengeTarget) {
      this.add.text(width / 2, BELT_Y - BELT_H - 10, `VS ${this.challengeTarget.name.toUpperCase()}: BEAT ${this.challengeTarget.score.toLocaleString()}`, {
        fontSize: '12px', fontFamily: 'monospace', color: '#ff88ff',
      }).setOrigin(0.5);
    }

    // Environment event banner (hidden initially)
    this.envBanner = this.add.text(width / 2, BELT_Y - BELT_H + 10, '', {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffee44',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(18).setAlpha(0);
  }

  // ─── SKILL BAR ──────────────────────────────────────────────────────────────

  buildSkillBar(width, height) {
    const t = this.theme;
    const skills = this.skillManager.skillList;
    const barY = TRAY_Y + 48; // Tighter vertical gap
    this.skillButtons = [];

    const btnW = Math.min(Math.floor((width - 60) / skills.length) - 15, 180);
    const btnH = 48;
    const totalW = skills.length * (btnW + 15);
    const startX = (width - totalW) / 2;

    this.add.text(startX, barY - 15, '⚡ SKILLS (tap to activate)', {
      fontSize: '11px', fontFamily: 'monospace', color: '#445566', fontWeight: 'bold'
    }).setDepth(11);

    skills.forEach((skill, i) => {
      const x = startX + i * (btnW + 15) + btnW / 2;
      const y = barY + 24;

      const bg = this.add.rectangle(x, y, btnW, btnH, t.hudBg).setStrokeStyle(2, t.hudBorder).setDepth(11);
      this.add.text(x - btnW / 2 + 10, y, skill.icon, { fontSize: '24px' }).setDepth(12).setOrigin(0, 0.5);
      
      this.add.text(x - 5, y - 8, skill.name, { 
        fontSize: '10px', 
        fontFamily: 'monospace', 
        color: '#aaaacc', 
        fontWeight: 'bold' 
      }).setDepth(12).setOrigin(0, 0.5);

      this.add.text(x - 5, y + 8, skill.desc, { 
        fontSize: '9px', 
        fontFamily: 'monospace', 
        color: '#778899',
        wordWrap: { width: btnW - 60 }
      }).setDepth(12).setOrigin(0, 0.5);

      const cdOverlay = this.add.rectangle(x - btnW / 2, y, 0, btnH, 0x000033, 0.75).setDepth(13).setOrigin(0, 0.5);

      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.activateSkill(skill.id));
      bg.on('pointerover', () => { bg.setFillStyle(0x1a2244); this.tweens.add({ targets: bg, scaleX: 1.02, scaleY: 1.02, duration: 80 }); });
      bg.on('pointerout', () => { bg.setFillStyle(t.hudBg); this.tweens.add({ targets: bg, scaleX: 1, scaleY: 1, duration: 80 }); });

      this.skillButtons.push({ skill, bg, cdOverlay, maxWidth: btnW });
    });
  }

  activateSkill(id) {
    if (!this.gameRunning || this.paused) return;
    const now = this.time.now;
    if (!this.skillManager.canActivate(id, now)) return;
    this.skillManager.activate(id, now);
    this.soundManager.playSkillActivate(id);

    const { width } = this.cameras.main;
    if (id === 'freeze') {
      this.freezeActive = true;
      this.showFloatingText(width / 2, BELT_Y - 60, '❄ BELT FROZEN!', '#88ddff', 20);
      this.cameras.main.flash(200, 100, 200, 255, true);
      this.time.delayedCall(5000, () => {
        this.freezeActive = false;
        this.skillManager.deactivate('freeze');
      });
    } else if (id === 'slowmo') {
      this.slowmoActive = true;
      this.showFloatingText(width / 2, BELT_Y - 60, '🐢 SLOW-MO!', '#ffee44', 20);
      this.cameras.main.flash(200, 255, 200, 50, true);
      this.time.delayedCall(8000, () => {
        this.slowmoActive = false;
        this.skillManager.deactivate('slowmo');
      });
    } else if (id === 'wrench') {
      this.autoFixNearestSlot();
      this.skillManager.deactivate('wrench');
    }
  }

  autoFixNearestSlot() {
    const unfixed = this.machines.filter(m => !m.isFixed && !m.isDestroyed);
    if (unfixed.length === 0) return;
    unfixed.sort((a, b) => b.x - a.x);
    const target = unfixed[0];
    const needed = target.getRequiredParts();
    if (needed.length === 0) return;
    target.tryFillSlot(needed[0]);
    this.spawnParticles(target.x, target.y, this.theme.particleColor, 15);
    this.showFloatingText(target.x, target.y - 50, '🔧 AUTO-FIX!', '#ffcc44', 18);
    this.onSlotFilled(target);
  }

  // ─── DAILY MODIFIER BANNER ───────────────────────────────────────────────────

  showDailyModifierBanner(width, height) {
    const mod = this.dailyModifier;
    if (!mod) return;
    const banner = this.add.text(width / 2, height / 2, `${mod.icon} ${mod.name}\n${mod.desc}`, {
      fontSize: '20px', fontFamily: 'monospace', color: '#ffcc44',
      stroke: '#000000', strokeThickness: 4, align: 'center',
    }).setOrigin(0.5).setDepth(25).setAlpha(0);
    this.tweens.add({
      targets: banner, alpha: 1, duration: 300,
      onComplete: () => {
        this.time.delayedCall(2200, () => {
          this.tweens.add({ targets: banner, alpha: 0, y: height / 2 - 40, duration: 500, onComplete: () => banner.destroy() });
        });
      },
    });
  }

  // ─── ENVIRONMENT EVENTS ──────────────────────────────────────────────────────

  handleEnvEvent(evt) {
    if (!this.gameRunning) return;
    this.soundManager.playEventAlert();
    this.envBanner.setText(`${evt.name}  ${evt.desc}`);
    this.envBanner.setColor(evt.color);
    this.envBanner.setAlpha(1);
    this.tweens.add({ targets: this.envBanner, alpha: 0, duration: 3500, delay: 2000 });

    if (evt.effect === 'shake') {
      this.cameras.main.shake(4000, 0.006);
    }
    if (evt.effect === 'golden' || evt.effect === 'score_triple') {
      this.cameras.main.flash(300, 255, 200, 50, true);
    }
  }

  // ─── DRAG & DROP ─────────────────────────────────────────────────────────────

  setupDragDrop() {
    this.input.on('drop', (pointer, gameObject, dropZone) => {
      if (!this.gameRunning || this.paused) return;
      if (!(gameObject instanceof Part)) return;
      const machine = dropZone.machineRef;
      if (!machine || machine.isFixed || machine.isDestroyed) return;

      const success = machine.tryFillSlot(gameObject.partId);
      if (success) {
        gameObject.markUsed();
        this.soundManager.playPartCorrect();
        this.onSlotFilled(machine);
        this.spawnParticles(machine.x, machine.y, this.theme.particleColor);
      } else {
        const needed = machine.getRequiredParts();
        if (needed.length > 0) {
          machine.flashError();
          this.showFloatingText(machine.x, machine.y - 50, 'WRONG PART!', '#ff4444');
          this.soundManager.playWrongPart();
          this.scoreManager.onWrongPart();
          this.updateHUD();
          this.cameras.main.shake(150, 0.005);
        }
      }
    });

    // Sound on drag start
    this.input.on('dragstart', () => {
      if (this.gameRunning && !this.paused) this.soundManager.playPartPlace();
    });
  }

  onSlotFilled(machine) {
    if (!machine.isFixed) return;

    const isBoss = machine.machineType.isBoss || false;
    const { scoreMultiplier, repairBonus } = this.envManager.onMachineFixed();
    const speedBonus = machine.x < this.cameras.main.width * 0.6;
    const result = this.scoreManager.onMachineFixed(speedBonus, isBoss);
    const leveled = this.levelManager.onMachineProcessed();

    this.achievementManager.recordFix();

    // Chain reaction tracking
    this.consecutiveFixes++;
    if (this.consecutiveFixes >= 3) {
      this.chainReactionCount = this.consecutiveFixes;
      this.soundManager.playChainReaction(this.consecutiveFixes);
      this.showFloatingText(machine.x, machine.y - 90, `🔗 CHAIN x${this.consecutiveFixes}!`, '#44ffcc', 16);
      this.spawnChainEffect(machine.x, machine.y);
    }

    const totalGained = result.gained * scoreMultiplier + repairBonus;
    const combo = this.scoreManager.combo - 1;
    const comboLabel = combo > 1 ? ` x${combo}!` : '';
    const evtLabel = scoreMultiplier > 1 ? ` [x${scoreMultiplier} EVENT]` : '';
    this.showFloatingText(machine.x, machine.y - 60, `+${totalGained}${comboLabel}${evtLabel}`, '#ffcc44', combo > 3 ? 26 : 20);

    if (speedBonus) this.showFloatingText(machine.x, machine.y - 85, '⚡ SPEED BONUS!', '#88ffcc', 12);
    if (result.streakBonus > 0) this.showFloatingText(machine.x, machine.y - 100, `🔥 +${result.streakBonus}`, '#ff88ff', 12);
    if (repairBonus > 0) this.showFloatingText(machine.x, machine.y - 115, `🔧 +${repairBonus}`, '#88ff88', 12);
    if (isBoss) {
      this.showFloatingText(machine.x, machine.y - 130, '🤖 BOSS SLAIN! +500', '#ff88ff', 22);
      this.cameras.main.flash(400, 255, 100, 255, true);
      this.soundManager.playBossSpawn(); // victory variation
    }

    this.soundManager.playMachineFixed();
    if (combo >= 2) this.soundManager.playCombo(combo);
    if (combo >= 5) this.cameras.main.shake(200, 0.008);
    if (combo >= 8) {
      this.cameras.main.flash(150, 255, 180, 0, true);
      // Combo fire trail on parts
      this.spawnFireTrail(machine.x, machine.y);
    }

    if (leveled) {
      this.showLevelUp();
      this.soundManager.playLevelUp();
      // Every 10 levels spawn a boss
      if (this.levelManager.level % 10 === 0) {
        this.time.delayedCall(1500, () => this.spawnBoss());
      }
    }

    this.scoreManager.score += (totalGained - result.gained);
    this.updateHUD();
    this.spawnParticles(machine.x, machine.y, this.theme.particleColor, 20);

    // Check achievements
    const stats = this.scoreManager.getStats();
    stats.level = this.levelManager.level;
    stats.lastMachinePerfect = result.gained > 0 && machine._noWrongParts;
    stats.dailyCompleted = this.dailyManager.dailyCompleted;
    const newAchs = this.achievementManager.check(stats);
    newAchs.forEach((ach, i) => {
      this.time.delayedCall(i * 1200, () => this.showAchievementPopup(ach));
    });

    this.tweens.add({
      targets: machine, x: EXIT_X + 200, duration: 800, ease: 'Quad.In',
      onComplete: () => this.removeMachine(machine),
    });
  }

  spawnBoss() {
    if (!this.gameRunning) return;
    const bossMachineType = MACHINE_TYPES.find(m => m.id === 'boss_mega');
    if (!bossMachineType) return;
    const machine = new Machine(this, SPAWN_X - 30, BELT_Y - 10, bossMachineType);
    machine.setDepth(5);
    machine.setScale(1.1);
    this.machines.push(machine);
    this.soundManager.playBossSpawn();
    this.cameras.main.shake(600, 0.015);
    this.cameras.main.flash(300, 200, 0, 0, true);
    const { width } = this.cameras.main;
    this.showFloatingText(width / 2, BELT_Y - 80, '⚠ BOSS MACHINE INCOMING!', '#ff4444', 24);
    this.tweens.add({ targets: machine, x: SPAWN_X + 50, duration: 400, ease: 'Back.Out' });
  }

  spawnChainEffect(x, y) {
    const colors = [0x44ffcc, 0x4488ff, 0x88ff44, 0xffcc44];
    for (let i = 0; i < 20; i++) {
      const p = this.add.circle(x, y, Phaser.Math.Between(4, 10), colors[i % colors.length]);
      p.setDepth(16);
      this.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-120, 120),
        y: y + Phaser.Math.Between(-100, 60),
        alpha: 0, scaleX: 0, scaleY: 0,
        duration: Phaser.Math.Between(500, 1000),
        ease: 'Quad.Out',
        onComplete: () => p.destroy(),
      });
    }
  }

  spawnFireTrail(x, y) {
    const colors = [0xff4400, 0xff8800, 0xffcc00];
    for (let i = 0; i < 12; i++) {
      const p = this.add.circle(
        x + Phaser.Math.Between(-60, 60),
        y + Phaser.Math.Between(-30, 30),
        Phaser.Math.Between(5, 12),
        colors[i % colors.length]
      );
      p.setDepth(16);
      this.tweens.add({
        targets: p, y: p.y - Phaser.Math.Between(30, 80), alpha: 0,
        duration: Phaser.Math.Between(400, 700), ease: 'Quad.Out',
        onComplete: () => p.destroy(),
      });
    }
  }

  showAchievementPopup(ach) {
    const { width } = this.cameras.main;
    const popup = this.add.container(width - 200, -60).setDepth(50);
    const bg = this.add.rectangle(0, 0, 360, 52, 0x111133, 0.96).setStrokeStyle(2, 0xffcc44);
    const icon = this.add.text(-160, 0, ach.icon, { fontSize: '22px' }).setOrigin(0.5);
    const title = this.add.text(-130, -8, '🏅 ACHIEVEMENT UNLOCKED!', { fontSize: '10px', fontFamily: 'monospace', color: '#ffcc44' }).setOrigin(0, 0.5);
    const name = this.add.text(-130, 8, ach.name, { fontSize: '14px', fontFamily: 'monospace', color: '#aaccff' }).setOrigin(0, 0.5);
    popup.add([bg, icon, title, name]);
    this.soundManager.playAchievementUnlocked();
    this.tweens.add({
      targets: popup, y: 40, duration: 400, ease: 'Back.Out',
      onComplete: () => {
        this.time.delayedCall(2500, () => {
          this.tweens.add({ targets: popup, y: -80, duration: 300, ease: 'Quad.In', onComplete: () => popup.destroy() });
        });
      },
    });
  }

  // ─── SPAWNING ───────────────────────────────────────────────────────────────

  startSpawning() {
    this.time.delayedCall(1500, () => {
      this.spawnMachine();
      // Distance-based logic is in update()
    });
  }

  spawnMachine() {
    if (!this.gameRunning || this.paused) return;
    const machineType = this.dailyModifier.bossOnly
      ? (MACHINE_TYPES.find(m => m.id === 'boss_mega') || this.levelManager.getRandomMachineType())
      : this.levelManager.getRandomMachineType();
    const machine = new Machine(this, SPAWN_X, BELT_Y - 5, machineType);
    machine.setDepth(5);
    this.machines.push(machine);
    this.tweens.add({ targets: machine, x: SPAWN_X + 50, duration: 300, ease: 'Back.Out' });
    // Idle hum
    this.time.delayedCall(400, () => this.soundManager.playMachineHum(machineType.id));
  }

  removeMachine(machine) {
    machine.isDestroyed = true;
    const idx = this.machines.indexOf(machine);
    if (idx > -1) this.machines.splice(idx, 1);
    machine.destroy();
  }

  // ─── PAUSE ──────────────────────────────────────────────────────────────────

  buildPauseButton(width) {
    const pauseBtn = this.add.container(width - 35, 21).setDepth(20);
    const pBg = this.add.rectangle(0, 0, 30, 28, 0x1a1a33).setStrokeStyle(1, 0x334466);
    const pText = this.add.text(0, 0, '⏸', { fontSize: '13px' }).setOrigin(0.5);
    pauseBtn.add([pBg, pText]);
    pauseBtn.setSize(30, 28);
    pauseBtn.setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => this.togglePause(pText));
  }

  togglePause(icon) {
    this.paused = !this.paused;
    icon.setText(this.paused ? '▶' : '⏸');
    if (this.paused) this.showPauseOverlay();
    else this.hidePauseOverlay();
  }

  showPauseOverlay() {
    const { width, height } = this.cameras.main;
    this.pauseOverlay = this.add.container(width / 2, height / 2).setDepth(50);
    const bg = this.add.rectangle(0, 0, 340, 260, 0x000011, 0.94).setStrokeStyle(2, this.theme.hudBorder);
    const txt = this.add.text(0, -80, '⏸ PAUSED', { fontSize: '30px', fontFamily: 'monospace', color: this.theme.accentColor }).setOrigin(0.5);
    const sub = this.add.text(0, -35, 'Tap ⏸ to resume', { fontSize: '14px', fontFamily: 'monospace', color: '#778899' }).setOrigin(0.5);

    const tipText = this.add.text(0, 10, `💡 ${TIPS[Math.floor(Math.random() * TIPS.length)]}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#556677', wordWrap: { width: 300 }, align: 'center',
    }).setOrigin(0.5);

    const menuBtn = this.add.text(0, 70, '🏠 QUIT TO MENU', { fontSize: '14px', fontFamily: 'monospace', color: '#aaaacc' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));

    // Theme toggle in pause
    const themeBtn = this.add.text(0, 100, `🎨 THEME: ${this.theme.name}`, { fontSize: '12px', fontFamily: 'monospace', color: '#888888' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    themeBtn.on('pointerdown', () => {
      this.themeManager.next();
      this.theme = this.themeManager.get();
      themeBtn.setText(`🎨 THEME: ${this.theme.name}`);
    });

    this.pauseOverlay.add([bg, txt, sub, tipText, menuBtn, themeBtn]);
  }

  hidePauseOverlay() {
    if (this.pauseOverlay) { this.pauseOverlay.destroy(); this.pauseOverlay = null; }
  }

  // ─── COUNTDOWN ──────────────────────────────────────────────────────────────

  showCountdown() {
    const { width, height } = this.cameras.main;
    this.gameRunning = false;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000011, 0.7).setDepth(30);
    let count = 3;
    const countText = this.add.text(width / 2, height / 2, String(count), {
      fontSize: '96px', fontFamily: 'monospace', color: this.theme.accentColor,
      stroke: '#000000', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(31);

    const tick = () => {
      countText.setText(String(count));
      this.soundManager.playCountdown();
      this.tweens.add({ targets: countText, scaleX: 1.3, scaleY: 1.3, alpha: 0.5, duration: 800, ease: 'Quad.Out' });
      count--;
      if (count < 0) {
        countText.setText('GO!');
        countText.setColor('#66ff88');
        this.soundManager.playCountdownGo();
        this.tweens.add({
          targets: countText, scaleX: 2, scaleY: 2, alpha: 0, duration: 600,
          onComplete: () => { countText.destroy(); overlay.destroy(); this.gameRunning = true; },
        });
      } else {
        this.time.delayedCall(1000, tick);
      }
    };
    tick();
  }

  // ─── LEVEL UP ───────────────────────────────────────────────────────────────

  showLevelUp() {
    const { width, height } = this.cameras.main;
    const txt = this.add.text(width / 2, height / 2 - 80, `⬆ LEVEL ${this.levelManager.level}!`, {
      fontSize: '38px', fontFamily: 'monospace', color: this.theme.accentColor,
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: txt, y: height / 2 - 150, alpha: 0, duration: 1500, ease: 'Quad.Out', onComplete: () => txt.destroy() });
    this.cameras.main.flash(300, 255, 200, 50, true);
  }

  // ─── FLOATING TEXT ──────────────────────────────────────────────────────────

  showFloatingText(x, y, message, color = '#ffffff', size = 18) {
    const txt = this.add.text(x, y, message, {
      fontSize: `${size}px`, fontFamily: 'monospace', color, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: txt, y: y - 40, alpha: 0, duration: 900, ease: 'Quad.Out', onComplete: () => txt.destroy() });
  }

  // ─── PARTICLES ──────────────────────────────────────────────────────────────

  spawnParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const p = this.add.circle(x, y, Phaser.Math.Between(3, 7), color);
      p.setDepth(15);
      this.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-80, 80),
        y: y + Phaser.Math.Between(-80, 80),
        alpha: 0, scaleX: 0, scaleY: 0,
        duration: Phaser.Math.Between(400, 800),
        ease: 'Quad.Out',
        onComplete: () => p.destroy(),
      });
    }
  }

  // ─── HUD UPDATE ─────────────────────────────────────────────────────────────

  updateHUD() {
    const stats = this.scoreManager.getStats();
    this.scoreText.setText(String(stats.score));
    this.comboText.setText(`x${stats.combo}`);
    const cc = stats.combo >= 8 ? '#ff4444' : stats.combo >= 5 ? '#ff6644' : stats.combo >= 3 ? '#ffaa44' : this.theme.accentColor;
    this.comboText.setColor(cc);
    if (stats.combo >= 4) this.tweens.add({ targets: this.comboText, scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true });

    this.levelText.setText(String(this.levelManager.level));
    this.fixedText.setText(String(stats.machinesFixed));
    this.streakText.setText(String(stats.streak));
    this.lifeIcons.forEach((h, i) => h.setAlpha(i < stats.lives ? 1 : 0.15));

    const progress = (this.levelManager.machineCount % 10) / 10;
    this.progressBar.width = 120 * progress;

    if (this.dailyChallengeText) {
      const pct = Math.min(stats.score / this.dailyManager.dailyTarget, 1);
      this.dailyChallengeText.setText(`🎯 ${stats.score.toLocaleString()} / ${this.dailyManager.dailyTarget.toLocaleString()}`);
      this.dailyChallengeText.setColor(pct >= 1 ? '#44ff88' : pct >= 0.5 ? '#ffcc44' : '#778899');
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

  // ─── MACHINE LOST ───────────────────────────────────────────────────────────

  onMachineLost(machine) {
    if (!this.gameRunning || machine.isDestroyed) return;
    this.scoreManager.onMachineLost();
    this.levelManager.onMachineProcessed();
    this.consecutiveFixes = 0; // break chain
    this.updateHUD();
    this.soundManager.playMachineLost();
    this.cameras.main.flash(400, 255, 0, 0, true);
    this.cameras.main.shake(200, 0.012);
    const { width } = this.cameras.main;
    this.showFloatingText(width - 60, BELT_Y, '−1 LIFE', '#ff4444', 20);
    this.removeMachine(machine);
    if (this.scoreManager.isGameOver()) this.endGame();
  }

  // ─── GAME OVER ──────────────────────────────────────────────────────────────

  endGame() {
    this.gameRunning = false;
    if (this.spawnTimer) this.spawnTimer.remove();
    if (this.lavaParticleTimer) this.lavaParticleTimer.remove();

    const stats = this.scoreManager.getStats();

    // Integrity: validate score and save verified high score
    const verifiedScore = this.scoreManager._integrity.getFinalScore(stats.score);
    if (verifiedScore !== stats.score) {
      stats.score = 0; // void tampered session
    }
    const hs = loadHighScore();
    if (stats.score > hs) saveHighScore(stats.score);

    const dailyAchieved = this.dailyManager.markPlayed(stats.xp, stats.score);
    this.upgradeManager.addXP(stats.xp);
    this.soundManager.playGameOver();

    // Final achievement check
    stats.level = this.levelManager.level;
    stats.dailyCompleted = dailyAchieved;
    this.achievementManager.check(stats);

    this.cameras.main.flash(500, 255, 50, 0, true);
    this.time.delayedCall(800, () => {
      this.cameras.main.fade(400, 0, 0, 0);
      this.time.delayedCall(430, () => {
        this.scene.start('GameOverScene', {
          score: stats.score,
          machinesFixed: stats.machinesFixed,
          level: this.levelManager.level,
          maxCombo: stats.maxCombo,
          xp: stats.xp,
          streak: stats.streak,
          perfectMachines: stats.perfectMachines,
          dailyAchieved,
          dailyTarget: this.dailyManager.dailyTarget,
          totalXP: this.upgradeManager.totalXP,
        });
      });
    });
  }

  // ─── MAIN LOOP ──────────────────────────────────────────────────────────────

  update(time, delta) {
    if (!this.gameRunning || this.paused) return;

    this.elapsedMs += delta;
    this.conveyorBelt.update(delta);

    // Environment events
    const envEvt = this.envManager.update(this.elapsedMs, this.levelManager.level);

    // Belt speed with all modifiers
    const baseBeltSpeed = this.levelManager.getBeltSpeed();
    const envSpeed = this.envManager.getBeltSpeed(baseBeltSpeed);
    const beltSpeed = this.freezeActive ? 0 : this.slowmoActive ? envSpeed * 0.4 : envSpeed;

    // Distance-based spawning
    this.distanceSinceLastSpawn += beltSpeed * (delta / 1000);
    const spawnThreshold = this.levelManager.getSpawnInterval() * (baseBeltSpeed / 1000) * 0.85; // Buffer distance
    this.requiredDistance = Math.max(spawnThreshold, 280);

    if (this.distanceSinceLastSpawn >= this.requiredDistance) {
      this.spawnMachine();
      this.distanceSinceLastSpawn = 0;
    }

    const toRemove = [];
    this.machines.forEach(machine => {
      if (machine.isDestroyed) return;
      if (!machine.isFixed) {
        machine.x += beltSpeed * (delta / 1000);
        machine.setUrgent(machine.x > URGENT_THRESHOLD);
      }
      if (!machine.isFixed && machine.x > EXIT_X) toRemove.push(machine);
    });
    toRemove.forEach(m => this.onMachineLost(m));

    // Update skill cooldowns every 200ms
    if (Math.floor(time / 200) !== Math.floor((time - delta) / 200)) {
      this.updateSkillCooldowns(time);
    }
  }
}

const TIPS = [
  'Fix machines early for a SPEED BONUS!',
  'Build your combo for massive scores.',
  'Use FREEZE when the belt is crowded.',
  'Super Wrench auto-fixes the nearest machine.',
  'Watch for EVENT banners — they change scoring!',
  'POWER SURGE doubles belt speed — use Slow-Mo!',
  'GOLDEN MACHINE gives 5x score!',
  'Perfect fixes (no wrong parts) give bonus XP.',
  'Daily Challenge resets every day.',
  'Change themes in the Pause menu!',
];