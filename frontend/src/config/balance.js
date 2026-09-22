// All gameplay values live here; UI and tests consume the same definitions.
export const RULES_VERSION = 2;
export const GAME = Object.freeze({
  durationSeconds: 300, bossLevel: 15, playerSpeed: 190,
  overtimeLimit: 60, invulnerabilityMs: 1500, maxWeapons: 3,
  maxWeaponLevel: 6, maxItems: 3, pickupRadius: 95,
  weaponDropChance: 0.12, dropLifetimeMs: 30000,
  itemSpawnMs: 18000, itemDurationMs: 5000, itemRadius: 240,
  maxMonsters: 100, maxChatCount: 10,
});

export const MONSTERS = Object.freeze({
  file: { name: '파일', hp: 12, speed: 65, damage: 6, xp: 12, weight: 40, size: 38 },
  bogoseo: { name: '보고서', hp: 18, speed: 55, damage: 6, xp: 16, weight: 35, size: 44 },
  gwajang: { name: '과장', hp: 65, speed: 48, damage: 9, xp: 32, weight: 20, size: 64 },
  boojang: { name: '부장', hp: 150, speed: 36, damage: 12, xp: 60, weight: 5, size: 80 },
});

export const WEAPONS = Object.freeze({
  typing: { name: '키보드', type: '회전', damage: 12, cooldown: 500, radius: 85, speed: 2.5,
    description: '주변을 회전하며 일반 적과 보스를 공격', upgradeText: '공격력·회전속도 증가, 홀수 레벨에 개수 증가' },
  coffee: { name: '커피', type: '원거리', damage: 18, cooldown: 700, speed: 300, range: 600,
    description: '가장 가까운 적을 향해 발사', upgradeText: '공격력 +25%' },
  usb: { name: 'USB', type: '조준', damage: 10, cooldown: 450, speed: 420, range: 400,
    description: '사정거리 안의 가장 가까운 적을 조준', upgradeText: '공격력 +18%, 사정거리 +12%' },
  mouse: { name: '마우스', type: '방향 사격', damage: 9, cooldown: 400, speed: 400, range: 600,
    description: '마지막 이동 방향으로 연속 발사', upgradeText: '공격력 +15%, 발사 간격 -10%' },
  bomb: { name: '프린터', type: '설치', damage: 45, cooldown: 3000, radius: 125, life: 2200,
    description: '적과 접촉하거나 2.2초 후 주변에 폭발', upgradeText: '공격력 +20%, 폭발 반경 +10%' },
});

export const expForLevel = level => 60 + (level - 1) * 16;
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function weaponStats(key, level = 1) {
  const base = WEAPONS[key];
  if (!base) throw new Error(`Unknown weapon: ${key}`);
  const n = clamp(level, 1, GAME.maxWeaponLevel) - 1;
  const growth = { typing: 1.18, coffee: 1.25, usb: 1.18, mouse: 1.15, bomb: 1.2 }[key];
  return { ...base, damage: Math.round(base.damage * growth ** n),
    cooldown: Math.round(base.cooldown * (key === 'mouse' ? 0.9 ** n : 1)),
    range: base.range && Math.round(base.range * (key === 'usb' ? 1.12 ** n : 1)),
    radius: base.radius && Math.round(base.radius * (key === 'bomb' ? 1.1 ** n : 1)),
    speed: key === 'typing' ? base.speed * (1 + 0.1 * n) : base.speed,
    count: key === 'typing' ? 1 + Math.floor(n / 2) : 1,
  };
}

export function bossStats(mood = 0) {
  const safeMood = clamp(Number.isFinite(mood) ? mood : 0, -50, 50);
  return { hp: Math.round(1200 - safeMood * 6), damage: Math.round(12 - safeMood * 0.08), speed: 65 };
}

export function spawnInterval(elapsedMs, bossActive = false) {
  return bossActive ? 1800 : Math.max(550, 1300 - Math.floor(elapsedMs / 30000) * 150);
}
