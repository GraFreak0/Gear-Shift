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
    const { width, height } = this.cameras.main;

    this.daily = new DailyManager();
    this.themeManager = new ThemeManager();
    this.leaderboard = LeaderboardManager.getEntries();
    this.showingLeaderboard = false;

    this.createBackground(width, height);
    this.buildMainMenu(width, height);
    this.buildThemeSelector(width, height);

    // Decode challenge from URL
    this.challengeData = LeaderboardManager.decodeChallenge();

    this.cameras.main.fadeIn(400);
  }

  buildMainMenu(width, height) {
    // Definitive vertical layout (800x600 canvas)
    const pos = {
      title: 70,
      desc: 145,
      score: 215,
      streak: 245,
      challenge: 275,
      play: 335,
      secBtns: 410,
      upgrades: 470,
      theme: 525,
      banner: 565,
      badges: 588
    };

    // Title
    this.add.text(width / 2, pos.title, '⚙ GEARWORKS ⚙', {
      fontSize: '52px', fontFamily: 'monospace', color: '#ffcc44',
      stroke: '#000000', strokeThickness: 8,
      shadow: { offsetX: 3, offsetY: 3, color: '#aa8800', blur: 0, fill: true },
    }).setOrigin(0.5);

    this.add.text(width / 2, pos.desc, 'Fix the machines before they\nfall off the conveyor belt!', {
      fontSize: '18px', fontFamily: 'monospace', color: '#aaccff', align: 'center', lineSpacing: 8,
    }).setOrigin(0.5);

    // High score
    const hs = loadHighScore();
    this.add.text(width / 2, pos.score, `🏆 Best Score: ${hs.toLocaleString()}`, {
      fontSize: '20px', fontFamily: 'monospace', color: '#ffee88',
    }).setOrigin(0.5);

    // Daily streak
    const streakColor = this.daily.streak >= 7 ? '#ff8844' : this.daily.streak >= 3 ? '#ffcc44' : '#aaaacc';
    this.add.text(width / 2, pos.streak, `🔥 ${this.daily.streak}-day streak   ${this.daily.dailyCompleted ? '✅ Daily done!' : '🎯 Daily: ' + this.daily.dailyTarget.toLocaleString() + ' pts'}`, {
      fontSize: '14px', fontFamily: 'monospace', color: streakColor,
    }).setOrigin(0.5);

    // Challenge badge
    if (this.challengeData) {
      this.add.text(width / 2, pos.challenge, `⚡ CHALLENGE from ${this.challengeData.name}: BEAT ${this.challengeData.score.toLocaleString()}`, {
        fontSize: '12px', fontFamily: 'monospace', color: '#ff88ff', backgroundColor: '#110022',
      }).setOrigin(0.5).setPadding(8, 4);
    }

    // Play button
    const playBtn = this.add.container(width / 2, pos.play);
    const btnBg = this.add.rectangle(0, 0, 240, 60, 0x224488, 1).setStrokeStyle(2, 0x4488ff);
    const btnText = this.add.text(0, 0, '▶  PLAY', { fontSize: '28px', fontFamily: 'monospace', color: '#ffffff', fontWeight: 'bold' }).setOrigin(0.5);
    playBtn.add([btnBg, btnText]);
    playBtn.setSize(240, 60);
    playBtn.setInteractive({ useHandCursor: true });
    playBtn.on('pointerover', () => { btnBg.setFillStyle(0x3355aa); this.tweens.add({ targets: playBtn, scaleX: 1.05, scaleY: 1.05, duration: 100 }); });
    playBtn.on('pointerout', () => { btnBg.setFillStyle(0x224488); this.tweens.add({ targets: playBtn, scaleX: 1, scaleY: 1, duration: 100 }); });
    playBtn.on('pointerdown', () => {
      this.cameras.main.fade(300, 0, 0, 0);
      this.time.delayedCall(320, () => this.scene.start('GameScene'));
    });

    // Secondary buttons row
    const howBtn = this.add.container(width / 2 - 115, pos.secBtns);
    const howBg = this.add.rectangle(0, 0, 210, 46, 0x222244, 1).setStrokeStyle(2, 0x334466);
    const howText = this.add.text(0, 0, '❓  HOW TO PLAY', { fontSize: '15px', fontFamily: 'monospace', color: '#aaaacc' }).setOrigin(0.5);
    howBtn.add([howBg, howText]);
    howBtn.setSize(210, 46);
    howBtn.setInteractive({ useHandCursor: true });
    howBtn.on('pointerover', () => howBg.setFillStyle(0x333355));
    howBtn.on('pointerout', () => howBg.setFillStyle(0x222244));
    howBtn.on('pointerdown', () => this.scene.start('HowToPlayScene'));

    const lbBtn = this.add.container(width / 2 + 115, pos.secBtns);
    const lbBg = this.add.rectangle(0, 0, 210, 46, 0x222244, 1).setStrokeStyle(2, 0x334466);
    const lbText = this.add.text(0, 0, '🏆  LEADERBOARD', { fontSize: '15px', fontFamily: 'monospace', color: '#ffee88' }).setOrigin(0.5);
    lbBtn.add([lbBg, lbText]);
    lbBtn.setSize(210, 46);
    lbBtn.setInteractive({ useHandCursor: true });
    lbBtn.on('pointerover', () => lbBg.setFillStyle(0x332200));
    lbBtn.on('pointerout', () => lbBg.setFillStyle(0x222244));
    lbBtn.on('pointerdown', () => this.showLeaderboardPanel(width, height));

    // Upgrades button
    const upgradeManager = new UpgradeManager();
    const totalXP = upgradeManager.totalXP;
    const upgrBtn = this.add.container(width / 2, pos.upgrades);
    const uBg = this.add.rectangle(0, 0, 440, 46, 0x112233, 1).setStrokeStyle(1, 0x224488);
    const uText = this.add.text(0, 0, `⚙ UPGRADES & ACHIEVEMENTS  (${totalXP} XP)`, { fontSize: '15px', fontFamily: 'monospace', color: '#88aaff' }).setOrigin(0.5);
    upgrBtn.add([uBg, uText]);
    upgrBtn.setSize(440, 46);
    upgrBtn.setInteractive({ useHandCursor: true });
    upgrBtn.on('pointerover', () => uBg.setFillStyle(0x1a3355));
    upgrBtn.on('pointerout', () => uBg.setFillStyle(0x112233));
    upgrBtn.on('pointerdown', () => this.scene.start('UpgradeScene', { sessionXP: 0 }));

    // Platform badge
    const mobile = this.registry.get('isMobile');
    const platformLabel = mobile ? '📱 Mobile' : '🖥 PC';
    this.add.text(width - 15, 15, platformLabel, {
      fontSize: '11px', fontFamily: 'monospace', color: '#445566',
    }).setOrigin(1, 0);

    // External badges footer (just text, no boxes to reduce clutter)
    const badgeY = pos.badges;
    const badges = ['⚙ Phaser', '🐙 Open Source', '▶ Playables', '🌊 Wavedash'];
    const startX = width / 2 - (badges.length - 1) * 75;
    badges.forEach((b, i) => {
      this.add.text(startX + i * 150, badgeY, b, { fontSize: '11px', fontFamily: 'monospace', color: '#445566' }).setOrigin(0.5);
    });

    this.add.text(width / 2, height - 10, 'Gamedev.js Jam 2026 — Theme: MACHINES', {
      fontSize: '10px', fontFamily: 'monospace', color: '#334455',
    }).setOrigin(0.5);
  }

  buildThemeSelector(width, height) {
    const t = this.themeManager.get();
    const y = 525; // Matching pos.theme
    this.add.text(width / 2, y - 22, '🎨 THEME', { fontSize: '11px', fontFamily: 'monospace', color: t.accentColor, fontWeight: 'bold' }).setOrigin(0.5);
    const current = this.themeManager.get();
    THEME_LIST.forEach((theme, i) => {
      const x = width / 2 + (i - 1) * 135;
      const isActive = theme.id === current.id;
      const btn = this.add.text(x, y, `${theme.icon} ${theme.name}`, {
        fontSize: '13px', fontFamily: 'monospace',
        color: isActive ? '#ffffff' : '#8899aa',
        backgroundColor: isActive ? t.hudBorder : '#111122',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setPadding(10, 6);

      if (isActive) {
        btn.setStroke(t.accentColor, 2);
      }

      btn.on('pointerdown', () => {
        this.themeManager.setTheme(theme.id);
        this.scene.restart();
      });
      btn.on('pointerover', () => { if (!isActive) btn.setBackgroundColor('#222233'); });
      btn.on('pointerout', () => { if (!isActive) btn.setBackgroundColor('#111122'); });
    });

    // Daily modifier banner - relative to theme
    const dailyMod = new DailyModifierManager().get();
    this.add.text(width / 2, y + 30, `${dailyMod.icon} TODAY: ${dailyMod.name} — ${dailyMod.desc}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#ffcc44', backgroundColor: '#110a00',
    }).setOrigin(0.5).setPadding(6, 3);
  }



  showLeaderboardPanel(width, height) {
    if (this.lbPanel) { this.lbPanel.destroy(); this.lbPanel = null; return; }

    const panelW = 480, panelH = 380;
    const panelX = width / 2 - panelW / 2;
    const panelY = height / 2 - panelH / 2;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x080818, 0.97);
    panelBg.fillRoundedRect(panelX, panelY, panelW, panelH, 12);
    panelBg.lineStyle(2, 0x334488);
    panelBg.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);

    const title = this.add.text(width / 2, panelY + 24, '🏆 LOCAL LEADERBOARD', {
      fontSize: '20px', fontFamily: 'monospace', color: '#ffcc44',
    }).setOrigin(0.5);

    const entries = this.leaderboard;
    const rows = [];

    if (entries.length === 0) {
      rows.push(this.add.text(width / 2, panelY + 80, 'No scores yet — play to set one!', {
        fontSize: '14px', fontFamily: 'monospace', color: '#445566',
      }).setOrigin(0.5));
    } else {
      entries.forEach((e, i) => {
        const y = panelY + 60 + i * 28;
        const rank = i + 1;
        const rankColor = rank === 1 ? '#ffcc44' : rank === 2 ? '#aaccff' : rank === 3 ? '#cc8844' : '#556677';
        const row = this.add.text(panelX + 20, y, `#${rank}  ${e.name.padEnd(10)} ${String(e.score).padStart(8)}  Lv${e.level}  x${e.maxCombo}  ${e.date}`, {
          fontSize: '12px', fontFamily: 'monospace', color: rankColor,
        });
        rows.push(row);
      });
    }

    // Share challenge
    const shareLabel = this.add.text(width / 2, panelY + panelH - 55, '⚡ Challenge a friend with your top score:', {
      fontSize: '11px', fontFamily: 'monospace', color: '#556677',
    }).setOrigin(0.5);

    const shareBtn = this.add.text(width / 2, panelY + panelH - 30, '📋 COPY CHALLENGE LINK', {
      fontSize: '13px', fontFamily: 'monospace', color: '#88aaff', backgroundColor: '#111133',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setPadding(8, 4);

    shareBtn.on('pointerdown', () => {
      if (entries.length === 0) return;
      const top = entries[0];
      const url = LeaderboardManager.encodeChallenge(top.name, top.score);
      try {
        navigator.clipboard.writeText(url);
        shareBtn.setText('✅ COPIED!');
        this.time.delayedCall(2000, () => shareBtn.setText('📋 COPY CHALLENGE LINK'));
      } catch (e) {
        shareBtn.setText(url.slice(0, 50) + '...');
      }
    });

    const closeBtn = this.add.text(panelX + panelW - 16, panelY + 14, '✕', {
      fontSize: '16px', fontFamily: 'monospace', color: '#778899',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => { this.lbPanel.destroy(); this.lbPanel = null; });

    this.lbPanel = this.add.container(0, 0, [panelBg, title, shareLabel, shareBtn, closeBtn, ...rows]);
    this.lbPanel.setDepth(60);
  }

  createBackground(width, height) {
    const t = this.themeManager.get();
    const bg = this.add.graphics();
    bg.fillGradientStyle(t.bgTop, t.bgTop, t.bgBot, t.bgBot, 1);
    bg.fillRect(0, 0, width, height);
    bg.lineStyle(1, t.gridColor, 0.5);
    for (let x = 0; x < width; x += 40) bg.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 40) bg.lineBetween(0, y, width, y);

    const gearColor = t.hudBorder;

    const gearPositions = [
      { x: 80, y: 80, size: 50, speed: 0.3 },
      { x: width - 80, y: 80, size: 40, speed: -0.4 },
      { x: 50, y: height - 80, size: 35, speed: 0.5 },
      { x: width - 60, y: height - 90, size: 55, speed: -0.25 },
      { x: width / 2 - 320, y: height / 2, size: 30, speed: 0.6 },
      { x: width / 2 + 320, y: height / 2, size: 30, speed: -0.6 },
    ];

    this.bgGears = gearPositions.map(({ x, y, size, speed }) => {
      const g = this.add.graphics();
      this.drawGearGraphic(g, x, y, size, gearColor);
      g.setAlpha(0.3);
      return { graphic: g, x, y, size, speed, angle: 0, color: gearColor };
    });
  }

  drawGearGraphic(g, x, y, size, color) {
    g.fillStyle(color);
    g.fillCircle(x, y, size);
    g.fillStyle(0x0a0a1a);
    g.fillCircle(x, y, size * 0.5);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.fillStyle(color);
      g.fillRect(x + Math.cos(a) * size * 0.7 - 4, y + Math.sin(a) * size * 0.7 - 4, 8, 8);
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
}