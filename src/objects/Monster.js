// objects/Monster.js
export default class Monster extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, player, type = 'normal', textureKey = 'monster') {
    super(scene, x, y, textureKey);

    this.scene = scene;
    this.player = player;
    this.type = type;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5); // 중앙 정렬
    const monsterStats = {
      boojang: {hp:1000, speed:30, damage : 5, scale : 0.2},
      gwajang: {hp:30, speed:40, damage : 4, scale : 0.15},
      file : {hp:3, speed:50, damage :1, scale: 0.08},
      bogoseo : {hp:3, speed:50, damage :1, scale: 0.08},
    };

    const stats = monsterStats[textureKey] || {hp: 5, speed:50, damage:1, scale : 0.2};
    this.hp = stats.hp;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.setScale(stats.scale);

    // 콜라이더를 원본 이미지 테두리에 맞춤
    const tex = this.texture.getSourceImage();
    this.body.setSize(tex.width, tex.height);
    this.body.setOffset(0, 0);

    // 콜라이더 설정 확인
    console.log('Monster', textureKey, 'collider set:', this.body.width, 'x', this.body.height);
    console.log('Monster position:', this.x, this.y);

    this.setCollideWorldBounds(true);
  }

  update() {
    if (this.player && this.scene.physics.world) {
      this.scene.physics.moveToObject(this, this.player, this.speed);
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.destroy();
  }

  tryAttack(player, currentTime) {
    if (currentTime - this.lastAttackTime > this.attackCooldown) {
      player.takeDamage(this.damage); // 플레이어가 damage 메서드를 가진다고 가정
      this.lastAttackTime = currentTime;
    }
  }
}
