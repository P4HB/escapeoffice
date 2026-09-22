import { Coffee, BackupUSB, MouseWeapon, BombWeapon, Typing } from './Weapon.js';
import { GAME, expForLevel } from '../config/balance.js';
import { addExperience } from '../services/runState.js';

const WEAPON_CLASS_MAP = { coffee: Coffee, usb: BackupUSB, mouse: MouseWeapon, bomb: BombWeapon, typing: Typing };

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDisplaySize(48, 48).setCollideWorldBounds(true).setDepth(10);
    this.body.setSize(this.width * 0.55, this.height * 0.7, true);
    this.obtainedWeapons = {};
    this.exp = 0;
    this.level = 1;
    this.facingAngle = 0;
    this.invincibleUntil = 0;
    this.obtainWeapon('typing');
    this.createExpUI();
    this.updateExpUI();
    this.once('destroy', () => Object.values(this.obtainedWeapons).forEach(weapon => weapon.destroy()));
  }
  get isInvincible() { return this.scene.run.elapsedMs < this.invincibleUntil; }
  setInvincible(duration = GAME.invulnerabilityMs) {
    this.invincibleUntil = this.scene.run.elapsedMs + duration;
    this.setAlpha(0.5);
  }
  update(time, cursors, delta) {
    const x = Number(cursors.right.isDown) - Number(cursors.left.isDown);
    const y = Number(cursors.down.isDown) - Number(cursors.up.isDown);
    const length = Math.hypot(x, y) || 1;
    this.setVelocity(x / length * GAME.playerSpeed, y / length * GAME.playerSpeed);
    if (x || y) this.facingAngle = Math.atan2(y, x);
    if (x) this.setFlipX(x < 0);
    this.setAlpha(this.isInvincible ? 0.5 : 1);
    for (const weapon of Object.values(this.obtainedWeapons)) {
      weapon.update(time, delta);
      if (this.scene.run.ended) break;
    }
  }
  gainExp(amount) {
    const next = addExperience(this.level, this.exp, amount);
    this.exp = next.exp;
    this.level = next.level;
    this.updateExpUI();
    this.scene.queueWeaponUpgrades(next.gained);
  }
  createExpUI() {
    this.expLabel = this.scene.add.text(this.scene.scale.width - 180, 20, '', {
      fontSize: '18px', color: '#ffffff', stroke: '#000000', strokeThickness: 3,
    }).setScrollFactor(0).setDepth(100);
    this.expBar = this.scene.add.graphics().setScrollFactor(0).setDepth(100);
  }
  updateExpUI() {
    this.expLabel.setText(`Lv.${this.level}  ${this.exp}/${expForLevel(this.level)}`);
    const x = this.scene.scale.width - 180;
    this.expBar.clear().fillStyle(0x555555).fillRect(x, 50, 155, 12);
    this.expBar.fillStyle(0x33dd66).fillRect(x, 50, 155 * this.exp / expForLevel(this.level), 12);
  }
  obtainWeapon(key) {
    if (!WEAPON_CLASS_MAP[key] || this.obtainedWeapons[key]
      || Object.keys(this.obtainedWeapons).length >= GAME.maxWeapons) return false;
    this.obtainedWeapons[key] = new WEAPON_CLASS_MAP[key](this.scene, this);
    this.scene.hudDirty = true;
    return true;
  }
  removeWeapon(key) {
    this.obtainedWeapons[key]?.destroy();
    delete this.obtainedWeapons[key];
    this.scene.hudDirty = true;
  }
}
