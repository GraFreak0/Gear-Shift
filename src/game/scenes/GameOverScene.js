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
    this.totalXP = data.totalXP || 0;
  }

  create() {
    const { width, height } = this.cameras.main;
    this.layout();
    
    this.cameras.main.fadeIn(500);

    this.scale.on('resize', () => {
        this.layout();
    });

    this.cameras.main.fadeIn(500);
  }

  layout() {
    const { width, height } = this.cameras.main;
    this.children.removeAll();
    const isMobile = width < 600;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a2a, 0x0a0a2a, 0x000000, 0x000000, 1);
    bg.fillRect(0, 0, width, height);

    // Panel
    const panelW = isMobile ? width * 0.95 : 560;
    const panelH = isMobile ? height * 0.85 : 500;
    const panel = this.add.container(width / 2, height / 2);
    const bgRect = this.add.rectangle(0, 0, panelW, panelH, 0x0d1530, 0.95).setStrokeStyle(3, 0x334466);
    panel.add(bgRect);

    // Title
    const title = this.add.text(0, -panelH / 2 + 50, 'GAME OVER', {
      fontSize: isMobile ? '32px' : '44px', fontWeight: 'bold', color: '#ff6666', stroke: '#000000', strokeThickness: 5
    }).setOrigin(0.5);
    panel.add(title);

    // Score
    const scoreVal = this.add.text(0, -panelH / 2 + 130, this.finalScore.toLocaleString(), {
      fontSize: isMobile ? '52px' : '72px', color: '#ffffff', fontWeight: 'bold'
    }).setOrigin(0.5);
    const scoreLabel = this.add.text(0, -panelH / 2 + 185, 'TOTAL SCORE', { fontSize: '14px', color: '#8899aa' }).setOrigin(0.5);
    panel.add([scoreVal, scoreLabel]);

    // Submission Status
    this.statusText = this.add.text(0, -panelH / 2 + 215, 'Synchronizing Global Leaderboard...', { fontSize: '11px', color: '#667788', fontFamily: 'monospace' }).setOrigin(0.5);
    panel.add(this.statusText);

    // Stats Grid
    const stats = [
      { label: 'FIXED', value: this.machinesFixed },
      { label: 'LEVEL', value: this.level },
      { label: 'COMBO', value: `x${this.maxCombo}` },
      { label: 'XP', value: `+${this.xp}` }
    ];
    
    stats.forEach((s, i) => {
        const x = (i % 2 === 0) ? -panelW/4 : panelW/4;
        const y = (i < 2) ? 0 : 70;
        const val = this.add.text(x, y, s.value, { fontSize: '24px', fontWeight: 'bold', color: '#aaccff' }).setOrigin(0.5);
        const lab = this.add.text(x, y + 25, s.label, { fontSize: '11px', color: '#556677' }).setOrigin(0.5);
        panel.add([val, lab]);
    });

    // Buttons
    const btnY = panelH / 2 - 80;
    const playAgain = this.add.container(isMobile ? 0 : -100, isMobile ? btnY - 50 : btnY);
    const paBg = this.add.rectangle(0, 0, 180, 44, 0x224488).setStrokeStyle(2, 0x4488ff);
    const paTxt = this.add.text(0, 0, 'PLAY AGAIN', { fontSize: '14px', fontWeight: 'bold' }).setOrigin(0.5);
    playAgain.add([paBg, paTxt]);
    playAgain.setSize(180, 44).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.start('GameScene'));
    
    const menu = this.add.container(isMobile ? 0 : 100, btnY);
    const mBg = this.add.rectangle(0, 0, 180, 44, 0x111122).setStrokeStyle(2, 0x334455);
    const mTxt = this.add.text(0, 0, 'MAIN MENU', { fontSize: '14px', color: '#8899aa' }).setOrigin(0.5);
    menu.add([mBg, mTxt]);
    menu.setSize(180, 44).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.start('MenuScene'));
    
    panel.add([playAgain, menu]);

    this.submitDisplay();
  }

  async submitDisplay() {
      const lb = new LeaderboardManager();
      const success = await lb.submitScore(this.finalScore);
      if (this.statusText && this.statusText.active) {
          this.statusText.setText(success ? '✅ SCORE SYNCED GLOBALLY' : '⚠️ OFFLINE: STORED LOCALLY');
          this.statusText.setColor(success ? '#66ff88' : '#ff8866');
      }
  }
}