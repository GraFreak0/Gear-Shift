const Phaser = window.Phaser;

export default class ConveyorBelt extends Phaser.GameObjects.Container {
  constructor(scene, path, theme) {
    super(scene, 0, 0);
    this.path = path;
    this.theme = theme;
    this.beltHeight = 50;
    this.scrollOffset = 0;
    this.scrollSpeed = 1.5;

    this.build();
    scene.add.existing(this);
  }

  build() {
    this.graphics = this.scene.add.graphics();
    this.add(this.graphics);
    this.setDepth(1);
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

    // 1. Draw the underlayer (shadow/rail bed)
    g.lineStyle(this.beltHeight + 10, t.gridColor, 0.5);
    this.path.draw(g);

    // 2. Draw the main belt body
    g.lineStyle(this.beltHeight, t.beltColor, 1);
    this.path.draw(g);

    // 3. Draw the side rails (top and bottom)
    // We can simulate these by drawing two thinner lines
    g.lineStyle(4, t.beltRail, 1);
    // Offset drawing is hard with Path.draw, but we can draw the path again
    // For simplicity, we draw the path shifted or just one center line
    this.path.draw(g);

    // 4. Draw moving segments (treads)
    // We sample points along the path based on scrollOffset
    const segmentWidth = 60;
    const numSegments = Math.ceil(pathLength / segmentWidth) + 1;
    
    g.lineStyle(2, 0x000000, 0.2);
    for (let i = 0; i < numSegments; i++) {
        const progress = ((i * segmentWidth + (this.scrollOffset % segmentWidth)) % pathLength) / pathLength;
        const pt = this.path.getPoint(progress);
        const tangent = this.path.getTangent(progress);
        
        g.save();
        g.lineStyle(1, 0x667788, 0.5);
        // Draw a line perpendicular to the tangent
        const px = -tangent.y * (this.beltHeight / 2);
        const py = tangent.x * (this.beltHeight / 2);
        g.lineBetween(pt.x - px, pt.y - py, pt.x + px, pt.y + py);
        
        // Rivets
        g.fillStyle(0x667788, 0.8);
        g.fillCircle(pt.x - px * 0.8, pt.y - py * 0.8, 2);
        g.fillCircle(pt.x + px * 0.8, pt.y + py * 0.8, 2);
        g.restore();
    }
    
    // 5. Draw arrows
    const arrowSpacing = 120;
    const numArrows = Math.ceil(pathLength / arrowSpacing);
    g.fillStyle(t.beltRail, 0.3);
    for (let i = 0; i < numArrows; i++) {
        const progress = ((i * arrowSpacing + (this.scrollOffset * 0.5 % arrowSpacing)) % pathLength) / pathLength;
        const pt = this.path.getPoint(progress);
        const tangent = this.path.getTangent(progress);
        const angle = Math.atan2(tangent.y, tangent.x);
        
        g.save();
        g.translateCanvas(pt.x, pt.y);
        g.rotateCanvas(angle);
        g.fillTriangle(0, -6, 12, 0, 0, 6);
        g.restore();
    }
  }

  setSpeed(speed) {
    this.scrollSpeed = speed;
  }
}