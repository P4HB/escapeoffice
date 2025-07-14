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

// 플레이어로부터 안전한 거리에 있는 랜덤 위치 찾기
function findSafeSpawnPosition(scene, player, minDistance = 200) {
  const maxAttempts = 50; // 최대 시도 횟수
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    // 맵 전체 범위에서 랜덤 위치 생성
    const x = Phaser.Math.Between(50, scene.physics.world.bounds.width - 50);
    const y = Phaser.Math.Between(50, scene.physics.world.bounds.height - 50);
    
    // 플레이어와의 거리 계산
    const distance = Phaser.Math.Distance.Between(player.x, player.y, x, y);
    
    // 안전 거리보다 멀면 해당 위치 반환
    if (distance >= minDistance) {
      return { x, y };
    }
    
    attempts++;
  }
  
  // 최대 시도 횟수를 초과하면 맵 가장자리에서 스폰
  const edge = Phaser.Math.Between(0, 3); // 0: 위, 1: 오른쪽, 2: 아래, 3: 왼쪽
  let x, y;
  
  switch (edge) {
    case 0: // 위쪽 가장자리
      x = Phaser.Math.Between(50, scene.physics.world.bounds.width - 50);
      y = 50;
      break;
    case 1: // 오른쪽 가장자리
      x = scene.physics.world.bounds.width - 50;
      y = Phaser.Math.Between(50, scene.physics.world.bounds.height - 50);
      break;
    case 2: // 아래쪽 가장자리
      x = Phaser.Math.Between(50, scene.physics.world.bounds.width - 50);
      y = scene.physics.world.bounds.height - 50;
      break;
    case 3: // 왼쪽 가장자리
      x = 50;
      y = Phaser.Math.Between(50, scene.physics.world.bounds.height - 50);
      break;
  }
  
  return { x, y };
}

// spawn 함수
export function spawnMonster(scene, player, group) {
  const key = getRandomMonsterKey();
  const spawnPos = findSafeSpawnPosition(scene, player, 200); // 플레이어로부터 200px 이상 떨어진 곳에서 스폰
  const monster = new Monster(scene, spawnPos.x, spawnPos.y, player, 'normal', key);
  group.add(monster);
}