import { test, expect } from '@playwright/test';

async function start(page) {
  await page.goto('/');
  await page.evaluate(async () => { window.testGame = (await import(document.querySelector('script[src*="main.js"]').src)).game; });
  await page.waitForFunction(() => window.testGame.scene.isActive('MenuScene'));
  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.testGame.scene.getScene('GameScene').player?.active);
}

test('upgrades freeze the clock, queue levels, and restart cleans input', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await start(page);
  const pausedAt = await page.evaluate(async () => {
    const s = window.testGame.scene.getScene('GameScene');
    s.player.gainExp(160);
    return s.run.elapsedMs;
  });
  await page.waitForFunction(() => !!window.testGame.scene.getScene('GameScene').weaponUpgradeModalInstance);
  await page.waitForTimeout(300);
  expect(await page.evaluate(async () => window.testGame.scene.getScene('GameScene').run.elapsedMs)).toBeLessThan(pausedAt + 50);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !!window.testGame.scene.getScene('GameScene').weaponUpgradeModalInstance);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !window.testGame.scene.getScene('GameScene').run.paused);
  expect(await page.evaluate(async () => window.testGame.scene.getScene('GameScene').player.obtainedWeapons.typing.level)).toBe(3);
  await page.keyboard.press('Escape');
  const before = await page.evaluate(async () => window.testGame.scene.getScene('GameScene').run.elapsedMs);
  await page.waitForTimeout(200);
  expect(await page.evaluate(async () => window.testGame.scene.getScene('GameScene').run.elapsedMs)).toBe(before);
  await page.keyboard.press('Escape');
  await page.evaluate(async () => window.testGame.scene.getScene('GameScene').finishRun('GameOverScene', {reason:'timeout'}));
  await page.waitForFunction(() => window.testGame.scene.getScene('GameOverScene').input.keyboard?.listenerCount('keydown-SPACE') > 0);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.testGame.scene.isActive('MenuScene'));
  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.testGame.scene.getScene('GameScene').player?.active);
  expect(await page.evaluate(async () => {
    const s = window.testGame.scene.getScene('GameScene');
    return { listeners: s.input.keyboard.listenerCount('keydown-SPACE'), level:s.player.level, paused:s.run.paused };
  })).toEqual({ listeners:1, level:1, paused:false });
  expect(errors).toEqual([]);
});

test('tenth dialogue applies, orbit attacks bosses, and clear saves the new rules', async ({ page }) => {
  await start(page);
  await page.evaluate(async () => {
    const s = window.testGame.scene.getScene('GameScene');
    s.player.level = 15;
  });
  await expect(page.locator('input[name=playerInput]')).toBeVisible();
  for (let i = 0; i < 10; i++) {
    await page.locator('input[name=playerInput]').fill('안녕하세요');
    await page.locator('button[name=sendButton]').click();
  }
  await expect(page.locator('#chat-form')).toHaveCount(0);
  const result = await page.evaluate(async () => {
    const game = window.testGame;
    const s = game.scene.getScene('GameScene');
    game.loop.stop();
    const boss = s.bossGroup.getChildren()[0];
    const weapon = s.player.obtainedWeapons.typing;
    boss.setPosition(s.player.x + weapon.radius, s.player.y);
    boss.body.updateFromGameObject();
    weapon.currentAngle = 0;
    const hp = boss.hp;
    weapon.update(s.run.elapsedMs, 0);
    const firstDamage = hp - boss.hp;
    weapon.upgrade();
    weapon.update(s.run.elapsedMs + 600, 0);
    const upgradedDamage = hp - firstDamage - boss.hp;
    const actualDamage = boss.damage;
    s.handlePlayerHit(s.player, boss);
    const overtime = s.remainingMinutes;
    s.run.elapsedMs = 180000;
    boss.takeDamage(9999);
    game.loop.start(game.step.bind(game));
    return {firstDamage, upgradedDamage, actualDamage, overtime, count:s.chatCount};
  });
  expect(result).toEqual({firstDamage:12, upgradedDamage:14, actualDamage:8, overtime:8, count:10});
  await page.waitForFunction(() => window.testGame.scene.isActive('ClearScene'));
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('escapeoffice.guest.records.v2'))[0].score)).toBe(180);
});

test('weapon replacement, timed bombs, stun overlap, and pickup limits', async ({ page }) => {
  await start(page);
  const result = await page.evaluate(async () => {
    const game = window.testGame;
    const { DroppedWeapon, BombObject } = await import('/src/objects/Weapon.js');
    const { DroppedUsableItem, Skill } = await import('/src/objects/usableitems.js');
    const { default: Monster } = await import('/src/objects/Monster.js');
    const s = game.scene.getScene('GameScene');
    game.loop.stop();
    s.player.update(0, s.cursors, 0);
    const instance = s.player.obtainedWeapons.typing.instances[0];
    s.player.obtainWeapon('coffee'); s.player.obtainWeapon('usb');
    const drop = new DroppedWeapon(s, s.player.x, s.player.y, 'bomb');
    s.handleWeaponPickup(s.player, drop);
    const frozen = s.run.paused;
    s.weaponSwapModalInstance.choose(0);
    const removed = !instance.active;
    const monster = new Monster(s, s.player.x + 100, s.player.y, s.player, 'normal', 'boojang');
    s.monsters.add(monster); monster.body.updateFromGameObject();
    new Skill(s, s.player).use();
    s.run.elapsedMs += 2000;
    new Skill(s, s.player).use();
    const stunUntil = monster.stunnedUntil;
    for(let i=0; i<4; i++) s.handleUsableItemPickup(s.player, new DroppedUsableItem(s, 50+i*30, 50));
    const bomb = new BombObject(s, monster.x, monster.y, 45, 1, 125);
    s.bombs.add(bomb);
    s.update(0, 16);
    s.update(0, 16);
    const bombDamage = 150 - monster.hp;
    const count = s.playerUsableItems.length;
    game.loop.start(game.step.bind(game));
    return {frozen, removed, bombDamage, stunUntil, count};
  });
  expect(result.frozen).toBe(true);
  expect(result.removed).toBe(true);
  expect(result.bombDamage).toBe(45);
  expect(result.stunUntil).toBeGreaterThanOrEqual(7000);
  expect(result.count).toBe(3);
});

test('movement, projectile lifetime and HUD stay consistent across frames', async ({ page }) => {
  await start(page);
  const result = await page.evaluate(async () => {
    const game = window.testGame;
    const s = game.scene.getScene('GameScene');
    game.loop.stop();
    s.cursors.right.isDown = true;
    s.cursors.down.isDown = true;
    s.player.update(0, s.cursors, 16);
    const speed = Math.hypot(s.player.body.velocity.x, s.player.body.velocity.y);
    s.player.obtainWeapon('mouse');
    s.player.obtainedWeapons.mouse.fire();
    const bullet = s.bullets.getChildren()[0];
    s.player.removeWeapon('mouse');
    s.updateHud();
    const hud = [...s.hudNodes];
    for (let i = 0; i < 50; i++) s.updateHud();
    const unchanged = hud.every((node, i) => node === s.hudNodes[i]);
    s.nextSpawnAt = Infinity;
    s.nextItemAt = Infinity;
    s.run.elapsedMs = bullet.expiresAt + 1;
    s.update(0, 16);
    const expired = !bullet.active;
    const until = s.player.invincibleUntil;
    s.setPaused('blur', true);
    const before = s.run.elapsedMs;
    s.update(0, 10000);
    const frozen = s.run.elapsedMs === before && s.player.invincibleUntil === until;
    s.setPaused('blur', false);
    game.loop.start(game.step.bind(game));
    return { speed, unchanged, expired, frozen };
  });
  expect(result.speed).toBeCloseTo(190);
  expect(result.unchanged).toBe(true);
  expect(result.expired).toBe(true);
  expect(result.frozen).toBe(true);
});
