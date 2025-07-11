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

  // 1. ★★★ 공통 로직을 별도 함수로 분리 ★★★
  // 총알을 생성하고, 공통 속성을 설정한 뒤, 생성된 총알 객체를 반환(return)합니다.
  createBullet() {
    const bullet = this.scene.bullets.create(this.player.x, this.player.y, this.bulletKey);

    if (bullet) {
        bullet.body.setAllowGravity(false);
        bullet.setScale(0.03);
        bullet.damage = this.damage;
    }
    return bullet;
  }

  // 2. 기본 fire() 함수는 이제 더 간단해집니다.
  // createBullet()으로 총알을 만들고, 기본 방향(위쪽)으로만 쏘게 합니다.
  fire() {
    const bullet = this.createBullet();
    if (bullet) {
        bullet.setVelocityY(this.bulletSpeed); // 기본 발사 로직
    }
  }
}

export class Coffee extends RangedWeapon {
  constructor(scene, player) {
    super(scene, player, 'coffee', 150, 1); // 속도를 양수로 바꾸는 것이 다루기 편합니다.
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