import Phaser from 'phaser';

export class ExpObject extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, amount) {
    super(scene, x, y, 'exp');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 0.5);
    this.setScale(0.06);
    this.body.setAllowGravity(false);
    this.amount = amount; // 획득 경험치량
    // bobbing effect
    this.baseY = y;
    this.bobTime = 0;
  }
  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    this.bobTime += delta;
    const bobOffset = Math.sin(this.bobTime * 0.005) * 4;
    this.y = this.baseY + bobOffset;
  }
} 