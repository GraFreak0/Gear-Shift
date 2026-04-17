const Phaser = window.Phaser;
import LeaderboardManager from '../managers/LeaderboardManager.js';
import { loadHighScore } from '../managers/IntegrityManager.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.machinesFixed = data.machinesFixed || 0;
    this.level = data.level || 1;
    this.maxCombo = data.maxCombo || 1;
    this.xp = data.xp || 0;
    this.streak = data.streak || 0;
    this.perfectMachines = data.perfectMachines || 0;
    this.dailyAchieved = data.dailyAchieved || false;
    this.dailyTarget = data.dailyTarget || 0;
    this.totalXP = data.totalXP || 0;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Load verified high score (GameScene already saved if new high)
    const hs = loadHighScore();
    const isNewHigh = this.finalScore > 0 && this.finalScore >= hs;

    // Check leaderboard qualification
    const qualifies = LeaderboardManager.isQualifying(this.finalScore);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1a);
    bg.fillRect(0, 0, width, height);
    bg.lineStyle(1, 0x111133);
    for (let x = 0; x < width; x += 40) bg.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 40) bg.lineBetween(0, y, width, y);

    // Panel
    const panel = this.add.graphics();
    panel.fillStyle(0x0d1530, 0.97);
    panel.fillRoundedRect(width / 2 - 290, 30, 580, 540, 16);
    panel.lineStyle(2, isNewHigh ? 0xffcc44 : 0x334466);
    panel.strokeRoundedRect(width / 2 - 290, 30, 580, 540, 16);

    // Title
    const titleText = isNewHigh ? '🏆 NEW HIGH SCORE!' : '💥 GAME OVER';
    const titleColor = isNewHigh ? '#ffcc44' : '#ff6666';
    this.add.text(width / 2, 72, titleText, {
      fontSize: '32px', fontFamily: 'monospace', color: titleColor, stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    // Score
    this.add.text(width / 2, 130, String(this.finalScore.toLocaleString()), {
      fontSize: '60px', fontFamily: 'monospace', color: '#ffffff', stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5);
    this.add.text(width / 2, 188, 'POINTS', { fontSize: '14px', fontFamily: 'monospace', color: '#888899' }).setOrigin(0.5);

    // XP earned
    this.add.text(width / 2, 210, `+${this.xp} XP earned`, { fontSize: '13px', fontFamily: 'monospace', color: '#88ffcc' }).setOrigin(0.5);

    // Daily achieved badge
    if (this.dailyAchieved) {
      this.add.text(width / 2, 232, '🎯 DAILY CHALLENGE COMPLETE! +500 XP', {
        fontSize: '13px', fontFamily: 'monospace', color: '#ffcc44', backgroundColor: '#111100',
      }).setOrigin(0.5).setPadding(8, 3);
    }

    // Stats grid
    const stats = [
      { label: 'Machines Fixed', value: this.machinesFixed, icon: '🔧' },
      { label: 'Level Reached', value: this.level, icon: '📈' },
      { label: 'Max Combo', value: `x${this.maxCombo}`, icon: '🔥' },
      { label: 'Best Streak', value: this.streak, icon: '⚡' },
      { label: 'Perfect Fixes', value: this.perfectMachines, icon: '✨' },
      { label: 'Best Score', value: Math.max(hs, this.finalScore).toLocaleString(), icon: '🏆' },
    ];
    stats.forEach((stat, i) => {
      const x = width / 2 - 200 + (i % 3) * 200;
      const y = 270 + Math.floor(i / 3) * 68;
      const statBg = this.add.graphics();
      statBg.fillStyle(0x111122);
      statBg.fillRoundedRect(x - 85, y - 22, 170, 54, 8);
      statBg.lineStyle(1, 0x223355);
      statBg.strokeRoundedRect(x - 85, y - 22, 170, 54, 8);
      this.add.text(x, y - 6, `${stat.icon} ${stat.label}`, { fontSize: '10px', fontFamily: 'monospace', color: '#778899' }).setOrigin(0.5);
      this.add.text(x, y + 14, String(stat.value), { fontSize: '20px', fontFamily: 'monospace', color: '#aaccff' }).setOrigin(0.5);
    });

    // Leaderboard submission
    if (qualifies) {
      this.buildLeaderboardInput(width, height, hs);
    }

    // Buttons
    const btnY = 530;
    const playAgainBtn = this.add.container(width / 2 - 115, btnY);
    const paBg = this.add.rectangle(0, 0, 200, 46, 0x224488).setStrokeStyle(2, 0x4488ff);
    const paText = this.add.text(0, 0, '▶  PLAY AGAIN', { fontSize: '17px', fontFamily: 'monospace', color: '#ffffff' }).setOrigin(0.5);
    playAgainBtn.add([paBg, paText]);
    playAgainBtn.setSize(200, 46);
    playAgainBtn.setInteractive({ useHandCursor: true });
    playAgainBtn.on('pointerover', () => paBg.setFillStyle(0x3355aa));
    playAgainBtn.on('pointerout', () => paBg.setFillStyle(0x224488));
    playAgainBtn.on('pointerdown', () => {
      this.cameras.main.fade(300, 0, 0, 0);
      this.time.delayedCall(320, () => this.scene.start('GameScene'));
    });

    const menuBtn = this.add.container(width / 2 + 115, btnY);
    const mBg = this.add.rectangle(0, 0, 200, 46, 0x222244).setStrokeStyle(2, 0x334466);
    const mText = this.add.text(0, 0, '🏠  MENU', { fontSize: '17px', fontFamily: 'monospace', color: '#aaaacc' }).setOrigin(0.5);
    menuBtn.add([mBg, mText]);
    menuBtn.setSize(200, 46);
    menuBtn.setInteractive({ useHandCursor: true });
    menuBtn.on('pointerover', () => mBg.setFillStyle(0x333355));
    menuBtn.on('pointerout', () => mBg.setFillStyle(0x222244));
    menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));

    // Upgrades shortcut
    const upgrBtn = this.add.container(width / 2, btnY + 52);
    const uBg = this.add.rectangle(0, 0, 260, 38, 0x112233).setStrokeStyle(1, 0x224488);
    const uText = this.add.text(0, 0, `⚙ UPGRADES  (${this.totalXP} XP)`, { fontSize: '14px', fontFamily: 'monospace', color: '#88aaff' }).setOrigin(0.5);
    upgrBtn.add([uBg, uText]);
    upgrBtn.setSize(260, 38);
    upgrBtn.setInteractive({ useHandCursor: true });
    upgrBtn.on('pointerover', () => uBg.setFillStyle(0x1a3355));
    upgrBtn.on('pointerout', () => uBg.setFillStyle(0x112233));
    upgrBtn.on('pointerdown', () => this.scene.start('UpgradeScene', { sessionXP: 0 }));

    if (isNewHigh) this.launchCelebration(width, height);
    this.cameras.main.fadeIn(400);
  }

  buildLeaderboardInput(width, height, hs) {
    const savedName = localStorage.getItem('gearworks_player_name') || '';
    this.playerName = savedName;

    // DOM input via Phaser's DOM element (fallback: prompt)
    const y = 415;
    this.add.text(width / 2, y, '🏆 You qualify for the leaderboard!', {
      fontSize: '13px', fontFamily: 'monospace', color: '#ffcc44',
    }).setOrigin(0.5);

    const nameDisplay = this.add.text(width / 2, y + 22, `Name: ${this.playerName || 'PLAYER'}`, {
      fontSize: '13px', fontFamily: 'monospace', color: '#aaccff', backgroundColor: '#111133',
    }).setOrigin(0.5).setPadding(8, 3).setInteractive({ useHandCursor: true });

    nameDisplay.on('pointerdown', () => {
      const name = window.prompt('Enter your name for the leaderboard:', this.playerName || 'PLAYER');
      if (name !== null) {
        this.playerName = name.trim().slice(0, 12).toUpperCase() || 'PLAYER';
        localStorage.setItem('gearworks_player_name', this.playerName);
        nameDisplay.setText(`Name: ${this.playerName}`);
      }
    });

    const saveBtn = this.add.text(width / 2 + 110, y + 22, '💾 SAVE SCORE', {
      fontSize: '12px', fontFamily: 'monospace', color: '#66ff88', backgroundColor: '#002211',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setPadding(8, 3);

    saveBtn.on('pointerdown', () => {
      const name = this.playerName || 'PLAYER';
      LeaderboardManager.addEntry(name, this.finalScore, this.level, this.machinesFixed, this.maxCombo);
      saveBtn.setText('✅ SAVED!');
      saveBtn.disableInteractive();
    });
  }

  launchCelebration(width, height) {
    const colors = [0xffcc44, 0xff6688, 0x44aaff, 0x44ff88, 0xffaa44];
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(50, width - 50);
      const g = this.add.graphics();
      g.fillStyle(colors[i % colors.length]);
      g.fillRect(0, 0, 8, 8);
      g.x = x; g.y = -10;
      this.tweens.add({
        targets: g, y: height + 20,
        x: x + Phaser.Math.Between(-100, 100),
        rotation: Phaser.Math.Between(-5, 5),
        duration: Phaser.Math.Between(1500, 3000),
        delay: Phaser.Math.Between(0, 1000),
        ease: 'Linear',
        onComplete: () => g.destroy(),
      });
    }
  }
}