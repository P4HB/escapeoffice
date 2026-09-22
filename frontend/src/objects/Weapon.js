import { GAME, weaponStats } from '../config/balance.js';
import { combatTargets, targetInRange } from '../services/runState.js';

export class Weapon {
  constructor(scene, player, key) {
    this.scene = scene;
    this.player = player;
    this.key = key;
    this.level = 1;
    this.lastFired = -Infinity;
    this.applyStats();
  }
  applyStats() { Object.assign(this, weaponStats(this.key, this.level)); }
  update(time) {
    if (time >= this.lastFired + this.cooldown && this.fire()) this.lastFired = time;
  }
  upgrade() {
    if (this.level >= GAME.maxWeaponLevel) return false;
    this.level++;
    this.applyStats();
    return true;
  }
  destroy() {}
}

export class DroppedWeapon extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, weaponKey) {
    super(scene, x, y, weaponKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDisplaySize(28, 28).setTint(0xffdddd);
    this.weaponKey = weaponKey;
    this.expiresAt = scene.run.elapsedMs + GAME.dropLifetimeMs;
  }
}

export class RangedWeapon extends Weapon {
  createBullet(angle) {
    const bullet = this.scene.bullets.create(this.player.x, this.player.y, this.key);
    bullet.setDisplaySize(18, 18);
    bullet.body.setSize(bullet.width, bullet.height);
    bullet.damage = this.damage;
    bullet.expiresAt = this.scene.run.elapsedMs + this.range / this.speed * 1000;
    bullet.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
    return true;
  }
  fire() {
    let closest;
    let distance = this.range;
    for (const target of combatTargets(this.scene)) {
      const d = Math.hypot(target.x - this.player.x, target.y - this.player.y);
      if (d <= distance) { closest = target; distance = d; }
    }
    if (!closest) return false;
    return this.createBullet(Math.atan2(closest.y - this.player.y, closest.x - this.player.x));
  }
}
export class Coffee extends RangedWeapon {
  constructor(scene, player) { super(scene, player, 'coffee'); }
}
export class BackupUSB extends RangedWeapon {
  constructor(scene, player) { super(scene, player, 'usb'); }
}
export class MouseWeapon extends RangedWeapon {
  constructor(scene, player) { super(scene, player, 'mouse'); }
  fire() { return this.createBullet(this.player.facingAngle); }
}

export class BombWeapon extends Weapon {
  constructor(scene, player) { super(scene, player, 'bomb'); }
  fire() {
    this.scene.bombs.add(new BombObject(this.scene, this.player.x, this.player.y,
      this.damage, this.life, this.radius));
    return true;
  }
}
export class BombObject extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, damage, life, explosionRadius) {
    super(scene, x, y, 'bomb');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDisplaySize(36, 36).setTint(0xff9999);
    this.damage = damage;
    this.explosionRadius = explosionRadius;
    this.expiresAt = scene.run.elapsedMs + life;
  }
}

export class SpinningWeapon extends Weapon {
  constructor(scene, player, key = 'typing') {
    super(scene, player, key);
    this.instances = [];
    this.currentAngle = 0;
    // Share a cooldown per target across all orbiting keyboards.
    this.lastHits = new WeakMap();
  }
  update(time, delta = 16) {
    while (this.instances.length < this.count) {
      this.instances.push(this.scene.add.image(this.player.x, this.player.y, this.key).setDisplaySize(28, 28));
    }
    this.currentAngle = (this.currentAngle + this.speed * delta / 1000) % (Math.PI * 2);
    const targets = combatTargets(this.scene);
    for (const [index, instance] of this.instances.entries()) {
      const angle = this.currentAngle + index * Math.PI * 2 / this.count;
      instance.setPosition(this.player.x + Math.cos(angle) * this.radius,
        this.player.y + Math.sin(angle) * this.radius);
      for (const target of targets) {
        if (!target.active || target.hp <= 0) continue;
        if (time - (this.lastHits.get(target) ?? -Infinity) >= this.cooldown
          && targetInRange(instance.x, instance.y, 18, target)) {
          this.lastHits.set(target, time);
          target.takeDamage(this.damage);
          if (this.scene.run.ended) return;
        }
      }
    }
  }
  destroy() {
    this.instances.forEach(instance => instance.destroy());
    this.instances = [];
  }
}
export class Typing extends SpinningWeapon {}
