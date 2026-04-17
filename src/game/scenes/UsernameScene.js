const Phaser = window.Phaser;
import LeaderboardManager from '../managers/LeaderboardManager.js';

export default class UsernameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UsernameScene' });
    }

    create() {
        this.lb = new LeaderboardManager();
        this.username = "";
        this.layout();
    }

    layout() {
        const { width, height } = this.cameras.main;
        this.children.removeAll();
        const isMobile = width < 600;

        // Dark background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0a2a, 0x0a0a2a, 0x050510, 0x050510, 1);
        bg.fillRect(0, 0, width, height);

        const panelW = Math.min(width * 0.95, 500);
        const panelH = isMobile ? height * 0.9 : 420;
        const panel = this.add.container(width / 2, isMobile ? height * 0.45 : height / 2);

        const bgRect = this.add.rectangle(0, 0, panelW, panelH, 0x0d1530, 0.95).setStrokeStyle(2, 0x4488ff);
        panel.add(bgRect);

        const title = this.add.text(0, -panelH/2 + 40, 'IDENTIFICATION', { fontSize: isMobile ? '24px' : '28px', fontWeight: 'bold', color: '#ffffff' }).setOrigin(0.5);
        const desc = this.add.text(0, -panelH/2 + 75, 'Enter your mechanic callsign', { fontSize: '14px', color: '#88aaff' }).setOrigin(0.5);
        panel.add([title, desc]);

        // Input Area
        const inputBg = this.add.rectangle(0, -panelH/2 + 130, panelW - 60, 50, 0x050510, 1).setStrokeStyle(1, 0x334466);
        this.inputText = this.add.text(0, -panelH/2 + 130, '_', { fontSize: '24px', fontFamily: 'monospace', color: '#ffcc44' }).setOrigin(0.5);
        panel.add([inputBg, this.inputText]);

        // Virtual Keyboard for Mobile/Desktop clicks
        this.createVirtualKeyboard(panel, panelW, isMobile);

        // Confirm Button
        const startBtn = this.add.container(0, panelH/2 - 60);
        const sBg = this.add.rectangle(0, 0, 200, 50, 0x224488, 1).setStrokeStyle(2, 0x4488ff);
        const sTxt = this.add.text(0, 0, 'CONFIRM', { fontSize: '18px', fontWeight: 'bold' }).setOrigin(0.5);
        startBtn.add([sBg, sTxt]);
        startBtn.setSize(200, 50).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.submit());
        panel.add(startBtn);

        // Listen for physical keyboard too
        this.input.keyboard.on('keydown', (event) => {
            if (event.keyCode === 8) this.handleKey('BACK');
            else if (event.keyCode === 13) this.submit();
            else if (/^[a-zA-Z0-9]$/.test(event.key)) this.handleKey(event.key.toUpperCase());
        });
    }

    createVirtualKeyboard(panel, panelW, isMobile) {
        const keys = [
            ['1','2','3','4','5','6','7','8','9','0'],
            ['Q','W','E','R','T','Y','U','I','O','P'],
            ['A','S','D','F','G','H','J','K','L'],
            ['Z','X','C','V','B','N','M', 'BACK']
        ];

        const keyW = isMobile ? (panelW - 60) / 10 : 35;
        const keyH = isMobile ? 40 : 35;
        const spacing = isMobile ? 4 : 8;
        const startY = -40;

        keys.forEach((row, rowIndex) => {
            const rowW = row.length * (keyW + spacing) - spacing;
            const startX = -rowW / 2 + keyW / 2;
            
            row.forEach((key, colIndex) => {
                const kX = startX + colIndex * (keyW + spacing);
                const kY = startY + rowIndex * (keyH + spacing);
                
                const isBack = key === 'BACK';
                const finalW = isBack ? keyW * 1.8 : keyW;
                
                const kBtn = this.add.container(kX + (isBack ? keyW * 0.4 : 0), kY);
                const kBg = this.add.rectangle(0, 0, finalW, keyH, 0x1a2a4a, 1).setStrokeStyle(1, 0x334466);
                const kTxt = this.add.text(0, 0, key === 'BACK' ? '⌫' : key, { fontSize: isMobile ? '14px' : '16px', fontWeight: 'bold' }).setOrigin(0.5);
                
                kBtn.add([kBg, kTxt]);
                kBtn.setSize(finalW, keyH).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
                    this.handleKey(key);
                    kBg.setFillStyle(0x4488ff);
                    this.time.delayedCall(100, () => kBg.setFillStyle(0x1a2a4a));
                });
                panel.add(kBtn);
            });
        });
    }

    handleKey(key) {
        if (key === 'BACK') {
            if (this.username.length > 0) this.username = this.username.slice(0, -1);
        } else if (this.username.length < 12) {
            this.username += key;
        }
        this.updateInputText();
    }

    updateInputText() {
        this.inputText.setText(this.username + (this.username.length < 12 ? '_' : ''));
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
