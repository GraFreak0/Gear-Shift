const Phaser = window.Phaser;
import LeaderboardManager from '../managers/LeaderboardManager.js';

export default class UsernameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UsernameScene' });
    }

    create() {
        const { width, height } = this.cameras.main;
        this.lb = new LeaderboardManager();
        this.layout();
    }

    layout() {
        const { width, height } = this.cameras.main;
        this.children.removeAll();

        // Dark background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0a2a, 0x0a0a2a, 0x050510, 0x050510, 1);
        bg.fillRect(0, 0, width, height);

        const panelW = Math.min(width * 0.9, 440);
        const panelH = 320;
        const panel = this.add.container(width / 2, height / 2);

        const bgRect = this.add.rectangle(0, 0, panelW, panelH, 0x112244, 1).setStrokeStyle(2, 0x4488ff);
        panel.add(bgRect);

        const title = this.add.text(0, -110, 'IDENTIFICATION REQUIRED', { fontSize: '24px', fontWeight: 'bold', color: '#ffffff' }).setOrigin(0.5);
        const desc = this.add.text(0, -70, 'Enter your mechanic callsign\nto join the global rankings.', { fontSize: '14px', align: 'center', color: '#88aaff' }).setOrigin(0.5);
        panel.add([title, desc]);

        // Mock Input Field (since Phaser doesn't have a native one, we use a text object + keyboard listener)
        this.username = "";
        const inputBg = this.add.rectangle(0, 0, panelW - 80, 50, 0x050510, 1).setStrokeStyle(1, 0x334466);
        this.inputText = this.add.text(0, 0, '_', { fontSize: '24px', fontFamily: 'monospace', color: '#ffcc44' }).setOrigin(0.5);
        panel.add([inputBg, this.inputText]);

        const startBtn = this.add.container(0, 90);
        const sBg = this.add.rectangle(0, 0, 200, 50, 0x224488, 1).setStrokeStyle(2, 0x4488ff);
        const sTxt = this.add.text(0, 0, 'CONFIRM', { fontSize: '18px', fontWeight: 'bold' }).setOrigin(0.5);
        startBtn.add([sBg, sTxt]);
        startBtn.setSize(200, 50).setInteractive({ useHandCursor: true });
        
        startBtn.on('pointerdown', () => this.submit());
        panel.add(startBtn);

        // Keyboard listener
        this.input.keyboard.on('keydown', (event) => {
            if (event.keyCode === 8 && this.username.length > 0) {
                this.username = this.username.slice(0, -1);
            } else if (event.keyCode === 13) {
                this.submit();
            } else if (this.username.length < 15 && /^[a-zA-Z0-9]$/.test(event.key)) {
                this.username += event.key;
            }
            this.inputText.setText(this.username + (Math.floor(Date.now()/500) % 2 === 0 ? '_' : ' '));
        });

        // Touch Keyboard support for mobile
        if (width < 600) {
            this.add.text(width / 2, height - 100, '[ USE PHYSICAL OR ON-SCREEN KEYBOARD ]', { fontSize: '12px', color: '#445566' }).setOrigin(0.5);
        }
    }

    submit() {
        if (this.username.length < 3) {
            this.cameras.main.shake(100, 0.01);
            return;
        }
        this.lb.setUsername(this.username);
        this.cameras.main.fade(400, 0, 0, 0);
        this.time.delayedCall(450, () => this.scene.start('MenuScene'));
    }
}
