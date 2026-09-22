import Monster from '../objects/Monster.js';
import { GAME, MONSTERS, clamp } from '../config/balance.js';

// Keep new enemies near enough to reach the action, including at map edges.
export function findSpawnPosition(scene, player, distance = 360) {
  const bounds = scene.physics.world.bounds;
  const start = Math.random() * Math.PI * 2;
  let best = { x: player.x, y: player.y, distance: -1 };
  for (let i = 0; i < 12; i++) {
    const angle = start + i * Math.PI / 6;
    const x = clamp(player.x + Math.cos(angle) * distance, bounds.x + 60, bounds.right - 60);
    const y = clamp(player.y + Math.sin(angle) * distance, bounds.y + 60, bounds.bottom - 60);
    const d = Math.hypot(x - player.x, y - player.y);
    if (d >= distance * 0.8) return { x, y };
    if (d > best.distance) best = { x, y, distance: d };
  }
  return best;
}
export function spawnMonster(scene, player, group) {
  if (group.countActive(true) >= GAME.maxMonsters) return;
  const entries = Object.entries(MONSTERS).filter(([key]) =>
    (key !== 'boojang' || scene.run.elapsedMs >= 60000) &&
    (key !== 'gwajang' || scene.run.elapsedMs >= 25000));
  let roll = Math.random() * entries.reduce((sum, [, stats]) => sum + stats.weight, 0);
  let key = entries[0][0];
  for (const [candidate, stats] of entries) {
    roll -= stats.weight;
    if (roll <= 0) { key = candidate; break; }
  }
  const pos = findSpawnPosition(scene, player);
  const monster = new Monster(scene, pos.x, pos.y, player, 'normal', key);
  group.add(monster);
  return monster;
}
