import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME, MONSTERS, WEAPONS, weaponStats, expForLevel, bossStats, spawnInterval } from '../src/config/balance.js';
import { RunState, addExperience, combatTargets, targetInRange } from '../src/services/runState.js';

test('all pauses freeze the same clock and nesting cannot resume early', () => {
  const run = new RunState();
  run.tick(1000);
  for (const reason of ['upgrade', 'swap', 'chat', 'manual', 'blur']) {
    run.pause(reason); run.tick(30000);
    assert.equal(run.elapsedMs, 1000);
    run.pause('nested'); run.resume(reason); run.tick(30000);
    assert.equal(run.elapsedMs, 1000);
    run.resume('nested');
  }
  run.tick(500); assert.equal(run.elapsedMs, 1500);
  run.ended = true; run.tick(1000); assert.equal(run.elapsedMs, 1500);
});

test('experience crosses multiple increasing thresholds without loss', () => {
  assert.deepEqual(addExperience(1, 0, 160), { level: 3, exp: 24, gained: 2 });
  const toBoss = Array.from({ length: GAME.bossLevel - 1 }, (_, i) => expForLevel(i + 1)).reduce((a,b) => a+b, 0);
  assert.deepEqual(addExperience(1, 0, toBoss), { level: GAME.bossLevel, exp: 0, gained: GAME.bossLevel - 1 });
  assert.ok(MONSTERS.boojang.xp > MONSTERS.file.xp);
  assert.deepEqual(addExperience(1, 5, NaN), { level: 1, exp: 5, gained: 0 });
});

test('weapon progression is bounded and no demonstration damage remains', () => {
  for (const key of Object.keys(WEAPONS)) {
    let damage = 0;
    for (let level = 1; level <= GAME.maxWeaponLevel; level++) {
      const stats = weaponStats(key, level);
      assert.ok(stats.damage > damage && stats.damage < 200);
      assert.ok(stats.cooldown >= 200);
      damage = stats.damage;
    }
    assert.deepEqual(weaponStats(key, 99), weaponStats(key, GAME.maxWeaponLevel));
  }
  assert.ok(bossStats(50).hp < bossStats(0).hp);
  assert.ok(bossStats(50).damage < bossStats(0).damage);
  assert.deepEqual(bossStats(NaN), bossStats(0));
  assert.equal(spawnInterval(999999), 550);
});

test('melee uses the boss body boundary and excludes defeated targets', () => {
  const boss = { active: true, hp: 900, x: 200, y: 0, body: { x: 120, right: 280, y: -60, bottom: 60 } };
  assert.equal(targetInRange(105, 0, 18, boss), true);
  assert.equal(targetInRange(90, 0, 18, boss), false);
  const scene = { monsters: { getChildren: () => [{ active: false, hp: 10 }] }, bossGroup: { getChildren: () => [boss] } };
  assert.deepEqual(combatTargets(scene), [boss]);
});
