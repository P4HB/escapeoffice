import { GAME, expForLevel } from '../config/balance.js';

// Gameplay time, including cooldowns, advances only while actively playing.
export class RunState {
  elapsedMs = 0;
  pauses = new Set();
  ended = false;
  pause(reason) { this.pauses.add(reason); }
  resume(reason) { this.pauses.delete(reason); }
  get paused() { return this.ended || this.pauses.size > 0; }
  tick(delta) {
    if (!this.paused && Number.isFinite(delta) && delta > 0) this.elapsedMs += delta;
  }
  get remainingSeconds() { return Math.max(0, GAME.durationSeconds - this.elapsedMs / 1000); }
}

export function addExperience(level, exp, amount) {
  if (!Number.isFinite(amount) || amount <= 0) return { level, exp, gained: 0 };
  exp += amount;
  let gained = 0;
  while (exp >= expForLevel(level)) {
    exp -= expForLevel(level++);
    gained++;
  }
  return { level, exp, gained };
}

export function combatTargets(scene) {
  return [...scene.monsters.getChildren(), ...scene.bossGroup.getChildren()]
    .filter(target => target.active && target.hp > 0);
}

export function targetInRange(x, y, radius, target) {
  const body = target.body;
  if (!body) return Math.hypot(x - target.x, y - target.y) <= radius;
  const nearX = Math.max(body.x, Math.min(x, body.right));
  const nearY = Math.max(body.y, Math.min(y, body.bottom));
  return Math.hypot(x - nearX, y - nearY) <= radius;
}
