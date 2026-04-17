const Phaser = window.Phaser;

export default class Part extends Phaser.GameObjects.Container {
  constructor(scene, x, y, partData) {
    super(scene, x, y);
    this.partData = partData;
    this.partId = partData.id;
    this.startX = x;
    this.startY = y;
    this.isUsed = false;

    this.build();
    scene.add.existing(this);
    this.setDepth(10);
  }

  build() {
    // Slot background in tray
    const slotBg = this.scene.add.rectangle(0, 0, 60, 60, 0x1a1a33);
    slotBg.setStrokeStyle(1, 0x334466);
    this.add(slotBg);

    // Part image
    this.sprite = this.scene.add.image(0, 0, `part_${this.partId}`);
    this.sprite.setDisplaySize(44, 44);
    this.add(this.sprite);

    // Emoji icon overlay — must match the label shown on machine slots exactly
    this.iconLabel = this.scene.add.text(0, -14, this.partData.label, {
      fontSize: '18px',
    }).setOrigin(0.5);
    this.add(this.iconLabel);

    // Part name label below the slot
    this.nameLabel = this.scene.add.text(0, 36, this.partData.name, {
      fontSize: '9px',
      fontFamily: 'monospace',
      color: '#778899',
    }).setOrigin(0.5);
    // Rendered separately (outside container) in tray

    // Make draggable
    this.setSize(60, 60);
    this.setInteractive({ draggable: true });

    this.scene.input.on('drag', this.onDrag, this);
    this.scene.input.on('dragstart', this.onDragStart, this);
    this.scene.input.on('dragend', this.onDragEnd, this);
  }

  onDragStart(pointer, gameObject) {
    if (gameObject !== this) return;
    this.setDepth(100);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
    });
  }

  onDrag(pointer, gameObject, dragX, dragY) {
    if (gameObject !== this) return;
    this.x = dragX;
    this.y = dragY;
  }

  onDragEnd(pointer, gameObject, dropped) {
    if (gameObject !== this) return;
    this.setDepth(10);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 100,
    });
    if (!dropped || !this.isUsed) {
      // Return to original position
      this.scene.tweens.add({
        targets: this,
        x: this.startX,
        y: this.startY,
        duration: 250,
        ease: 'Back.Out',
      });
    }
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
        // Respawn the part after a short delay
        this.scene.time.delayedCall(400, () => {
          this.isUsed = false;
          this.x = this.startX;
          this.y = this.startY;
          this.setAlpha(1);
          this.setScale(1);
        });
      },
    });
  }

  destroy() {
    this.scene.input.off('drag', this.onDrag, this);
    this.scene.input.off('dragstart', this.onDragStart, this);
    this.scene.input.off('dragend', this.onDragEnd, this);
    super.destroy();
  }
}