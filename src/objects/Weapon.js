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

// 필드에 드랍되는 무기(아이템) 클래스
export class DroppedWeapon extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, weaponKey) {
    super(scene, x, y, weaponKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 0.5);
    this.setScale(0.04); // 더 작게
    this.body.setAllowGravity(false);
    this.weaponKey = weaponKey; // 'coffee', 'usb', 'mouse', 'bomb' 중 하나
    // 콜라이더를 원본 이미지 테두리에 맞춤
    const tex = this.texture.getSourceImage();
    this.body.setSize(tex.width, tex.height);
    this.body.setOffset(0, 0);
    // bobbing effect
    this.baseY = y;
    this.bobTime = 0;
    // rexOutlinePipeline 적용 (setPipelineData 사용)
    this.setPipeline('rexOutlinePipeline');
    this.setPipelineData('thickness', 4);
    this.setPipelineData('outlineColor', [1, 0.2, 0.2]); // 밝은 빨강
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    // bobbing effect
    this.bobTime += delta;
    const bobOffset = Math.sin(this.bobTime * 0.005) * 6;
    this.y = this.baseY + bobOffset;
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
        
        // 콜라이더를 원본 이미지 테두리에 맞춤
        const tex = bullet.texture.getSourceImage();
        bullet.body.setSize(tex.width, tex.height);
        bullet.body.setOffset(0, 0);
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
  fire() {
    const monsters = this.scene.monsters?.getChildren?.() || [];
    if (!monsters.length) return;
    let minDist = Infinity;
    let target = null;
    const px = this.player.x;
    const py = this.player.y;
    monsters.forEach(monster => {
      const dx = monster.x - px;
      const dy = monster.y - py;
      const dist = dx * dx + dy * dy;
      if (dist < minDist) {
        minDist = dist;
        target = monster;
      }
    });
    if (!target) return;
    const angle = Phaser.Math.Angle.Between(px, py, target.x, target.y);
    const bullet = this.createBullet();
    if (bullet && bullet.body) {
      const velocity = this.scene.physics.velocityFromRotation(angle, 300);
      bullet.body.setVelocity(velocity.x, velocity.y);
    }
  }
}

// 마우스 무기: 플레이어가 이동하는 방향으로 발사
export class MouseWeapon extends RangedWeapon {
  constructor(scene, player) {
    super(scene, player, 'mouse', 250, 8);
  }
  fire() {
    // 플레이어 이동 방향 계산
    const vx = this.player.body.velocity.x;
    const vy = this.player.body.velocity.y;
    if (vx === 0 && vy === 0) return; // 정지 중이면 발사 안함
    const angle = Math.atan2(vy, vx);
    const bullet = this.createBullet();
    if (bullet && bullet.body) {
      const velocity = this.scene.physics.velocityFromRotation(angle, 300);
      bullet.body.setVelocity(velocity.x, velocity.y);
    }
  }
}

export class BombWeapon extends Weapon {
  constructor(scene, player) {
    super(scene, player);
    this.cooldown = 6000; // 6초마다 설치 (기존의 3배)
    this.lastFired = 0;
    this.damage = 30;
    this.bombLife = 2000; // 프린터(지뢰) 유지 시간(ms)
    // 프린터 그룹이 없으면 생성
    if (!scene.bombs) {
      scene.bombs = scene.physics.add.group();
    }
  }

  update(time) {
    if (time > this.lastFired + this.cooldown) {
      this.fire();
      this.lastFired = time;
    }
  }

  fire() {
    // 플레이어 위치에 프린터 설치
    const bomb = new BombObject(this.scene, this.player.x, this.player.y, this.damage, this.bombLife);
    this.scene.bombs.add(bomb);
  }
}

// 프린터(지뢰) 오브젝트
export class BombObject extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, damage, life) {
    super(scene, x, y, 'bomb');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 0.5);
    this.setScale(0.07);
    this.body.setAllowGravity(false);
    this.damage = damage;
    // 콜라이더를 원본 이미지 테두리에 맞춤
    const tex = this.texture.getSourceImage();
    this.body.setSize(tex.width, tex.height);
    this.body.setOffset(0, 0);
    // 자동 제거 타이머 제거: 몬스터와 충돌할 때까지 유지
  }
}