const Phaser = window.Phaser;

export default class Part extends Phaser.GameObjects.Container {
  constructor(scene, x, y, partData) {
    super(scene, x, y);
    this.partData = partData;
    this.partId = partData.id;
    this.startX = x;
    this.startY = y;
    this.isUsed = false;
    this.baseScale = 1;

    this.build();
    scene.add.existing(this);
    this.setDepth(20);
  }

  build() {
    this.slotBg = this.scene.add.rectangle(0, 0, 60, 60, 0x1a1a33);
    this.slotBg.setStrokeStyle(1, 0x334466);
    this.add(this.slotBg);

    this.sprite = this.scene.add.image(0, 0, `part_${this.partId}`);
    this.sprite.setDisplaySize(44, 44);
    this.add(this.sprite);

    this.iconLabel = this.scene.add.text(0, -22, this.partData.label, {
      fontSize: '22px',
    }).setOrigin(0.5);
    this.add(this.iconLabel);

    this.setSize(60, 60);
    this.setInteractive({ draggable: true });

    this.on('dragstart', (pointer) => {
        this.setDepth(100);
        this.scene.tweens.add({ targets: this, scaleX: this.baseScale * 1.3, scaleY: this.baseScale * 1.3, duration: 100 });
    });

    this.on('drag', (pointer, dragX, dragY) => {
        // Update local position relative to container
        this.x = dragX;
        this.y = dragY;
    });

    this.on('dragend', (pointer) => {
        this.setDepth(20);
        this.setScale(this.baseScale);

        // USE WORLD COORDINATES FOR COLLISION
        const worldX = pointer.x;
        const worldY = pointer.y;

        let machines = this.scene.machines || [];
        if (typeof machines.getChildren === 'function') machines = machines.getChildren();

        let hit = false;
        for (const machine of machines) {
            if (machine.isDestroyed) continue;
            
            // Machine world bounds (assuming body is centered on machine.x, machine.y)
            const mw = machine.machineType.bodyWidth;
            const mh = machine.machineType.bodyHeight;
            const worldBounds = new Phaser.Geom.Rectangle(
                machine.x - mw / 2, 
                machine.y - mh / 2,
                mw,
                mh
            );

            if (worldBounds.contains(worldX, worldY)) {
                if (machine.tryFillSlot(this.partId)) {
                    this.markUsed();
                    this.scene.soundManager.playPartPlace();
                    hit = true;
                    break;
                } else {
                    this.scene.scoreManager.onWrongPart();
                    this.scene.soundManager.playWrongPart();
                    machine.flashError();
                }
            }
        }

        if (!hit) {
            this.scene.tweens.add({
                targets: this,
                x: this.startX,
                y: this.startY,
                duration: 250,
                ease: 'Back.Out'
            });
        }
    });
  }

  setUIScale(scale) {
    this.baseScale = scale;
    this.setScale(scale);
  }

  markUsed() {
    this.isUsed = true;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.5,
      scaleY: 0.5,
      duration: 200,
      onComplete: () => {
        this.scene.time.delayedCall(50, () => {
          this.isUsed = false;
          this.x = this.startX;
          this.y = this.startY;
          this.setAlpha(1);
          this.setScale(this.baseScale);
        });
      },
    });
  }
}