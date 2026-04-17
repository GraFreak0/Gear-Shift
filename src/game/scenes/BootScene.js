const Phaser = window.Phaser;
import LeaderboardManager from '../managers/LeaderboardManager.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Create loading bar
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    const barBg = this.add.rectangle(w / 2, h / 2 + 20, 300, 20, 0x333355);
    const bar = this.add.rectangle(w / 2 - 150, h / 2 + 20, 0, 18, 0x66aaff);
    bar.setOrigin(0, 0.5);

    this.add.text(w / 2, h / 2 - 20, 'GEARWORKS', {
      fontSize: '36px',
      fontFamily: 'monospace',
      color: '#ffcc44',
    }).setOrigin(0.5);

    this.add.text(w / 2, h / 2 + 55, 'Loading...', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      bar.width = 298 * value;
    });

    // We generate all graphics procedurally — nothing external to load.
    // Small delay to show the loading screen.
  }

  create() {
    this.generateTextures();
    
    // Check if user has a username
    const lb = new LeaderboardManager();
    if (!lb.getUsername()) {
        this.scene.start('UsernameScene');
    } else {
        this.scene.start('MenuScene');
    }
  }

  generateTextures() {
    this.createConveyorTexture();
    this.createMachineTextures();
    this.createPartTextures();
    this.createUITextures();
    this.createParticleTexture();
  }

  createConveyorTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // Belt segment
    g.fillStyle(0x444466);
    g.fillRect(0, 0, 60, 40);
    g.lineStyle(2, 0x666688);
    g.strokeRect(0, 0, 60, 40);
    // Rollers
    g.fillStyle(0x888899);
    g.fillRect(0, 5, 60, 8);
    g.fillRect(0, 27, 60, 8);
    // Bolts on roller
    g.fillStyle(0xaaaacc);
    g.fillCircle(8, 9, 3);
    g.fillCircle(30, 9, 3);
    g.fillCircle(52, 9, 3);
    g.fillCircle(8, 31, 3);
    g.fillCircle(30, 31, 3);
    g.fillCircle(52, 31, 3);
    g.generateTexture('conveyor_segment', 60, 40);
    g.destroy();
  }

  createMachineTextures() {
    // broken machine body
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xcc4444);
    g.fillRoundedRect(0, 0, 150, 100, 8);
    g.lineStyle(3, 0xff6666);
    g.strokeRoundedRect(0, 0, 150, 100, 8);
    // grill lines
    g.lineStyle(1, 0xaa3333);
    for (let i = 15; i < 150; i += 15) {
      g.lineBetween(i, 0, i, 100);
    }
    g.generateTexture('machine_broken', 150, 100);
    g.destroy();

    // fixed machine body
    const g2 = this.make.graphics({ x: 0, y: 0, add: false });
    g2.fillStyle(0x44aa44);
    g2.fillRoundedRect(0, 0, 150, 100, 8);
    g2.lineStyle(3, 0x66ff66);
    g2.strokeRoundedRect(0, 0, 150, 100, 8);
    g2.lineStyle(1, 0x338833);
    for (let i = 15; i < 150; i += 15) {
      g2.lineBetween(i, 0, i, 100);
    }
    g2.generateTexture('machine_fixed', 150, 100);
    g2.destroy();

    // slot empty
    const g3 = this.make.graphics({ x: 0, y: 0, add: false });
    g3.fillStyle(0x222244);
    g3.fillCircle(20, 20, 20);
    g3.lineStyle(2, 0xff4444);
    g3.strokeCircle(20, 20, 20);
    // dashed cross
    g3.lineStyle(2, 0xff4444);
    g3.lineBetween(12, 12, 28, 28);
    g3.lineBetween(28, 12, 12, 28);
    g3.generateTexture('slot_empty', 40, 40);
    g3.destroy();

    // slot filled
    const g4 = this.make.graphics({ x: 0, y: 0, add: false });
    g4.fillStyle(0x224422);
    g4.fillCircle(20, 20, 20);
    g4.lineStyle(2, 0x44ff44);
    g4.strokeCircle(20, 20, 20);
    g4.lineStyle(3, 0x44ff44);
    g4.lineBetween(10, 20, 16, 28);
    g4.lineBetween(16, 28, 30, 12);
    g4.generateTexture('slot_filled', 40, 40);
    g4.destroy();
  }

  createPartTextures() {
    const parts = [
      { id: 'gear', color: 0xe8c96a, shape: 'gear' },
      { id: 'spring', color: 0x88ddff, shape: 'spring' },
      { id: 'chip', color: 0x66cc88, shape: 'chip' },
      { id: 'wire', color: 0xffaa44, shape: 'wire' },
      { id: 'capacitor', color: 0xcc66aa, shape: 'cap' },
      { id: 'piston', color: 0xaaaaaa, shape: 'piston' },
      { id: 'valve', color: 0xff8866, shape: 'valve' },
      { id: 'pipe', color: 0x99bbcc, shape: 'pipe' },
      { id: 'bolt', color: 0xffee66, shape: 'bolt' },
    ];

    parts.forEach(({ id, color, shape }) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      const c = color;
      const dark = Phaser.Display.Color.IntegerToColor(c);
      dark.darken(30);
      const darkInt = Phaser.Display.Color.GetColor(dark.r, dark.g, dark.b);

      g.fillStyle(c);

      switch (shape) {
        case 'gear':
          // outer gear teeth
          g.fillCircle(25, 25, 20);
          g.fillStyle(darkInt);
          g.fillCircle(25, 25, 10);
          g.fillStyle(c);
          // teeth
          for (let a = 0; a < 8; a++) {
            const angle = (a / 8) * Math.PI * 2;
            g.fillRect(
              25 + Math.cos(angle) * 16 - 4,
              25 + Math.sin(angle) * 16 - 4,
              8, 8
            );
          }
          g.fillStyle(0x000000);
          g.fillCircle(25, 25, 5);
          break;

        case 'spring':
          g.lineStyle(4, c);
          for (let i = 0; i < 5; i++) {
            g.beginPath();
            g.arc(25, 8 + i * 9, 10, 0, Math.PI, i % 2 === 1);
            g.strokePath();
          }
          break;

        case 'chip':
          g.fillRect(10, 10, 30, 30);
          g.fillStyle(darkInt);
          g.fillRect(15, 15, 20, 20);
          g.fillStyle(c);
          for (let i = 0; i < 3; i++) {
            g.fillRect(6, 14 + i * 8, 6, 4);
            g.fillRect(38, 14 + i * 8, 6, 4);
            g.fillRect(14 + i * 8, 6, 4, 6);
            g.fillRect(14 + i * 8, 38, 4, 6);
          }
          g.fillStyle(0xffffff);
          g.fillRect(19, 19, 4, 4);
          break;

        case 'wire':
          g.lineStyle(4, c);
          g.beginPath();
          g.moveTo(5, 25);
          g.lineTo(15, 10);
          g.lineTo(25, 40);
          g.lineTo(35, 10);
          g.lineTo(45, 25);
          g.strokePath();
          g.fillStyle(0xffcc88);
          g.fillCircle(5, 25, 5);
          g.fillCircle(45, 25, 5);
          break;

        case 'cap':
          g.fillRect(18, 5, 14, 40);
          g.fillStyle(darkInt);
          g.fillRect(20, 7, 10, 36);
          g.lineStyle(4, c);
          g.lineBetween(5, 20, 18, 20);
          g.lineBetween(32, 20, 45, 20);
          g.lineStyle(3, 0xffffff);
          g.lineBetween(5, 15, 5, 25);
          g.lineBetween(45, 15, 45, 25);
          break;

        case 'piston':
          g.fillRect(15, 5, 20, 35);
          g.fillStyle(darkInt);
          g.fillRect(18, 40, 14, 12);
          g.lineStyle(2, 0xffffff);
          for (let i = 0; i < 3; i++) {
            g.lineBetween(15, 10 + i * 10, 35, 10 + i * 10);
          }
          g.fillStyle(c);
          g.fillRect(10, 3, 30, 8);
          break;

        case 'valve':
          // handle
          g.fillRect(22, 5, 6, 15);
          g.fillRect(10, 5, 30, 6);
          // body
          g.fillCircle(25, 30, 16);
          g.fillStyle(darkInt);
          g.fillCircle(25, 30, 10);
          g.fillStyle(0xffffff);
          g.fillCircle(25, 30, 4);
          break;

        case 'pipe':
          g.fillRect(5, 18, 40, 14);
          g.fillStyle(darkInt);
          g.fillRect(5, 22, 40, 6);
          // flanges
          g.fillStyle(c);
          g.fillRect(3, 14, 8, 22);
          g.fillRect(39, 14, 8, 22);
          g.fillStyle(darkInt);
          g.fillRect(5, 16, 4, 18);
          g.fillRect(41, 16, 4, 18);
          break;

        case 'bolt':
          // hex head
          g.fillStyle(c);
          const cx = 25, cy = 18, r = 14;
          g.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
            if (i === 0) g.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
            else g.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
          }
          g.closePath();
          g.fillPath();
          g.fillStyle(darkInt);
          g.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
            if (i === 0) g.moveTo(cx + 8 * Math.cos(a), cy + 8 * Math.sin(a));
            else g.lineTo(cx + 8 * Math.cos(a), cy + 8 * Math.sin(a));
          }
          g.closePath();
          g.fillPath();
          // shaft
          g.fillStyle(c);
          g.fillRect(21, 30, 8, 18);
          // thread lines
          g.lineStyle(1, darkInt);
          for (let i = 0; i < 4; i++) {
            g.lineBetween(21, 33 + i * 4, 29, 33 + i * 4);
          }
          break;
      }

      g.generateTexture(`part_${id}`, 50, 50);
      g.destroy();
    });
  }

  createUITextures() {
    // Button
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x224488);
    g.fillRoundedRect(0, 0, 200, 50, 10);
    g.lineStyle(2, 0x4488cc);
    g.strokeRoundedRect(0, 0, 200, 50, 10);
    g.generateTexture('button', 200, 50);
    g.destroy();

    // Tray background
    const g2 = this.make.graphics({ x: 0, y: 0, add: false });
    g2.fillStyle(0x111122);
    g2.fillRect(0, 0, 800, 90);
    g2.lineStyle(2, 0x334466);
    g2.lineBetween(0, 0, 800, 0);
    g2.generateTexture('tray_bg', 800, 90);
    g2.destroy();

    // Part slot in tray
    const g3 = this.make.graphics({ x: 0, y: 0, add: false });
    g3.fillStyle(0x1a1a33);
    g3.fillRoundedRect(0, 0, 64, 64, 8);
    g3.lineStyle(2, 0x334466);
    g3.strokeRoundedRect(0, 0, 64, 64, 8);
    g3.generateTexture('tray_slot', 64, 64);
    g3.destroy();

    // Heart / life icon
    const g4 = this.make.graphics({ x: 0, y: 0, add: false });
    g4.fillStyle(0xee4444);
    g4.fillCircle(10, 10, 10);
    g4.fillCircle(22, 10, 10);
    g4.fillTriangle(0, 14, 32, 14, 16, 30);
    g4.generateTexture('life_icon', 32, 32);
    g4.destroy();

    // Star particle
    const g5 = this.make.graphics({ x: 0, y: 0, add: false });
    g5.fillStyle(0xffee44);
    g5.fillCircle(8, 8, 8);
    g5.generateTexture('spark', 16, 16);
    g5.destroy();
  }

  createParticleTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particle', 8, 8);
    g.destroy();
  }
}