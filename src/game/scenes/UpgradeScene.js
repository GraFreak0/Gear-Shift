const Phaser = window.Phaser;
import UpgradeManager, { UPGRADES } from '../managers/UpgradeManager.js';
import { ACHIEVEMENTS } from '../managers/AchievementManager.js';

export default class UpgradeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UpgradeScene' });
    }

    init(data) {
        this.sessionXP = data.sessionXP || 0;
    }

    create() {
        const { width, height } = this.cameras.main;
        this.upgradeManager = new UpgradeManager();
        this.upgradeManager.addXP(this.sessionXP);

        // Background
        const bg = this.add.graphics();
        bg.fillStyle(0x0a0a1a);
        bg.fillRect(0, 0, width, height);
        bg.lineStyle(1, 0x111133);
        for (let x = 0; x < width; x += 40) bg.lineBetween(x, 0, x, height);
        for (let y = 0; y < height; y += 40) bg.lineBetween(0, y, width, y);

        this.add.text(width / 2, 32, '⚙ UPGRADE SHOP', {
            fontSize: '28px', fontFamily: 'monospace', color: '#ffcc44', stroke: '#000', strokeThickness: 4,
        }).setOrigin(0.5);

        this.xpText = this.add.text(width / 2, 64, `💰 Total XP: ${this.upgradeManager.totalXP}`, {
            fontSize: '16px', fontFamily: 'monospace', color: '#88ffcc',
        }).setOrigin(0.5);

        if (this.sessionXP > 0) {
            this.add.text(width / 2, 84, `(+${this.sessionXP} from last run)`, {
                fontSize: '12px', fontFamily: 'monospace', color: '#44aa88',
            }).setOrigin(0.5);
        }

        this.upgradeCards = [];
        this.buildUpgradeCards(width, height);
        this.buildAchievementsPanel(width, height);
        this.buildBackButton(width, height);
        this.cameras.main.fadeIn(300);
    }

    buildUpgradeCards(width, height) {
        const startY = 110;
        const cardW = 340;
        const cardH = 64;
        const gap = 10;
        const leftX = width / 2 - cardW - 10;

        this.add.text(leftX, startY - 16, '🔧 PERMANENT UPGRADES', {
            fontSize: '11px', fontFamily: 'monospace', color: '#445566',
        });

        UPGRADES.forEach((upg, i) => {
            const y = startY + i * (cardH + gap);
            this.buildUpgradeCard(leftX, y, cardW, cardH, upg);
        });
    }

    buildUpgradeCard(x, y, w, h, upg) {
        const lvl = this.upgradeManager.getLevel(upg.id);
        const maxed = lvl >= upg.maxLevel;
        const cost = upg.cost * (lvl + 1);
        const affordable = !maxed && this.upgradeManager.totalXP >= cost;

        const bg = this.add.rectangle(x + w / 2, y + h / 2, w, h, maxed ? 0x112211 : affordable ? 0x112233 : 0x111122)
            .setStrokeStyle(1, maxed ? 0x44aa44 : affordable ? 0x4488cc : 0x334466);

        this.add.text(x + 10, y + 10, `${upg.icon} ${upg.name}`, {
            fontSize: '14px', fontFamily: 'monospace', color: maxed ? '#44ff88' : '#aaccff',
        });
        this.add.text(x + 10, y + 30, upg.desc, {
            fontSize: '10px', fontFamily: 'monospace', color: '#556677',
        });

        // Level pips
        for (let i = 0; i < upg.maxLevel; i++) {
            const pip = this.add.rectangle(x + w - 18 - (upg.maxLevel - 1 - i) * 16, y + 16, 10, 10,
                i < lvl ? 0x44ff88 : 0x223344).setStrokeStyle(1, 0x445566);
        }

        const costLabel = maxed ? 'MAXED' : `${cost} XP`;
        const costColor = maxed ? '#44ff88' : affordable ? '#ffcc44' : '#554433';
        this.add.text(x + w - 10, y + h - 12, costLabel, {
            fontSize: '11px', fontFamily: 'monospace', color: costColor,
        }).setOrigin(1, 1);

        if (!maxed) {
            bg.setInteractive({ useHandCursor: affordable });
            bg.on('pointerdown', () => {
                if (!affordable) return;
                const spent = this.upgradeManager.purchase(upg.id, this.upgradeManager.totalXP);
                if (spent !== false) {
                    this.xpText.setText(`💰 Total XP: ${this.upgradeManager.totalXP}`);
                    // Flash feedback
                    this.tweens.add({ targets: bg, alpha: 0.3, duration: 80, yoyo: true, repeat: 2 });
                    this.scene.restart({ sessionXP: 0 });
                }
            });
            bg.on('pointerover', () => { if (affordable) bg.setAlpha(0.8); });
            bg.on('pointerout', () => bg.setAlpha(1));
        }
    }

    buildAchievementsPanel(width, height) {
        const rightX = width / 2 + 10;
        const startY = 110;
        const panelW = 370;

        this.add.text(rightX, startY - 16, '🏅 ACHIEVEMENTS', {
            fontSize: '11px', fontFamily: 'monospace', color: '#445566',
        });

        const bg = this.add.graphics();
        bg.fillStyle(0x0d1020, 0.8);
        bg.fillRoundedRect(rightX, startY, panelW, 400, 8);
        bg.lineStyle(1, 0x223355);
        bg.strokeRoundedRect(rightX, startY, panelW, 400, 8);

        const allAchs = ACHIEVEMENTS.map(a => {
            const saved = JSON.parse(localStorage.getItem('gearworks_achievements') || '[]');
            return { ...a, earned: saved.includes(a.id) };
        });

        const earned = allAchs.filter(a => a.earned);
        const unearned = allAchs.filter(a => !a.earned);
        const sorted = [...earned, ...unearned];

        sorted.forEach((ach, i) => {
            if (i >= 12) return;
            const y = startY + 12 + i * 32;
            this.add.text(rightX + 10, y, ach.icon, {
                fontSize: '16px', alpha: ach.earned ? 1 : 0.3,
            });
            this.add.text(rightX + 34, y, ach.name, {
                fontSize: '12px', fontFamily: 'monospace', color: ach.earned ? '#aaccff' : '#334455',
            });
            this.add.text(rightX + 34, y + 14, ach.desc, {
                fontSize: '9px', fontFamily: 'monospace', color: ach.earned ? '#556677' : '#222233',
            });
            if (ach.earned) {
                this.add.text(rightX + panelW - 10, y + 6, '✓', {
                    fontSize: '14px', fontFamily: 'monospace', color: '#44ff88',
                }).setOrigin(1, 0.5);
            }
        });

        this.add.text(rightX + panelW / 2, startY + 415, `${earned.length} / ${allAchs.length} unlocked`, {
            fontSize: '12px', fontFamily: 'monospace', color: '#445566',
        }).setOrigin(0.5);
    }

    buildBackButton(width, height) {
        const btn = this.add.container(width / 2, height - 28);
        const bg = this.add.rectangle(0, 0, 220, 42, 0x224488).setStrokeStyle(2, 0x4488ff);
        const txt = this.add.text(0, 0, '← BACK TO MENU', { fontSize: '16px', fontFamily: 'monospace', color: '#fff' }).setOrigin(0.5);
        btn.add([bg, txt]);
        btn.setSize(220, 42);
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => bg.setFillStyle(0x3355aa));
        btn.on('pointerout', () => bg.setFillStyle(0x224488));
        btn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}