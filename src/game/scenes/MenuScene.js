const Phaser = window.Phaser;
import LeaderboardManager from '../managers/LeaderboardManager.js';
import DailyManager from '../managers/DailyManager.js';
import ThemeManager from '../managers/ThemeManager.js';
import { THEME_LIST } from '../managers/ThemeManager.js';
import DailyModifierManager from '../managers/DailyModifierManager.js';
import UpgradeManager from '../managers/UpgradeManager.js';
import { loadHighScore } from '../managers/IntegrityManager.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
    this.bgGears = [];
  }

  create() {
    this.daily = new DailyManager();
    this.themeManager = new ThemeManager();
    this.leaderboardManager = new LeaderboardManager();
    this.showingLeaderboard = false;

    this.layout();

    this.scale.on('resize', () => {
      this.layout();
    });

    this.cameras.main.fadeIn(400);
  }

  layout() {
    if (!this.cameras || !this.cameras.main) return;
    const { width, height } = this.cameras.main;
    this.children.removeAll(); 
    this.bgGears = [];
    
    this.createBackground(width, height);
    this.buildMainMenu(width, height);
    this.buildThemeSelector(width, height);
  }

  createBackground(width, height) {
    const t = this.themeManager.get();
    const bg = this.add.graphics();
    bg.fillGradientStyle(t.bgTop, t.bgTop, t.bgBot, t.bgBot, 1);
    bg.fillRect(0, 0, width, height);

    // Grid
    bg.lineStyle(1, t.gridColor, 0.4);
    const step = width < 600 ? 50 : 80;
    for (let x = 0; x < width; x += step) bg.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += step) bg.lineBetween(0, y, width, y);

    // Create a lot of background gears for a "moving machine" feel
    const isMobile = width < 600;
    const gearCount = isMobile ? 8 : 15;
    
    for (let i = 0; i < gearCount; i++) {
        const size = Phaser.Math.Between(isMobile ? 40 : 60, isMobile ? 80 : 150);
        const x = Phaser.Math.Between(0, width);
        const y = Phaser.Math.Between(0, height);
        const speed = (Math.random() - 0.5) * 0.8;
        
        const g = this.add.graphics();
        this.drawGearGraphic(g, x, y, size, t.hudBorder);
        g.setAlpha(0.12);
        this.bgGears.push({ graphic: g, x, y, size, speed, angle: Math.random() * 6, color: t.hudBorder });
    }

    // Floating particles (dust/sparks)
    this.particles = this.add.particles(0, 0, 'particle', {
        x: { min: 0, max: width },
        y: { min: 0, max: height },
        quantity: 1,
        frequency: isMobile ? 800 : 400,
        lifespan: 4000,
        speedX: { min: -10, max: 10 },
        speedY: { min: -20, max: -5 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.3, end: 0 },
        blendMode: 'ADD'
    });
  }

  drawGearGraphic(g, x, y, size, color) {
    g.fillStyle(color);
    // Gear teeth
    const teeth = 12;
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      const tx = x + Math.cos(a) * size;
      const ty = y + Math.sin(a) * size;
      g.fillCircle(tx, ty, size * 0.2);
    }
    // Main plate
    g.fillCircle(x, y, size);
    // Inner hole
    g.fillStyle(0x0a0a1a);
    g.fillCircle(x, y, size * 0.45);
    // Spokes
    g.lineStyle(size * 0.1, color, 1);
    for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        g.lineBetween(x, y, x + Math.cos(a) * size * 0.8, y + Math.sin(a) * size * 0.8);
    }
  }

  update(time, delta) {
    this.bgGears.forEach(gear => {
      gear.angle += gear.speed * delta * 0.001;
      gear.graphic.clear();
      gear.graphic.setAngle(Phaser.Math.RadToDeg(gear.angle));
      this.drawGearGraphic(gear.graphic, gear.x, gear.y, gear.size, gear.color);
    });
  }

  buildMainMenu(width, height) {
    const isMobile = width < 600;
    const spacing = height / 12;
    const startY = height * 0.12;
    
    // Title
    this.add.text(width / 2, startY, '⚙ GEARWORKS ⚙', {
      fontSize: isMobile ? '42px' : '64px', fontFamily: 'monospace', color: '#ffcc44',
      stroke: '#000000', strokeThickness: isMobile ? 6 : 10,
      shadow: { offsetX: 4, offsetY: 4, color: '#aa8800', blur: 0, fill: true },
    }).setOrigin(0.5);

    this.add.text(width / 2, startY + spacing * 1.5, 'The Ultimate Factory Simulator', {
      fontSize: isMobile ? '12px' : '16px', fontFamily: 'monospace', color: '#8899aa', letterSpacing: 4
    }).setOrigin(0.5);

    // High score
    const hs = loadHighScore();
    this.add.text(width / 2, startY + spacing * 2.8, `🏆 GLOBAL RECORD: ${hs.toLocaleString()}`, {
      fontSize: isMobile ? '18px' : '22px', fontFamily: 'monospace', color: '#ffee88', fontWeight: 'bold'
    }).setOrigin(0.5);

    // Buttons
    const playBtn = this.add.container(width / 2, startY + spacing * 4.8);
    const btnW = isMobile ? 220 : 300, btnH = isMobile ? 60 : 75;
    const btnBg = this.add.rectangle(0, 0, btnW, btnH, 0x224488, 1).setStrokeStyle(3, 0x4488ff);
    const btnText = this.add.text(0, 0, '▶ START PRODUCTION', { fontSize: isMobile ? '18px' : '24px', fontFamily: 'monospace', color: '#ffffff', fontWeight: 'bold' }).setOrigin(0.5);
    playBtn.add([btnBg, btnText]);
    playBtn.setSize(btnW, btnH);
    playBtn.setInteractive({ useHandCursor: true });
    playBtn.on('pointerdown', () => {
      this.cameras.main.fade(300, 0, 0, 0);
      this.time.delayedCall(320, () => this.scene.start('GameScene'));
    });

    // Sub-buttons
    const subY = isMobile ? startY + spacing * 6.5 : startY + spacing * 6.5;
    const upgradeY = isMobile ? startY + spacing * 8.0 : startY + spacing * 7.8;

    const lbBtn = this.add.container(width / 2 - (isMobile ? 0 : 160), subY);
    const lbBg = this.add.rectangle(0, 0, isMobile ? 320 : 280, 50, 0x222244, 1).setStrokeStyle(2, 0x334466);
    const lbText = this.add.text(0, 0, '🏆 LEADERBOARD', { fontSize: isMobile ? '14px' : '16px', color: '#ffee88' }).setOrigin(0.5);
    lbBtn.add([lbBg, lbText]);
    lbBtn.setSize(isMobile ? 320 : 280, 50);
    lbBtn.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.showLeaderboardPanel(width, height));

    const howBtn = this.add.container(width / 2 + (isMobile ? 0 : 160), isMobile ? subY + 60 : subY);
    const howBg = this.add.rectangle(0, 0, isMobile ? 320 : 280, 50, 0x222244, 1).setStrokeStyle(2, 0x334466);
    const howText = this.add.text(0, 0, '❓ HOW TO PLAY', { fontSize: isMobile ? '14px' : '16px', color: '#aaaacc' }).setOrigin(0.5);
    howBtn.add([howBg, howText]);
    howBtn.setSize(isMobile ? 320 : 280, 50);
    howBtn.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.start('HowToPlayScene'));

    const upgrBtn = this.add.container(width / 2, upgradeY);
    const uBg = this.add.rectangle(0, 0, isMobile ? 320 : 600, 50, 0x112233, 1).setStrokeStyle(2, 0x224488);
    const uText = this.add.text(0, 0, `⚙ UPGRADES & TECHNOLOGY`, { fontSize: isMobile ? '14px' : '18px', color: '#88aaff' }).setOrigin(0.5);
    upgrBtn.add([uBg, uText]);
    upgrBtn.setSize(isMobile ? 320 : 600, 50);
    upgrBtn.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.start('UpgradeScene', { sessionXP: 0 }));

    // Credits
    const creditBtn = this.add.text(width / 2, height - 60, 'ℹ️  ISAIAH JOHNSON  /  @grafreak0', { fontSize: '11px', color: '#667788' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    creditBtn.on('pointerdown', () => this.showCreditsPanel(width, height));
  }

  buildThemeSelector(width, height) {
    const t = this.themeManager.get();
    const isMobile = width < 600;
    const y = isMobile ? height * 0.88 : height * 0.85;
    
    THEME_LIST.forEach((theme, i) => {
      const x = width / 2 + (i - 1) * (isMobile ? 120 : 180);
      const isActive = theme.id === t.id;
      const btn = this.add.text(x, y, isMobile ? theme.icon : `${theme.icon} ${theme.name}`, {
        fontSize: isMobile ? '24px' : '16px', fontFamily: 'monospace',
        color: isActive ? '#ffffff' : '#8899aa',
        backgroundColor: isActive ? t.hudBorder : '#111122',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setPadding(20, 10);

      btn.on('pointerdown', () => {
        this.themeManager.setTheme(theme.id);
        this.layout();
      });
    });
  }

  async showLeaderboardPanel(width, height) {
    const isMobile = width < 600;
    const panelW = isMobile ? width * 0.95 : 520, panelH = isMobile ? height * 0.75 : 420;
    const panel = this.add.container(width / 2, height / 2).setDepth(200);
    const bg = this.add.rectangle(0, 0, panelW, panelH, 0x050510, 0.98).setStrokeStyle(2, 0x445577);
    const title = this.add.text(0, -panelH / 2 + 30, '🏆 GLOBAL LEADERBOARD', { fontSize: '20px', fontFamily: 'monospace', color: '#ffcc44', fontWeight: 'bold' }).setOrigin(0.5);
    const loading = this.add.text(0, 0, 'Fetching scores...', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
    const closeBtn = this.add.text(panelW/2 - 20, -panelH/2 + 20, '✕', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => panel.destroy());
    panel.add([bg, title, loading, closeBtn]);
    
    try {
        const entries = await this.leaderboardManager.getGlobal();
        loading.destroy();
        if (entries) {
            entries.slice(0, 10).forEach((e, i) => {
              const y = -panelH / 2 + 80 + i * 30;
              const name = String(e?.username || 'Anonymous').slice(0, 12);
              const score = Number(e?.score || 0).toLocaleString();
              const txt = this.add.text(-panelW/2 + 30, y, `${i+1}. ${name.padEnd(14)} ${score.padStart(10)}`, { fontSize: '14px', fontFamily: 'monospace', color: '#fff' });
              panel.add(txt);
            });
        }
    } catch(e) { loading.setText('Offline Mode'); }
  }

  showCreditsPanel(width, height) {
    const panel = this.add.container(width / 2, height / 2).setDepth(200);
    const bg = this.add.rectangle(0, 0, 480, 260, 0x050510, 0.98).setStrokeStyle(2, 0x445577);
    const creator = this.add.text(0, 0, 'ISAIAH JOHNSON\n@grafreak0', { fontSize: '32px', align: 'center', color: '#ffcc44', fontWeight: 'bold' }).setOrigin(0.5);
    const closeBtn = this.add.text(0, 100, '[ CLOSE ]', { fontSize: '16px', color: '#ffee88' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => panel.destroy());
    panel.add([bg, creator, closeBtn]);
    panel.setScale(0);
    this.tweens.add({ targets: panel, scaleX: 1, scaleY: 1, duration: 250, ease: 'Back.Out' });
  }
}