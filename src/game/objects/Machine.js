const Phaser = window.Phaser;

export default class Machine extends Phaser.GameObjects.Container {
  constructor(scene, x, y, machineType) {
    super(scene, x, y);
    this.machineType = machineType;
    this.slots = [];
    this.filledSlots = new Set();
    this.isFixed = false;
    this.isFixed = false;
    this.isDestroyed = false;
    this.pathProgress = 0; // 0 to 1

    this.setDepth(5); // Explicitly above the belt
    this.build();
    scene.add.existing(this);
  }

  followPath(path, speed, delta) {
    if (this.isDestroyed || !path) return;
    const pathLength = path.getLength();
    const step = (speed * delta * 0.001) / pathLength;
    this.pathProgress += step;
    
    if (this.pathProgress > 1) {
      this.isDestroyed = true;
      this.emit('exit');
      return;
    }

    const pos = path.getPoint(this.pathProgress);
    this.setPosition(pos.x, pos.y);
  }

  build() {
    const mt = this.machineType;

    // Body
    this.body = this.scene.add.rectangle(0, 0, mt.bodyWidth, mt.bodyHeight, mt.color);
    this.body.setStrokeStyle(3, 0xffffff, 0.2);
    this.add(this.body);

    // Machine label
    this.nameText = this.scene.add.text(0, -mt.bodyHeight / 2 - 14, mt.name, {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#aabbcc',
    }).setOrigin(0.5);
    this.add(this.nameText);

    // Broken indicator pulsing red light
    this.warningLight = this.scene.add.circle(-mt.bodyWidth / 2 + 10, -mt.bodyHeight / 2 + 10, 6, 0xff4444);
    this.add(this.warningLight);
    this.scene.tweens.add({
      targets: this.warningLight,
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Grill lines decoration
    const grill = this.scene.add.graphics();
    grill.lineStyle(1, 0x000000, 0.2);
    for (let i = -mt.bodyWidth / 2 + 15; i < mt.bodyWidth / 2 - 5; i += 12) {
      grill.lineBetween(i, -mt.bodyHeight / 2 + 5, i, mt.bodyHeight / 2 - 5);
    }
    this.add(grill);

    // Slots — generated fresh each spawn so parts are always randomised
    const slotDefs = mt.getSlots ? mt.getSlots() : (mt.slots || []);
    slotDefs.forEach(slotDef => {
      const slot = this.createSlot(slotDef);
      this.slots.push(slot);
    });

    // Drop zone setup — we use the machine body's interactive area for drops
    this.body.setInteractive({ dropZone: true });
    this.body.machineRef = this;
  }

  createSlot(slotDef) {
    const slotContainer = this.scene.add.container(slotDef.x, slotDef.y);

    const bg = this.scene.add.circle(0, 0, 18, 0x111122);
    bg.setStrokeStyle(2, 0xff4444);
    slotContainer.add(bg);

    const label = this.scene.add.text(0, 0, slotDef.label, {
      fontSize: '16px',
    }).setOrigin(0.5);
    slotContainer.add(label);

    // Pulse animation on empty slot
    const pulse = this.scene.tweens.add({
      targets: bg,
      strokeAlpha: 0.2,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    const slotData = {
      id: slotDef.id,
      requiredPart: slotDef.requiredPart,
      container: slotContainer,
      bg,
      label,
      pulse,
      filled: false,
    };

    this.add(slotContainer);
    return slotData;
  }

  tryFillSlot(partId) {
    // Find the first unfilled slot that matches this part
    const slot = this.slots.find(s => !s.filled && s.requiredPart === partId);
    if (!slot) return false;

    slot.filled = true;
    this.filledSlots.add(slot.id);

    // Update slot visual
    slot.bg.setStrokeStyle(2, 0x44ff44);
    slot.bg.setFillStyle(0x224422);
    slot.pulse.stop();
    slot.bg.setAlpha(1);

    // Check if all slots are filled
    if (this.filledSlots.size === this.slots.length) {
      this.markFixed();
    }

    return true;
  }

  markFixed() {
    this.isFixed = true;
    this.emit('fixed', this);

    // Change body color to green
    this.scene.tweens.add({
      targets: this.body,
      fillColor: 0x44aa44,
      duration: 300,
    });
    this.body.setStrokeStyle(3, 0x66ff66, 0.5);

    // Remove warning light
    this.scene.tweens.add({
      targets: this.warningLight,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.warningLight.setVisible(false);
        // Add green check
        const check = this.scene.add.text(0, 0, '✓', {
          fontSize: '32px',
          fontFamily: 'monospace',
          color: '#44ff44',
        }).setOrigin(0.5);
        this.add(check);
        this.scene.tweens.add({
          targets: check,
          y: -30,
          alpha: 0,
          scaleX: 2,
          scaleY: 2,
          duration: 800,
          onComplete: () => check.destroy(),
        });
      },
    });
  }

  getRequiredParts() {
    return this.slots
      .filter(s => !s.filled)
      .map(s => s.requiredPart);
  }

  getAllRequiredParts() {
    return this.slots.map(s => s.requiredPart);
  }

  setUrgent(urgent) {
    if (this._urgent === urgent) return;
    this._urgent = urgent;
    if (urgent) {
      this.body.setStrokeStyle(3, 0xff4400, 1);
      if (!this._urgentTween) {
        this._urgentTween = this.scene.tweens.add({
          targets: this,
          y: this.y + 4,
          duration: 150,
          yoyo: true,
          repeat: -1,
        });
      }
    } else {
      this.body.setStrokeStyle(3, 0xffffff, 0.2);
      if (this._urgentTween) {
        this._urgentTween.stop();
        this._urgentTween = null;
        this.y = Math.round(this.y);
      }
    }
  }

  flashError() {
    this.scene.tweens.add({
      targets: this.body,
      alpha: 0.3,
      duration: 80,
      yoyo: true,
      repeat: 3,
    });
  }
}