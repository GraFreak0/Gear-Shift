const Phaser = window.Phaser;

export default class ConveyorBelt extends Phaser.GameObjects.Container {
  constructor(scene, y, width) {
    super(scene, 0, y);
    this.beltWidth = width;
    this.beltHeight = 50;
    this.scrollOffset = 0;
    this.scrollSpeed = 1.5;

    this.build();
    scene.add.existing(this);
  }

  build() {
    // Belt background
    const beltBg = this.scene.add.rectangle(this.beltWidth / 2, 0, this.beltWidth, this.beltHeight, 0x1a1a2e);
    beltBg.setStrokeStyle(2, 0x334466);
    this.add(beltBg);

    // Top and bottom rails
    const topRail = this.scene.add.rectangle(this.beltWidth / 2, -this.beltHeight / 2 + 5, this.beltWidth, 10, 0x445577);
    this.add(topRail);
    const botRail = this.scene.add.rectangle(this.beltWidth / 2, this.beltHeight / 2 - 5, this.beltWidth, 10, 0x445577);
    this.add(botRail);

    // Segmented belt tiles (will be scrolled)
    this.beltTiles = [];
    const numTiles = Math.ceil(this.beltWidth / 60) + 2;
    for (let i = 0; i < numTiles; i++) {
      const tile = this.createBeltTile(i * 60, 0);
      this.beltTiles.push(tile);
    }

    // Side arrows indicating direction
    const arrowG = this.scene.add.graphics();
    arrowG.fillStyle(0x334466, 0.4);
    for (let x = 40; x < this.beltWidth - 20; x += 80) {
      arrowG.fillTriangle(x, -8, x + 15, 0, x, 8);
    }
    this.add(arrowG);
  }

  createBeltTile(x, y) {
    const g = this.scene.add.graphics();
    this.drawBeltTile(g, x, y);
    this.add(g);
    return { g, baseX: x };
  }

  drawBeltTile(g, x, y) {
    g.clear();
    // Main belt piece
    g.fillStyle(0x2a2a44);
    g.fillRect(x + 2, y - 18, 56, 36);
    // Lighter stripe
    g.fillStyle(0x3a3a55);
    g.fillRect(x + 2, y - 8, 56, 16);
    // Rivet bolts
    g.fillStyle(0x667788);
    g.fillCircle(x + 10, y - 14, 3);
    g.fillCircle(x + 50, y - 14, 3);
    g.fillCircle(x + 10, y + 14, 3);
    g.fillCircle(x + 50, y + 14, 3);
  }

  update(delta) {
    this.scrollOffset += this.scrollSpeed * delta * 0.05;
    const tileW = 60;

    this.beltTiles.forEach((tile, i) => {
      const newX = (tile.baseX + this.scrollOffset) % (this.beltTiles.length * tileW);
      const drawX = newX < 0 ? newX + this.beltTiles.length * tileW : newX;
      this.drawBeltTile(tile.g, drawX - tileW, 0);
    });
  }

  setSpeed(speed) {
    this.scrollSpeed = speed;
  }
}