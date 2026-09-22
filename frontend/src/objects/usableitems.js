import { GAME } from '../config/balance.js';
import { targetInRange } from '../services/runState.js';

export class Skill {
  constructor(scene, player) { this.scene = scene; this.player = player; this.itemKey = 'skill'; }
  use() {
    const until = this.scene.run.elapsedMs + GAME.itemDurationMs;
    for (const monster of this.scene.monsters.getChildren()) {
      if (monster.active && targetInRange(this.player.x, this.player.y, GAME.itemRadius, monster)) {
        monster.stunnedUntil = Math.max(monster.stunnedUntil, until);
        monster.setVelocity(0, 0);
      }
    }
    const effect = this.scene.add.circle(this.player.x, this.player.y, GAME.itemRadius, 0x6666ff, 0.25);
    this.scene.tweens.add({ targets: effect, alpha: 0, duration: 600, onComplete: () => effect.destroy() });
    return true;
  }
}
export class DroppedUsableItem extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'skill');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDisplaySize(30, 30).setTint(0xccffcc);
    this.expiresAt = scene.run.elapsedMs + GAME.dropLifetimeMs;
  }
}
