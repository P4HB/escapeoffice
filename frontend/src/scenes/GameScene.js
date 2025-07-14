// scenes/GameScene.js
import Player from '../objects/Player.js';
import Monster from '../objects/Monster.js';
import { spawnMonster } from '../systems/monsterspawn.js'
import { DroppedWeapon, BombObject } from '../objects/Weapon.js';
import { ExpObject } from '../objects/Exp.js';
import { DroppedUsableItem, Sajikseo } from '../objects/usableitems.js';
import WeaponSwapModal from '../ui/WeaponSwapModal.js';
import WeaponUpgradeModal from '../ui/WeaponUpgradeModal.js';

const WEAPON_IMAGE_KEYS = ['coffee', 'usb', 'mouse', 'bomb', 'airpods'];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.isPausedForWeaponSwap = false;
    this.weaponSwapModalInstance = null;
    this.isPausedForWeaponUpgrade = false;
    this.weaponUpgradeModalInstance = null;
  }

  preload() {
    this.load.image('boojang', '/src/assets/monster/boojang.png');
    this.load.image('gwajang', '/src/assets/monster/gwajang.png');
    this.load.image('file', '/src/assets/monster/file.png');
    this.load.image('bogoseo', '/src/assets/monster/bogoseo.png');
    this.load.image('usb','/src/assets/weapon/usb.png');
    this.load.image('coffee','/src/assets/weapon/coffee.png');
    this.load.image('mouse','/src/assets/weapon/mouse.png');
    this.load.image('bomb','/src/assets/weapon/printer.png');
    this.load.image('airpods','/src/assets/weapon/airpods.png');
    this.load.image('sajikseo','/src/assets/usableitem/sajikseo.png');
    this.load.image('player', 'src/assets/images/Player.png');
    this.load.image('map', '/src/assets/map/map.png');
    this.load.image('map2', '/src/assets/map/map2.png');
    this.load.image('map3','/src/assets/map/map3.png');
    this.load.image('exp', 'src/assets/images/exp.png');
  }

  create() {
    // 맵 이미지 추가 및 변수에 저장
    const map = this.add.image(0, 0, 'map3').setOrigin(0);

    // 맵 이미지 기준으로 월드 바운드 설정
    this.physics.world.setBounds(0, 0, map.width, map.height);
    this.cameras.main.setBounds(0, 0, map.width, map.height);

    this.bullets = this.physics.add.group();
    // 무기 드랍 그룹 생성
    this.weapons = this.physics.add.group();
    this.bombs = this.physics.add.group(); // bomb 그룹 생성
    this.exps = this.physics.add.group(); // 경험치 그룹
    this.usableItems = this.physics.add.group(); // 사용 가능한 아이템 그룹

    // 몬스터 스폰 타이머들 (일시정지 가능하도록 변수에 저장)
    this.monsterSpawnTimer1 = this.time.addEvent({
        delay: 2000, // 2초마다 한 마리
        loop: true,
        callback: this.spawnRandomMonster,
        callbackScope: this
    });

    this.cursors = this.input.keyboard.createCursorKeys()
    
    // 사용 가능한 아이템 사용 키 설정
    this.input.keyboard.on('keydown-SPACE', () => {
      this.useUsableItem(0); // 첫 번째 아이템 사용
    });
    this.input.keyboard.on('keydown-Q', () => {
      this.useUsableItem(1); // 두 번째 아이템 사용
    });
    this.input.keyboard.on('keydown-E', () => {
      this.useUsableItem(2); // 세 번째 아이템 사용
    });
    
    const centerX = this.cameras.main.width / 2
    const centerY = this.cameras.main.height / 2

    this.player = new Player(this, centerX, centerY)
    
    // 사용 가능한 아이템 인벤토리 초기화
    this.playerUsableItems = [];
    this.usableItemUI = null;
    this.usableItemUIBoxes = [];
    this.usableItemUIImages = [];

    this.baseHour = 19;   // 오후 7시 시작
    this.remainingMinutes = 0;

    // 5분 타이머 설정 (300초 = 5분)
    this.gameTime = 300; // 5분을 초 단위로
    this.startTime = this.time.now;

    this.statusText = this.add.text(20, 20, '', {
     fontSize: '20px',
     fill: '#ffffff'
        }).setScrollFactor(0);

    // 타이머 텍스트 추가
    this.timerText = this.add.text(20, 50, '', {
      fontSize: '18px',
      fill: '#ff0000',
      fontStyle: 'bold'
    }).setScrollFactor(0);

    this.cameras.main.startFollow(this.player); // 카메라 따라가기
    this.monsters = this.physics.add.group({
        classType : Monster,
        runChildUpdate : true
    });

    this.physics.add.overlap(this.player, this.monsters, this.handlePlayerHit, null, this);

    this.physics.add.overlap(
        this.bullets,
        this.monsters,
        this.handleBulletMonsterCollision,
        null,
        this
    )
    
    this.monsterSpawnTimer2 = this.time.addEvent({
        delay: 2000, // 2초마다 한 마리
        loop: true,
        callback: ()=> {
            spawnMonster(this, this.player, this.monsters);
        }
    });

    // 사용 가능한 아이템 드랍 타이머
    this.usableItemSpawnTimer = this.time.addEvent({
        delay: 10000, // 10초마다
        loop: true,
        callback: () => {
            this.spawnRandomUsableItem();
        }
    });

    // 콜라이더 디버그 모드 활성화 (올바른 방법)
    this.physics.world.drawDebug = true;
    
    // 수동 콜라이더 시각화를 위한 그래픽 그룹
    this.debugGraphics = this.add.graphics();

    // 플레이어와 드랍 무기 충돌 처리
    this.physics.add.overlap(this.player, this.weapons, this.handleWeaponPickup, null, this);
    // 몬스터와 bomb 충돌 처리
    this.physics.add.overlap(this.monsters, this.bombs, this.handleBombHit, null, this);
    this.physics.add.overlap(this.player, this.exps, this.handleExpPickup, null, this);
    // 플레이어와 사용 가능한 아이템 충돌 처리
    this.physics.add.overlap(this.player, this.usableItems, this.handleUsableItemPickup, null, this);

    // 무기 UI 그룹 생성
    this.weaponUIImages = [];
    this.weaponUIBoxes = [];
    this.weaponUILevelTexts = [];
    this.weaponUIText = null;
    this.drawWeaponUI();
    this.drawUsableItemUI();
  }

handleBulletMonsterCollision(bullet,monster){
    // 모달이 열려있으면 총알 충돌 처리 안함
    if (this.isPausedForWeaponSwap || this.isPausedForWeaponUpgrade) return;
    
    if(monster && bullet.damage !== undefined){
        monster.takeDamage(bullet.damage);
        bullet.destroy();
    }
}

  update(time,delta) {
    if (this.isPausedForWeaponSwap || this.isPausedForWeaponUpgrade) {
      // 모달이 뜬 동안 모든 시스템 정지
      return;
    }
    this.player.update(time, this.cursors);
    


    // ✅ 퇴근 시간 계산 및 표시
    const totalMinutes = this.baseHour * 60 + this.remainingMinutes;
    const hour = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    this.statusText.setText(
      `퇴근 시간: 오후 ${hour}시 ${minutes.toString().padStart(2, '0')}분`
    );

    // 타이머 업데이트
    const elapsedTime = (this.time.now - this.startTime) / 1000; // 초 단위로 변환
    const remainingTime = Math.max(0, this.gameTime - elapsedTime);
    
    const timerMinutes = Math.floor(remainingTime / 60);
    const timerSeconds = Math.floor(remainingTime % 60);
    
    this.timerText.setText(
      `남은 시간: ${timerMinutes}:${timerSeconds.toString().padStart(2, '0')}`
    );

    // 시간이 다 되면 게임 오버
    if (remainingTime <= 0) {
      this.scene.start('GameOverScene', { reason: 'timeout' });
    }
    
    // 수동 콜라이더 시각화
    this.drawColliders();
    // 무기 UI 갱신
    this.drawWeaponUI();
    // 사용 가능한 아이템 UI 갱신
    this.drawUsableItemUI();
    
    // 사용 가능한 아이템 업데이트
    this.playerUsableItems.forEach((item, index) => {
      if (item && item.update) {
        console.log(`🔄 아이템 ${index} 업데이트 호출, isActive: ${item.isActive}`);
        item.update(time);
      }
    });
  }
  
  drawColliders() {
    this.debugGraphics.clear();
    
    // 플레이어 콜라이더 그리기
    if (this.player && this.player.body) {
      this.debugGraphics.lineStyle(2, 0xff0000);
      this.debugGraphics.strokeRect(
        this.player.x - this.player.body.width / 2,
        this.player.y - this.player.body.height / 2,
        this.player.body.width,
        this.player.body.height
      );
    }
    
    // 몬스터 콜라이더 그리기
    this.monsters.getChildren().forEach(monster => {
      if (monster.body) {
        this.debugGraphics.lineStyle(2, 0x00ff00);
        this.debugGraphics.strokeRect(
          monster.x - monster.body.width / 2,
          monster.y - monster.body.height / 2,
          monster.body.width,
          monster.body.height
        );
      }
    });
    
    // 총알 콜라이더 그리기
    this.bullets.getChildren().forEach(bullet => {
      if (bullet.body) {
        this.debugGraphics.lineStyle(2, 0x0000ff);
        this.debugGraphics.strokeRect(
          bullet.x - bullet.body.width / 2,
          bullet.y - bullet.body.height / 2,
          bullet.body.width,
          bullet.body.height
        );
      }
    });
    

  }

  handlePlayerHit(player, monster) {
    // 모달이 열려있으면 충돌 처리 안함
    if (this.isPausedForWeaponSwap || this.isPausedForWeaponUpgrade) return;
    
    console.log('⚠️ 충돌 발생!');

    this.remainingMinutes += 10; // ✅ 10분 누적!

    // 일단 테스트용으로 몬스터 제거만 해보자
    monster.destroy();

    const totalMinutes = this.baseHour * 60 + this.remainingMinutes;
    if (totalMinutes >= 20 * 60) {
      this.scene.start('GameOverScene', { reason: 'collision' });
    }
  }

  handleWeaponPickup(player, weaponSprite) {
    // 모달이 열려있으면 무기 획득 처리 안함
    if (this.isPausedForWeaponSwap || this.isPausedForWeaponUpgrade) return;
    

    
    if (player && weaponSprite && weaponSprite.weaponKey) {
      // 이미 3종류 보유 & 새로운 무기라면 모달 표시
      if (
        Object.keys(player.obtainedWeapons).length >= 3 &&
        !player.obtainedWeapons[weaponSprite.weaponKey]
      ) {
        this.isPausedForWeaponSwap = true;
        
        // 게임 타이머와 물리 시뮬레이션 일시정지
        this.time.paused = true;
        this.physics.world.pause();
        
        this.weaponSwapModalInstance = new WeaponSwapModal(this, player, weaponSprite.weaponKey, weaponSprite, (swapped) => {
          this.isPausedForWeaponSwap = false;
          this.weaponSwapModalInstance = null;
          
          // 게임 타이머와 물리 시뮬레이션 재개
          this.time.paused = false;
          this.physics.world.resume();
          
          if (!swapped && weaponSprite && weaponSprite.active) weaponSprite.destroy();
        });
        return;
      }
      player.obtainWeapon(weaponSprite.weaponKey);
      weaponSprite.destroy();
    }
  }

  handleBombHit(monster, bomb) {
    // 모달이 열려있으면 폭탄 처리 안함
    if (this.isPausedForWeaponSwap || this.isPausedForWeaponUpgrade) return;
    
    if (monster && bomb && bomb.active) {
      // 폭발 범위 내의 모든 몬스터에게 데미지
      const explosionRadius = bomb.explosionRadius || 100;
      const bombX = bomb.x;
      const bombY = bomb.y;
      
      console.log(`💥 폭탄 폭발! 위치: (${bombX}, ${bombY}), 범위: ${explosionRadius}, 데미지: ${bomb.damage}`);
      
      let hitCount = 0;
      this.monsters.getChildren().forEach(targetMonster => {
        if (targetMonster.active) {
          const distance = Phaser.Math.Distance.Between(bombX, bombY, targetMonster.x, targetMonster.y);
          if (distance <= explosionRadius) {
            console.log(`🎯 몬스터 피격! 거리: ${distance.toFixed(1)}, 몬스터 HP: ${targetMonster.hp} -> ${targetMonster.hp - (bomb.damage || 30)}`);
            if (typeof targetMonster.takeDamage === 'function') {
              targetMonster.takeDamage(bomb.damage || 30);
              hitCount++;
            }
          }
        }
      });
      
      console.log(`💥 폭발 완료! 총 ${hitCount}마리 피격`);
      
      // 폭발 이펙트 (실제 폭발 반경과 정확히 일치)
      const explosion = this.add.circle(bombX, bombY, explosionRadius, 0xff0000, 0.2)
        .setStrokeStyle(2, 0xff4444, 0.8);
      
      // 폭발 이펙트 페이드아웃
      this.tweens.add({
        targets: explosion,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          explosion.destroy();
        }
      });
      
      // 폭탄 제거
      bomb.destroy();
    }
  }

  handleExpPickup(player, expSprite) {
    // 모달이 열려있으면 경험치 획득 처리 안함
    if (this.isPausedForWeaponSwap || this.isPausedForWeaponUpgrade) return;
    

    
    if (player && expSprite && expSprite.amount) {
      player.gainExp(expSprite.amount);
      expSprite.destroy();
    }
  }

  handleUsableItemPickup(player, itemSprite) {
    // 모달이 열려있으면 아이템 획득 처리 안함
    if (this.isPausedForWeaponSwap || this.isPausedForWeaponUpgrade) return;
    
    if (player && itemSprite && itemSprite.itemKey) {
      // 아이템 생성 및 인벤토리에 추가
      let newItem = null;
      
      switch (itemSprite.itemKey) {
        case 'sajikseo':
          newItem = new Sajikseo(this, player);
          break;
        default:
          console.warn('Unknown usable item:', itemSprite.itemKey);
          return;
      }
      
      if (newItem) {
        this.playerUsableItems.push(newItem);
        console.log(`📦 ${itemSprite.itemName} 획득!`);
        itemSprite.destroy();
      }
    }
  }

  // 사용 가능한 아이템 사용
  useUsableItem(index) {
    if (this.isPausedForWeaponSwap || this.isPausedForWeaponUpgrade) return;
    
    if (this.playerUsableItems[index] && this.playerUsableItems[index].use) {
      const success = this.playerUsableItems[index].use();
      if (success) {
        console.log(`🎯 ${this.playerUsableItems[index].itemName} 사용!`);
        // 사용된 아이템 제거
        this.playerUsableItems.splice(index, 1);
      }
    }
  }

  // 사용 가능한 아이템 랜덤 드랍
  spawnRandomUsableItem() {
    const mapBounds = this.physics.world.bounds;
    const playerX = this.player.x;
    const playerY = this.player.y;
    
    // 플레이어로부터 최소 거리
    const minDistance = 200;
    let x, y;
    
    do {
      x = Phaser.Math.Between(mapBounds.x + 50, mapBounds.x + mapBounds.width - 50);
      y = Phaser.Math.Between(mapBounds.y + 50, mapBounds.y + mapBounds.height - 50);
    } while (Phaser.Math.Distance.Between(playerX, playerY, x, y) < minDistance);
    
    // 랜덤하게 아이템 선택 (현재는 사직서만)
    const itemKey = 'sajikseo';
    const itemName = '사직서';
    
    const droppedItem = new DroppedUsableItem(this, x, y, itemKey, itemName);
    this.usableItems.add(droppedItem);
    
    console.log(`🎁 ${itemName} 드랍! 위치: (${x}, ${y})`);
  }

  drawUsableItemUI() {
    // 기존 UI 이미지/박스 제거
    this.usableItemUIImages.forEach(img => img.destroy());
    this.usableItemUIImages = [];
    this.usableItemUIBoxes.forEach(box => box.destroy());
    this.usableItemUIBoxes = [];
    
    // UI 위치/크기
    const { width, height } = this.scale;
    const iconSize = 48;
    const margin = 12;
    const boxPadding = 8;
    const inventoryWidth = iconSize * 3 + boxPadding * 4;
    const inventoryHeight = iconSize + boxPadding * 2;
    const inventoryX = width - inventoryWidth - margin;
    const inventoryY = height - inventoryHeight - margin;
    
    // 사용 가능한 아이템 UI는 무기 UI 위에 배치
    const usableItemY = inventoryY - inventoryHeight - margin - 20;
    
    // 사용 가능한 아이템 박스들 그리기
    this.playerUsableItems.forEach((item, idx) => {
      const x = inventoryX + boxPadding + idx * (iconSize + boxPadding) + iconSize/2;
      const y = usableItemY + boxPadding + iconSize/2;
      
      // 박스 그리기
      const box = this.add.rectangle(x, y, iconSize, iconSize, 0x222222, 0.7)
        .setStrokeStyle(2, 0x00ff00) // 초록색 테두리
        .setScrollFactor(0);
      this.usableItemUIBoxes.push(box);
      
      // 아이템 아이콘
      const img = this.add.image(x, y, item.itemKey)
        .setScrollFactor(0)
        .setDisplaySize(iconSize-8, iconSize-8);
      this.usableItemUIImages.push(img);
      
      // 활성화 상태 표시
      if (item.isActive) {
        const activeIndicator = this.add.circle(x, y, iconSize/2, 0x00ff00, 0.3)
          .setScrollFactor(0);
        this.usableItemUIBoxes.push(activeIndicator);
      }
    });
    
    // '사용 가능한 아이템' 텍스트
    if (this.playerUsableItems.length > 0) {
      const text = this.add.text(
        inventoryX + inventoryWidth/2,
        usableItemY - 8,
        '사용 가능한 아이템',
        { fontSize: '16px', fill: '#00ff00', fontFamily: 'Arial', align: 'center', stroke: '#000', strokeThickness: 2 }
      ).setOrigin(0.5, 1).setScrollFactor(0);
      this.usableItemUIBoxes.push(text);
    }
  }

  drawWeaponUI() {
    // 기존 UI 이미지/박스/텍스트 제거
    this.weaponUIImages.forEach(img => img.destroy());
    this.weaponUIImages = [];
    this.weaponUIBoxes.forEach(box => box.destroy());
    this.weaponUIBoxes = [];
    this.weaponUILevelTexts.forEach(text => text.destroy());
    this.weaponUILevelTexts = [];
    if (this.weaponUIText) { this.weaponUIText.destroy(); this.weaponUIText = null; }
    // 인벤토리 UI 위치/크기
    const { width, height } = this.scale;
    const iconSize = 48;
    const margin = 12;
    const boxPadding = 8;
    const inventoryWidth = iconSize * 3 + boxPadding * 4;
    const inventoryHeight = iconSize + boxPadding * 2;
    const inventoryX = width - inventoryWidth - margin;
    const inventoryY = height - inventoryHeight - margin;
    // 인벤토리 박스 3개 그리기
    for (let i = 0; i < 3; i++) {
      const x = inventoryX + boxPadding + i * (iconSize + boxPadding);
      const y = inventoryY + boxPadding;
      const box = this.add.rectangle(x + iconSize/2, y + iconSize/2, iconSize, iconSize, 0x222222, 0.7)
        .setStrokeStyle(2, 0xffffff)
        .setScrollFactor(0);
      this.weaponUIBoxes.push(box);
    }
    // 무기 아이콘 가로로 배치
    if (this.player && this.player.obtainedWeapons) {
      const keys = Object.keys(this.player.obtainedWeapons);
      keys.slice(0, 3).forEach((weaponKey, idx) => {
        if (WEAPON_IMAGE_KEYS.includes(weaponKey)) {
          const x = inventoryX + boxPadding + idx * (iconSize + boxPadding) + iconSize/2;
          const y = inventoryY + boxPadding + iconSize/2;
          const img = this.add.image(x, y, weaponKey).setScrollFactor(0).setDisplaySize(iconSize-8, iconSize-8);
          this.weaponUIImages.push(img);
          
          // 무기 레벨 표시 (인벤토리 박스의 위쪽 바깥쪽)
          const weapon = this.player.obtainedWeapons[weaponKey];
          if (weapon && weapon.level) {
            // 인벤토리 박스의 위치 계산
            const boxX = inventoryX + boxPadding + idx * (iconSize + boxPadding) + iconSize/2;
            const boxY = inventoryY + boxPadding + iconSize/2;
            
            // 레벨 텍스트 위치 (인벤토리 박스의 위쪽 바깥쪽)
            const levelX = boxX + iconSize/2 - 8; // 인벤토리 박스 오른쪽 끝에서 약간 안쪽
            const levelY = boxY - iconSize/2 - 8; // 인벤토리 박스 위쪽 바깥쪽
            
            // 레벨 텍스트
            const levelText = this.add.text(levelX, levelY, `Lv.${weapon.level}`, {
              fontSize: '12px',
              fill: '#ffff00',
              fontFamily: 'Arial',
              stroke: '#000000',
              strokeThickness: 2
            }).setOrigin(1, 0).setScrollFactor(0);
            this.weaponUILevelTexts.push(levelText);
          }
        }
      });
    }
    // '무기 목록' 텍스트 추가
    this.weaponUIText = this.add.text(
      inventoryX + inventoryWidth/2,
      inventoryY - 8,
      '무기 목록',
      { fontSize: '18px', fill: '#fff', fontFamily: 'Arial', align: 'center', stroke: '#000', strokeThickness: 3 }
    ).setOrigin(0.5, 1).setScrollFactor(0);
  }

  // 무기 업그레이드 모달 표시
  showWeaponUpgradeModal() {
    this.isPausedForWeaponUpgrade = true;
    
    // 게임 타이머와 물리 시뮬레이션 일시정지
    this.time.paused = true;
    this.physics.world.pause();
    
    this.weaponUpgradeModalInstance = new WeaponUpgradeModal(this, this.player, () => {
      this.isPausedForWeaponUpgrade = false;
      this.weaponUpgradeModalInstance = null;
      
      // 게임 타이머와 물리 시뮬레이션 재개
      this.time.paused = false;
      this.physics.world.resume();
    });
  }
}