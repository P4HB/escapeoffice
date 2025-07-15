export class Weapon {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.cooldown = 500; // milliseconds
    this.lastFired = 0;
    this.damage = 1; // 기본 데미지
    this.level = 1; // 업그레이드 레벨
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

  upgrade() {
    this.level += 1;
    if (this.level >= 7  && this.bulletKey && !this.bulletKey.includes('_max')) {
      this.level = 7;
      this.bulletKey = this.bulletKey + '_max';
      console.log('[⚡] bulletKey:', this.bulletKey);
      return;
    }
    // 기본 업그레이드: 데미지 증가
    this.damage = Math.floor(this.damage * 1.2);
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
    console.log('[⚡] bulletKey 업그레이드됨:', this.bulletKey);
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

  upgrade() {
    super.upgrade();

    // 커피 특별 업그레이드: 데미지 추가 증가
    this.damage = Math.floor(this.damage * 1.2); // 총 44% 증가
  }
}

export class BackupUSB extends RangedWeapon {
  constructor(scene, player) {
    super(scene, player, 'usb', -100, 2);
    this.range = 300; // 기본 사정거리
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
      const velocity = this.scene.physics.velocityFromRotation(angle, this.range);
      bullet.body.setVelocity(velocity.x, velocity.y);
    }
  }

  upgrade() {
    super.upgrade();
    // USB 특별 업그레이드: 사정거리 증가
    this.range = Math.floor(this.range * 1.3); // 30% 증가
  }
}

// 마우스 무기: 플레이어가 이동하는 방향으로 발사
export class MouseWeapon extends RangedWeapon {
  constructor(scene, player) {
    super(scene, player, 'mouse', 250, 8);
    this.fireRate = 300; // 기본 발사 속도
  }
  
  fire() {
    // 플레이어 이동 방향 계산
    const vx = this.player.body.velocity.x;
    const vy = this.player.body.velocity.y;
    if (vx === 0 && vy === 0) return; // 정지 중이면 발사 안함
    const angle = Math.atan2(vy, vx);
    const bullet = this.createBullet();
    if (bullet && bullet.body) {
      const velocity = this.scene.physics.velocityFromRotation(angle, this.fireRate);
      bullet.body.setVelocity(velocity.x, velocity.y);
    }
  }

  upgrade() {
    super.upgrade();
    // 마우스 특별 업그레이드: 발사 속도 증가
    this.cooldown = Math.floor(this.cooldown * 0.9); // 25% 빨라짐
  }
}

export class BombWeapon extends Weapon {
  constructor(scene, player) {
    super(scene, player);
    this.cooldown = 6000; // 6초마다 설치 (기존의 3배)
    this.lastFired = 0;
    this.damage = 30;
    this.bombLife = 2000; // 프린터(지뢰) 유지 시간(ms)
    this.explosionRadius = 100; // 폭발 범위
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
    const textureKey = this.level >= 7 ? 'bomb_max' : 'bomb';
    const bomb = new BombObject(this.scene, this.player.x, this.player.y, this.damage, this.bombLife, this.explosionRadius,textureKey);
    this.scene.bombs.add(bomb);
  }

  upgrade() {
    super.upgrade();
    // 폭탄 특별 업그레이드: 폭발 범위 증가
    this.explosionRadius = Math.floor(this.explosionRadius * 1.1); // 40% 증가
  }
}

// 프린터(지뢰) 오브젝트
export class BombObject extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, damage, life, explosionRadius = 100, textureKey='bomb') {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 0.5);
    this.setScale(0.07);
    this.body.setAllowGravity(false);
    this.damage = damage;
    this.explosionRadius = explosionRadius;
    // 빨간색 tint 적용
    this.setTint(0xff0000);
    // 콜라이더를 원본 이미지 테두리에 맞춤
    const tex = this.texture.getSourceImage();
    this.body.setSize(tex.width, tex.height);
    this.body.setOffset(0, 0);
    // 자동 제거 타이머 제거: 몬스터와 충돌할 때까지 유지
  }
}

// 회전 무기 클래스 (Spinning Weapon)
export class SpinningWeapon extends Weapon {
  constructor(scene, player, weaponKey, damage = 10, rotationRadius = 1) {
    super(scene, player);
    this.weaponKey = weaponKey;
    this.damage = damage;
    this.rotationRadius = rotationRadius;
    this.rotationSpeed = 2; // 회전 속도 (라디안/초)
    this.currentAngle = 0;
    this.instances = []; // 무기 인스턴스들
  }

  update(time) {
    // 레벨에 따라 무기 인스턴스 수 o

    let instanceCount = this.level;
    if (this.level ===7){
      instanceCount = 6;
    }
    const angleStep = (2 * Math.PI) / instanceCount; // 360도 / 인스턴스 수
    
    // 필요한 만큼 인스턴스 생성
    while (this.instances.length < instanceCount) {
      const instance = new SpinningWeaponInstance(
        this.scene, 
        this.player, 
        this.weaponKey, 
        this.damage,
        this.rotationRadius,
        this.instances.length * angleStep
      );
      this.instances.push(instance);
    }
    
    // 불필요한 인스턴스 제거
    while (this.instances.length > instanceCount) {
      const instance = this.instances.pop();
      if (instance && instance.active) {
        instance.destroy();
      }
    }
    
    // 모든 인스턴스 업데이트
    this.instances.forEach((instance, index) => {
      if (instance && instance.active) {
        instance.update(time, this.rotationSpeed, this.currentAngle + (index * angleStep));
      }
    });
    
    // 전체 회전 각도 업데이트
    this.currentAngle += this.rotationSpeed * (this.scene.game.loop.delta / 1000);
  }

  upgrade() {
    super.upgrade();
    // 회전 무기 특별 업그레이드: 회전 속도 증가
    this.rotationSpeed *= 1.2; // 20% 빨라짐
    
    // 기존 인스턴스들의 회전 반경도 업데이트
    this.instances.forEach(instance => {
      if (instance && instance.active) {
        instance.rotationRadius = this.rotationRadius;
      }
    });
  }
}

// 회전 무기 인스턴스
export class SpinningWeaponInstance extends Phaser.GameObjects.Sprite {
  constructor(scene, player, weaponKey, damage, rotationRadius, baseAngle) {
    super(scene, 0, 0, weaponKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    scene.spinningWeapons.add(this);
    this.body.setAllowGravity(false);
    this.player = player;
    this.damage = damage;
    this.rotationRadius = rotationRadius;
    this.baseAngle = baseAngle;
    
    this.setOrigin(0.5, 0.5);
    this.setScale(0.03);
    
    this.body.setCircle(this.width/2);  
    // 데미지 적용 쿨다운
    this.lastDamageTime = 0;
    this.damageCooldown = 1000; // 200ms 쿨다운
  }

  update(time, rotationSpeed, currentAngle) {
    // 플레이어 주변 회전 위치 계산
    const x = this.player.x + Math.cos(currentAngle) * this.rotationRadius;
    const y = this.player.y + Math.sin(currentAngle) * this.rotationRadius;
    
    // 위치 설정
    this.x = x;
    this.y = y;
    
    // 몬스터와의 충돌 체크 및 데미지 적용
    // if (time - this.lastDamageTime > this.damageCooldown) {
    //   const monsters = this.scene.monsters?.getChildren?.() || [];
    //   let hitMonster = false;
      
    //   monsters.forEach(monster => {
    //     if (monster.active) {
    //       const distance = Phaser.Math.Distance.Between(this.x, this.y, monster.x, monster.y);
    //       if (distance < 30) { // 충돌 범위
    //         if (typeof monster.takeDamage === 'function') {
    //           monster.takeDamage(this.damage);
    //           hitMonster = true;
    //         }
    //       }
    //     }
    //   });
      
    //   if (hitMonster) {
    //     this.lastDamageTime = time;
    //   }
    // }
  }
}

// Typing 무기
export class Typing extends SpinningWeapon {
  constructor(scene, player) {
    super(scene, player, 'typing', 5, 120);
    this.rotationSpeed = 2.5; // Typing는 조금 더 빠르게 회전
  }

  upgrade() {
    super.upgrade();
    // Typing 특별 업그레이드: 회전 반경 증가
    if (this.level === 7 && this.weaponKey && !this.weaponKey.includes('_max')) {
      this.weaponKey = this.weaponKey + '_max';
    }
    this.rotationRadius = Math.floor(this.rotationRadius * 1.1); // 10% 증가
    
    // 기존 인스턴스들의 회전 반경도 업데이트
    this.instances.forEach(instance => {
      if (instance && instance.active) {
        instance.rotationRadius = this.rotationRadius;
        if (this.level >= 7) {
          const newKey = this.weaponKey.includes('_max') ? this.weaponKey : `${this.weaponKey}_max`;
          instance.setTexture(newKey);
        }
      }
    });
  }
}

// 경험치 오브젝트는 Exp.js에서 관리
