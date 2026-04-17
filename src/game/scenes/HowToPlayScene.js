const Phaser = window.Phaser;

export default class HowToPlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HowToPlayScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1a);
    bg.fillRect(0, 0, width, height);
    bg.lineStyle(1, 0x111133);
    for (let x = 0; x < width; x += 40) bg.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 40) bg.lineBetween(0, y, width, y);

    // Panel
    const panel = this.add.graphics();
    panel.fillStyle(0x0d1530, 0.95);
    panel.fillRoundedRect(width / 2 - 330, 40, 660, 520, 16);
    panel.lineStyle(2, 0x224488);
    panel.strokeRoundedRect(width / 2 - 330, 40, 660, 520, 16);

    this.add.text(width / 2, 75, '❓ HOW TO PLAY', {
      fontSize: '28px', fontFamily: 'monospace', color: '#ffcc44',
    }).setOrigin(0.5);

    const steps = [
      { icon: '🏭', title: 'Broken machines arrive on the belt', desc: 'Red slots show what parts are missing.' },
      { icon: '🎯', title: 'Drag parts from the tray below', desc: 'Match the correct part to each red slot on the machine.' },
      { icon: '⚡', title: 'Fix before it falls off!', desc: 'If a machine reaches the right edge unfixed, you lose a life.' },
      { icon: '🔥', title: 'Build a combo', desc: 'Fix machines consecutively for a score multiplier (x2, x3, x4...).' },
      { icon: '📈', title: 'Speed increases every 10 machines', desc: 'New machine types with more broken parts unlock over time.' },
      { icon: '❤', title: 'You have 3 lives', desc: 'Lose all 3 and the game ends. Top scores go to the leaderboard!' },
    ];

    steps.forEach((step, i) => {
      const y = 130 + i * 70;
      const x0 = width / 2 - 300;

      this.add.text(x0, y, step.icon, {
        fontSize: '28px',
      });
      this.add.text(x0 + 50, y, step.title, {
        fontSize: '16px', fontFamily: 'monospace', color: '#88ccff', fontStyle: 'bold',
      });
      this.add.text(x0 + 50, y + 22, step.desc, {
        fontSize: '13px', fontFamily: 'monospace', color: '#778899',
      });
    });

    // Controls — show relevant hint based on detected platform
    const mobile = this.registry.get('isMobile');
    const controlsText = mobile
      ? '📱 TOUCH: Tap & drag parts to broken machines'
      : '🖱 MOUSE: Click & drag parts to broken machines';
    this.add.text(width / 2, 520, controlsText, {
      fontSize: '13px', fontFamily: 'monospace', color: '#aaccff', align: 'center',
    }).setOrigin(0.5);

    // Back button
    const backBtn = this.add.container(width / 2, height - 40);
    const btnBg = this.add.rectangle(0, 0, 200, 44, 0x224488).setStrokeStyle(2, 0x4488ff);
    const btnText = this.add.text(0, 0, '← BACK', {
      fontSize: '20px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5);
    backBtn.add([btnBg, btnText]);
    backBtn.setSize(200, 44);
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => btnBg.setFillStyle(0x3355aa));
    backBtn.on('pointerout', () => btnBg.setFillStyle(0x224488));
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'));

    this.cameras.main.fadeIn(300);
  }
}