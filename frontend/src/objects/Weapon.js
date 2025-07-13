export class Weapon {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.cooldown = 500; // milliseconds
    this.lastFired = 0;
    this.damage = 1; // 기본 데미지
  }

  update(time) {
    if (time > this.lastFired + this.cooldown) {
      this.fire();
      this.lastFired = time;
    }
  }

  fire() {
    // Override in subclass
  }
}

export class RangedWeapon extends Weapon {
  constructor(scene, player, bulletKey, speed = -300, damage = 1) {
    super(scene, player);
    this.bulletKey = bulletKey;
    this.bulletSpeed = speed;
    this.damage = damage;
  }

  createBullet() {
    const bullet = this.scene.bullets.create(this.player.x, this.player.y, this.bulletKey);

    if (bullet) {
        bullet.body.setAllowGravity(false);
        bullet.setScale(0.03);
        bullet.damage = this.damage;
    }
    return bullet;
  }

  fire() {
    const bullet = this.createBullet();
    if (bullet) {
        bullet.setVelocityY(this.bulletSpeed); 
    }
  }
}

export class Coffee extends RangedWeapon {
  constructor(scene, player) {
    super(scene, player, 'coffee', 150, 20); 
  }
  fire(){
    const bullet = this.createBullet();
    if (bullet && bullet.body) {
        const angle = Phaser.Math.RND.angle();
        const velocity = this.scene.physics.velocityFromRotation(angle, this.bulletSpeed);
        bullet.body.setVelocity(velocity.x, velocity.y);
        // bullet.body.setAllowGravity(false); // 혹시 모르니 여기서도 중력 제거
        // bullet.setScale(0.03);
        // bullet.damage = this.damage;
    } else {
        console.error('!!! Diagnosis FAILED. bullet or bullet.body is missing!');
        if(bullet) bullet.destroy();
        }
    }
}

export class BackupUSB extends RangedWeapon {
  constructor(scene, player) {
    super(scene, player, 'usb', -100, 2);
  }
}