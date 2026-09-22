export class ExpObject extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, amount) {
    super(scene, x, y, 'exp');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDisplaySize(18, 18);
    this.amount = amount;
    this.expiresAt = scene.run.elapsedMs + 90000;
  }
}
