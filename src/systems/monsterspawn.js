import Monster from '../objects/Monster.js'

const monsterTable = [
  { key: 'boojang', spawnRate: 5 },
  { key: 'gwajang', spawnRate: 10 },
  { key: 'file', spawnRate: 40 },
  { key: 'bogoseo', spawnRate: 45 }
];

// spawnrate 별 몬스터 선택
function getRandomMonsterKey() {
  const total = monsterTable.reduce((sum, m) => sum + m.spawnRate, 0);
  const rand = Phaser.Math.Between(1, total);
  let sum = 0;

  for (const m of monsterTable) {
    sum += m.spawnRate;
    if (rand <= sum) return m.key;
  }

  return 'file'; // fallback
}

// spawn 함수
export function spawnMonster(scene, player, group) {
  const key = getRandomMonsterKey();
  const x = Phaser.Math.Between(0, 800);
  const y = Phaser.Math.Between(0, 600);
  const monster = new Monster(scene, x, y, player, 'normal', key);
  group.add(monster);
}