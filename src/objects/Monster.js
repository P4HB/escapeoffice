// objects/Monster.js
export default class Monster extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, player, type = 'normal') {
    super(scene, x, y, 'monster');

    this.scene = scene;
    this.player = player;
    this.type = type;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);

    // 기본 속성
    const monsterStats = {
      normal:  { hp: 3, speed: 50, damage: 1 },
      fast:    { hp: 2, speed: 100, damage: 1 },
      tank:    { hp: 6, speed: 30, damage: 2 },
      boss:    { hp: 20, speed: 40, damage: 5 }
    };

    const stats = monsterStats[type] || monsterStats['normal'];
    this.hp = stats.hp;
    this.speed = stats.speed;
    this.damage = stats.damage;

    // 공격 쿨다운 예시 (선택)
    this.attackCooldown = 1000; // 1초
    this.lastAttackTime = 0;
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
    this.destroy(); // 몬스터 제거
  }

  tryAttack(player, currentTime) {
    if (currentTime - this.lastAttackTime > this.attackCooldown) {
      player.takeDamage(this.damage); // 플레이어가 damage 메서드를 가진다고 가정
      this.lastAttackTime = currentTime;
    }
  }
}
