export default class Boss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, player, stats) {
    super(scene, x, y, 'boss');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.player = player;
    Object.assign(this, stats);
    this.maxHp = this.hp;
    this.setDisplaySize(120, 120).setCollideWorldBounds(true).setDepth(11);
    this.body.setSize(this.width * 0.7, this.height * 0.8, true);
    this.hpBar = scene.add.graphics().setDepth(100).setScrollFactor(0);
    this.label = scene.add.text(scene.scale.width / 2, 85, '', {
      fontSize: '18px', color: '#ffaaaa', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.once('destroy', () => { this.hpBar.destroy(); this.label.destroy(); });
    this.updateHpBar();
  }
  update() {
    if (!this.active || this.scene.run.paused) return;
    this.scene.physics.moveToObject(this, this.player, this.speed);
  }
  updateHpBar() {
    const width = Math.min(400, this.scene.scale.width - 60);
    const x = (this.scene.scale.width - width) / 2;
    this.hpBar.clear().fillStyle(0x444444).fillRect(x, 105, width, 10);
    this.hpBar.fillStyle(0xff6666).fillRect(x, 105, width * this.hp / this.maxHp, 10);
    this.label.setText(`거래처 사장  ${this.hp}/${this.maxHp} · 접촉 +${this.damage}분`);
  }
  takeDamage(amount) {
    if (!this.active || this.hp <= 0 || !Number.isFinite(amount) || amount <= 0) return;
    this.hp = Math.max(0, this.hp - amount);
    this.updateHpBar();
    if (this.hp === 0) {
      this.scene.finishRun('ClearScene', { clearTime: this.scene.run.elapsedMs / 1000 });
      this.destroy();
    }
  }
}
