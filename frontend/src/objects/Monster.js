import { DroppedWeapon } from './Weapon.js';
import { ExpObject } from './Exp.js';
import { GAME, MONSTERS, WEAPONS } from '../config/balance.js';

export default class Monster extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, player, type = 'normal', key = 'file') {
    super(scene, x, y, key);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.player = player;
    const stats = MONSTERS[key];
    Object.assign(this, { hp: stats.hp, maxHp: stats.hp, speed: stats.speed, damage: stats.damage, xp: stats.xp });
    this.setDisplaySize(stats.size, stats.size).setCollideWorldBounds(true);
    this.body.setSize(this.width * 0.6, this.height * 0.7, true);
    this.stunnedUntil = 0;
    this.hpBar = scene.add.graphics().setDepth(20);
    this.once('destroy', () => this.hpBar.destroy());
  }
  update() {
    if (!this.active || this.scene.run.paused) return;
    if (this.scene.run.elapsedMs < this.stunnedUntil) {
      this.setVelocity(0, 0).setTint(0x7777ff);
    } else {
      this.clearTint();
      this.scene.physics.moveToObject(this, this.player, this.speed);
    }
    const width = this.displayWidth;
    this.hpBar.clear();
    if (this.hp < this.maxHp) {
      this.hpBar.fillStyle(0x444444).fillRect(this.x - width / 2, this.y - width / 2 - 8, width, 4);
      this.hpBar.fillStyle(0x33ff66).fillRect(this.x - width / 2, this.y - width / 2 - 8, width * this.hp / this.maxHp, 4);
    }
  }
  takeDamage(amount) {
    if (!this.active || this.hp <= 0 || !Number.isFinite(amount) || amount <= 0) return;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp === 0) this.die();
  }
  die() {
    const scene = this.scene;
    const chance = GAME.weaponDropChance * (Object.keys(this.player.obtainedWeapons).length < GAME.maxWeapons ? 2 : 1);
    if (Math.random() < chance && scene.weapons.countActive(true) < 12) {
      const keys = Object.keys(WEAPONS).filter(key => !this.player.obtainedWeapons[key]);
      scene.weapons.add(new DroppedWeapon(scene, this.x, this.y, Phaser.Utils.Array.GetRandom(keys)));
    }
    scene.exps.add(new ExpObject(scene, this.x, this.y, this.xp));
    this.destroy();
  }
}
