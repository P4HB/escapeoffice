export default class EmailProjectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, target, damage = 20) {
    super(scene, x, y, 'email');

    this.scene = scene;
    this.damage = damage;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setActive(true);
    this.setVisible(true);
    this.setScale(0.2);

    this.body.setAllowGravity(false);
    this.body.setImmovable(false);
    this.body.moves = true; // ✅ 필수

    // ✅ velocity 설정을 딜레이 안에서!
    this.scene.time.delayedCall(0, () => {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
      this.scene.physics.velocityFromRotation(angle, 200, this.body.velocity);
      console.log("📧 velocity 설정됨 →", this.body.velocity);
    });

    this.scene.time.delayedCall(3000, () => this.destroy(), null, this);
  }
}
