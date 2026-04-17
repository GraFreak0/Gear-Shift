const Phaser = window.Phaser;

export default class ConveyorBelt extends Phaser.GameObjects.Container {
  constructor(scene, path, theme) {
    super(scene, 0, 0);
    this.path = path;
    this.theme = theme;
    this.beltHeight = 90; 
    this.scrollOffset = 0;
    this.scrollSpeed = 1.5;

    this.build();
    scene.add.existing(this);
  }

  build() {
    this.graphics = this.scene.add.graphics();
    this.add(this.graphics);
    this.setDepth(0);
  }

  setPath(path) {
    this.path = path;
  }

  update(delta, currentSpeed) {
    if (currentSpeed !== undefined) this.scrollSpeed = currentSpeed;
    this.scrollOffset += this.scrollSpeed * (delta / 1000);
    
    const g = this.graphics;
    g.clear();

    const pathLength = this.path.getLength();
    const t = this.theme;

    // 1. Draw the shadow rail bed
    g.lineStyle(this.beltHeight + 16, t.gridColor, 0.4);
    this.path.draw(g);

    // 2. Main belt body
    g.lineStyle(this.beltHeight, t.beltColor, 1);
    this.path.draw(g);

    // 3. Side rails
    g.lineStyle(6, t.beltRail, 1);
    this.path.draw(g);

    // 4. Draw moving segments (treads)
    const segmentWidth = 60;
    const numSegments = Math.ceil(pathLength / segmentWidth) + 1;
    
    for (let i = 0; i < numSegments; i++) {
        const progress = ((i * segmentWidth + (this.scrollOffset % segmentWidth)) % pathLength) / pathLength;
        const pt = this.path.getPoint(progress);
        const tangent = this.path.getTangent(progress);
        
        g.lineStyle(2, 0x000000, 0.15);
        const px = -tangent.y * (this.beltHeight / 2);
        const py = tangent.x * (this.beltHeight / 2);
        g.lineBetween(pt.x - px, pt.y - py, pt.x + px, pt.y + py);
        
        // Rivets
        g.fillStyle(0x8899aa, 0.6);
        g.fillCircle(pt.x - px * 0.85, pt.y - py * 0.85, 3);
        g.fillCircle(pt.x + px * 0.85, pt.y + py * 0.85, 3);
    }
    
    // 5. Draw arrows
    const arrowSpacing = 160;
    const numArrows = Math.ceil(pathLength / arrowSpacing);
    g.fillStyle(t.beltRail, 0.3);
    for (let i = 0; i < numArrows; i++) {
        const progress = ((i * arrowSpacing + (this.scrollOffset * 0.6 % arrowSpacing)) % pathLength) / pathLength;
        const pt = this.path.getPoint(progress);
        const tangent = this.path.getTangent(progress);
        const angle = Math.atan2(tangent.y, tangent.x);
        
        const size = 12;
        const p1x = pt.x + Math.cos(angle) * size;
        const p1y = pt.y + Math.sin(angle) * size;
        const p2x = pt.x + Math.cos(angle + 2.5) * (size * 0.8);
        const p2y = pt.y + Math.sin(angle + 2.5) * (size * 0.8);
        const p3x = pt.x + Math.cos(angle - 2.5) * (size * 0.8);
        const p3y = pt.y + Math.sin(angle - 2.5) * (size * 0.8);
        
        g.fillTriangle(p1x, p1y, p2x, p2y, p3x, p3y);
    }
  }

  setSpeed(speed) {
    this.scrollSpeed = speed;
  }
}