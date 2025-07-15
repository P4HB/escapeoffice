// scenes/GameScene.js
import Player from '../objects/Player.js';
import Monster from '../objects/Monster.js';
import { spawnMonster } from '../systems/monsterspawn.js'
import { DroppedWeapon, BombObject } from '../objects/Weapon.js';
import { ExpObject } from '../objects/Exp.js';
import { DroppedUsableItem, Skill } from '../objects/usableitems.js';
import WeaponSwapModal from '../ui/WeaponSwapModal.js';
import WeaponUpgradeModal from '../ui/WeaponUpgradeModal.js';
import Boss from '../objects/Boss.js';


const WEAPON_IMAGE_KEYS = ['coffee', 'usb', 'mouse', 'bomb', 'typing'];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.isPausedForWeaponSwap = false;
    this.weaponSwapModalInstance = null;
    this.isPausedForWeaponUpgrade = false;
    this.weaponUpgradeModalInstance = null;
    this.bossSpawned = false;
    this.isChattingWithKim = false; // 채팅 중인지 확인하는 플래그
    this.chatHistory = []; // 대화 기록을 저장할 배열
    this.kimDaeRiMood = 0; // 김대리의 기분 점수 (0에서 시작)
    this.chatUIElements = []; // 채팅 UI DOM 요소들을 관리할 배열
    this.chatCount = 0;
    this.maxChatCount = 10;
    // ✅ 1. 채팅 폼을 직접 저장할 속성을 추가합니다.
    this.chatFormComponent = null;
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
    this.load.image('typing','/src/assets/weapon/typing.png');
    this.load.image('skill','/src/assets/usableitem/skill.png');
    this.load.image('player', 'src/assets/images/Player.png');
    this.load.image('map', '/src/assets/map/map.png');
    this.load.image('map2', '/src/assets/map/map2.png');
    this.load.image('map3','/src/assets/map/map3.png');
    this.load.image('exp', 'src/assets/images/exp.png');
    this.load.image('boss', '/src/assets/boss/boss.png');
    // this.load.html('chatForm', 'src/ui/chatForm.html'); // 이제 이 줄은 필요 없습니다.
  }

  create() {
    // 맵 이미지 추가 및 변수에 저장
    const map = this.add.image(0, 0, 'map3').setOrigin(0);

    // 맵 이미지 기준으로 월드 바운드 설정
    this.physics.world.setBounds(0, 0, map.width, map.height);
    this.cameras.main.setBounds(0, 0, map.width, map.height);

    // ✅ 2. 씬이 시작될 때마다 모든 상태를 초기화합니다.
    this.isPausedForWeaponSwap = false;
    this.weaponSwapModalInstance = null;
    this.isPausedForWeaponUpgrade = false;
    this.weaponUpgradeModalInstance = null;
    this.bossSpawned = false;
    this.isChattingWithKim = false;
    this.chatHistory = [];
    this.kimDaeRiMood = 0;
    this.chatUIElements = [];
    this.chatFormComponent = null; // 채팅 폼 참조도 null로 초기화

    this.bullets = this.physics.add.group();
    this.weapons = this.physics.add.group();
    this.bombs = this.physics.add.group();
    this.exps = this.physics.add.group();
    this.usableItems = this.physics.add.group();

    this.monsterSpawnTimer1 = this.time.addEvent({
        delay: 2000,
        loop: true,
        callback: this.spawnRandomMonster,
        callbackScope: this
    });

    this.cursors = this.input.keyboard.createCursorKeys()
    
    this.input.keyboard.on('keydown-SPACE', () => { this.useUsableItem(0); });
    this.input.keyboard.on('keydown-Q', () => { this.useUsableItem(1); });
    this.input.keyboard.on('keydown-E', () => { this.useUsableItem(2); });
    
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.player = new Player(this, centerX, centerY);
    
    this.playerUsableItems = [];
    this.usableItemUI = null;
    this.usableItemUIBoxes = [];
    this.usableItemUIImages = [];

    this.baseHour = 19;
    this.remainingMinutes = 0;
    this.gameTime = 300;
    this.startTime = this.time.now;

    this.statusText = this.add.text(20, 20, '', { fontSize: '20px', fill: '#ffffff' }).setScrollFactor(0);
    this.timerText = this.add.text(20, 50, '', { fontSize: '18px', fill: '#ff0000', fontStyle: 'bold' }).setScrollFactor(0);

    this.cameras.main.startFollow(this.player);
    this.monsters = this.physics.add.group({ classType : Monster, runChildUpdate : true });

    this.physics.add.overlap(this.player, this.monsters, this.handlePlayerHit, null, this);
    this.physics.add.overlap(this.bullets, this.monsters, this.handleBulletMonsterCollision, null, this);
    
    this.monsterSpawnTimer2 = this.time.addEvent({
        delay: 2000,
        loop: true,
        callback: ()=> { spawnMonster(this, this.player, this.monsters); }
    });

    this.usableItemSpawnTimer = this.time.addEvent({
        delay: 10000,
        loop: true,
        callback: () => { this.spawnRandomUsableItem(); }
    });

    this.physics.world.drawDebug = false; // 디버그는 필요할 때 true로 설정
    this.debugGraphics = this.add.graphics();

    this.physics.add.overlap(this.player, this.weapons, this.handleWeaponPickup, null, this);
    this.physics.add.overlap(this.monsters, this.bombs, this.handleBombHit, null, this);
    this.physics.add.overlap(this.player, this.exps, this.handleExpPickup, null, this);
    this.physics.add.overlap(this.player, this.usableItems, this.handleUsableItemPickup, null, this);

    this.weaponUIImages = [];
    this.weaponUIBoxes = [];
    this.weaponUILevelTexts = [];
    this.weaponUIText = null;
    this.drawWeaponUI();
    this.drawUsableItemUI();

    this.bossGroup = this.physics.add.group();
    // this.physics.add.overlap(this.player, this.boss, this.handlePlayerHit, null, this); // 'this.boss'는 존재하지 않음. 보스 그룹과 충돌처리해야함
  }

  handleBulletMonsterCollision(bullet,monster){ 
    if (this.isPausedForWeaponSwap || this.isPausedForWeaponUpgrade) return;
    if(monster && bullet.damage !== undefined){
        monster.takeDamage(bullet.damage);
        bullet.destroy();
    }
  }

  update(time,delta) {
    // 채팅 중일 때는 player.update()가 호출되지 않도록 수정
    if (this.isPausedForWeaponSwap || this.isPausedForWeaponUpgrade || this.isChattingWithKim) {
      return;
    }
    this.player.update(time, this.cursors);
    
    const totalMinutes = this.baseHour * 60 + this.remainingMinutes;
    const hour = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    this.statusText.setText(`퇴근 시간: 오후 ${hour}시 ${minutes.toString().padStart(2, '0')}분`);

    const elapsedTime = (this.time.now - this.startTime) / 1000;
    const remainingTime = Math.max(0, this.gameTime - elapsedTime);
    const timerMinutes = Math.floor(remainingTime / 60);
    const timerSeconds = Math.floor(remainingTime % 60);
    this.timerText.setText(`남은 시간: ${timerMinutes}:${timerSeconds.toString().padStart(2, '0')}`);

    if (remainingTime <= 0) {
      this.scene.start('GameOverScene', { reason: 'timeout' });
    }
    
    if (this.physics.world.drawDebug) {
        this.drawColliders();
    }

    this.drawWeaponUI();
    this.drawUsableItemUI();
    
    this.playerUsableItems.forEach((item) => {
      if (item && item.update) {
        item.update(time);
      }
    });

    if (!this.bossSpawned && !this.isChattingWithKim && this.player.level >= 2) {
      this.startBossChatSequence();
    }
  }

  startBossChatSequence() {
    this.isChattingWithKim = true;
    console.log("🤖 거래처 김대리와의 대화를 시작합니다...");

    this.physics.world.pause();
    this.monsterSpawnTimer1.paused = true;
    this.monsterSpawnTimer2.paused = true;
    this.usableItemSpawnTimer.paused = true;

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const bg = this.add.graphics({ fillStyle: { color: 0x000000, alpha: 0.7 } });
    bg.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    bg.setScrollFactor(0);
    this.chatUIElements.push(bg);

    // ✅ 3. 코드로 직접 HTML 생성
    const chatHTML = `
      <div id="chat-form">
        <div id="chatLog"></div>
        <div id="input-container">
          <input type="text" name="playerInput" placeholder="할 말을 입력하세요...">
          <button name="sendButton">전송</button>
        </div>
      </div>
    `;12
    const chatForm = this.add.dom(centerX, centerY).createFromHTML(chatHTML);
    
    const kimImg = document.createElement("img");
    kimImg.src = "/public/daeri.png";
    kimImg.id = "daeri-img";
    kimImg.style.position = "absolute";
    kimImg.style.top = "80px";
    kimImg.style.left = "50%";
    kimImg.style.transform = "translateX(-50%)";
    kimImg.style.width = "180px";
    kimImg.style.borderRadius = "10px";
    kimImg.style.zIndex = "999";
    console.log("김대리 이미지 추가!");
    document.body.appendChild(kimImg);

    chatForm.setScrollFactor(0);
    
    // ✅ 4. 직접 참조 저장 및 배열에 추가
    this.chatFormComponent = chatForm;
    this.chatUIElements.push(chatForm);

    chatForm.setPerspective(800);
    chatForm.addListener('click');
    chatForm.on('click', (event) => {
      if (event.target.name === 'sendButton') {
        const inputText = chatForm.getChildByName('playerInput');
        if (inputText.value !== '') {
          this.handlePlayerMessage(inputText.value);
          inputText.value = '';
        }
      }
    });
    
    this.appendMessageToLog("플레이어: (거래처 사장님을 만나기 전, 김대리에게 말을 건다...)");

    const inputField = chatForm.getChildByName('playerInput');
    if (inputField) {
      inputField.focus();
    }
  }

  // ✅ 5. 직접 참조를 사용하는 appendMessageToLog 함수
  appendMessageToLog(text) {
    if (this.chatFormComponent) {
      const chatLog = this.chatFormComponent.getChildByID('chatLog');
      
      if (chatLog) {
        chatLog.innerHTML += `<p>${text}</p>`;
        chatLog.scrollTop = chatLog.scrollHeight;
      } else {
        console.error("오류: 'chat-form'은 찾았으나, 내부의 'chatLog'를 찾지 못했습니다.");
      }
    } else {
      console.error("오류: this.chatFormComponent가 설정되지 않았습니다.");
    }
  }

  async handlePlayerMessage(message) {
    this.appendMessageToLog(`나: ${message}`);
    this.chatCount++;
    if (message.includes("가볼게요") || message.includes("가보겠습니다") || message.includes("그만")) {
      this.appendMessageToLog("김대리: 네, 그럼 부장님께 잘 말씀드려주세요.");
      this.endChatAndSpawnBoss();
      return;
    }

    if (this.chatCount >= this.maxChatCount) {
      this.appendMessageToLog("김대리: 이제 저희 부장님을 만나러 가시죠...");
      this.endChatAndSpawnBoss();
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          history: this.chatHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      this.kimDaeRiMood += data.moodChange;
      this.chatHistory.push({ role: 'user', content: message });
      this.chatHistory.push({ role: 'model', content: data.response });
      
      this.appendMessageToLog(`김대리: ${data.response}`);
      this.appendMessageToLog(`[남은 대화 횟수: ${this.maxChatCount - this.chatCount}]`);
      this.appendMessageToLog(`[기분 변화: ${data.moodChange}] [현재 기분 점수: ${this.kimDaeRiMood}]`);

    } catch (error) {
      console.error("채팅 서버 통신 오류:", error);
      this.appendMessageToLog("[시스템] 서버와 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  }

  // ✅ 6. 직접 참조를 초기화하는 endChatAndSpawnBoss 함수
  endChatAndSpawnBoss() {
    console.log(`👹 대화 종료! 최종 기분 점수: ${this.kimDaeRiMood}. 이 점수로 보스를 소환합니다.`);
    this.isChattingWithKim = false;

    this.chatUIElements.forEach(element => element.destroy());
    
    this.chatUIElements = [];
    this.chatFormComponent = null; // 참조 초기화
    
    const kimImg = document.getElementById("daeri-img");
    if (kimImg) kimImg.remove();

    this.physics.world.resume();
    this.monsterSpawnTimer1.paused = false;
    this.monsterSpawnTimer2.paused = false;
    this.usableItemSpawnTimer.paused = false;

    this.spawnBoss();
    this.bossSpawned = true;
  }

  // ✅ 7. 난이도 조절 로직이 포함된 spawnBoss 함수
  spawnBoss() {
    const x = this.player.x + 300;
    const y = this.player.y + 300;

    let bossHealth = 2000;
    let bossDamage = 50;

    bossHealth -= this.kimDaeRiMood * 20;
    bossDamage -= this.kimDaeRiMood * 1;

    bossHealth = Phaser.Math.Clamp(bossHealth, 1000, 4000);
    bossDamage = Phaser.Math.Clamp(bossDamage, 25, 100);

    console.log(`👹 보스 스펙 - 체력: ${bossHealth}, 공격력: ${bossDamage}`);

    const boss = new Boss(this, x, y, this.player, bossHealth, bossDamage);
    this.bossGroup.add(boss);

    this.physics.add.overlap(this.bullets, this.bossGroup, this.handleBulletMonsterCollision, null, this);
    this.physics.add.overlap(this.player, this.bossGroup, this.handlePlayerHit, null, this);

    console.log('👹 거래처 사장(보스) 등장!');
  }

  drawColliders() {
    this.debugGraphics.clear();
    
    if (this.player && this.player.body) {
      this.debugGraphics.lineStyle(2, 0xff0000);
      this.debugGraphics.strokeRect(this.player.x - this.player.body.width / 2, this.player.y - this.player.body.height / 2, this.player.body.width, this.player.body.height);
    }
    
    this.monsters.getChildren().forEach(monster => {
      if (monster.body) {
        this.debugGraphics.lineStyle(2, 0x00ff00);
        this.debugGraphics.strokeRect(monster.x - monster.body.width / 2, monster.y - monster.body.height / 2, monster.body.width, monster.body.height);
      }
    });
    
    this.bullets.getChildren().forEach(bullet => {
      if (bullet.body) {
        this.debugGraphics.lineStyle(2, 0x0000ff);
        this.debugGraphics.strokeRect(bullet.x - bullet.body.width / 2, bullet.y - bullet.body.height / 2, bullet.body.width, bullet.body.height);
      }
    });
  }

  handlePlayerHit(player, target) {
    if (player.isInvincible) return;

  // 💥 보스 충돌 시
  if (target instanceof Boss) {
    console.log('❗ 보스 충돌 - 제거하지 않음');
    this.remainingMinutes += 10;
    player.setInvincible();
  } else {
    // 💥 일반 몬스터 충돌 시
    console.log('😵 플레이어 피격!');
    this.remainingMinutes += 10; // ✅ 이 줄이 없었음!!
    player.setInvincible();
  }

  // ⛔ 60분 이상 누적 시 게임 오버
  if (this.remainingMinutes >= 60) {
    this.scene.start('GameOverScene', { reason: 'overworked' });
  }
}






  handleWeaponPickup(player, weaponSprite) {
    if (this.isPausedForWeaponSwap || this.isPausedForWeaponUpgrade) return;
    
    if (player && weaponSprite && weaponSprite.weaponKey) {
      if (Object.keys(player.obtainedWeapons).length >= 3 && !player.obtainedWeapons[weaponSprite.weaponKey]) {
        this.isPausedForWeaponSwap = true;
        
        this.time.paused = true;
        this.physics.world.pause();
        
        this.weaponSwapModalInstance = new WeaponSwapModal(this, player, weaponSprite.weaponKey, weaponSprite, (swapped) => {
          this.isPausedForWeaponSwap = false;
          this.weaponSwapModalInstance = null;
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
    if (this.isPausedForWeaponSwap || this.isPausedForWeaponUpgrade) return;

    if (monster && bomb && bomb.active) {
      const explosionRadius = bomb.explosionRadius || 100;
      const bombX = bomb.x;
      const bombY = bomb.y;

      console.log(`💥 폭탄 폭발! 위치: (${bombX}, ${bombY}), 범위: ${explosionRadius}, 데미지: ${bomb.damage}`);

      let hitCount = 0;

      // ✅ 일반 몬스터 데미지 처리
      this.monsters.getChildren().forEach(targetMonster => {
        if (targetMonster.active) {
          const distance = Phaser.Math.Distance.Between(bombX, bombY, targetMonster.x, targetMonster.y);
          if (distance <= explosionRadius && typeof targetMonster.takeDamage === 'function') {
            console.log(`🎯 몬스터 피격! 거리: ${distance.toFixed(1)}, HP: ${targetMonster.hp} -> ${targetMonster.hp - (bomb.damage || 30)}`);
            targetMonster.takeDamage(bomb.damage || 30);
            hitCount++;
          }
        }
      });

      // ✅ 보스 데미지 처리 추가!
      this.bossGroup.getChildren().forEach(boss => {
        if (boss.active) {
          const distance = Phaser.Math.Distance.Between(bombX, bombY, boss.x, boss.y);
          if (distance <= explosionRadius && typeof boss.takeDamage === 'function') {
            console.log(`👹 보스 피격! 거리: ${distance.toFixed(1)}, HP: ${boss.hp} -> ${boss.hp - (bomb.damage || 30)}`);
            boss.takeDamage(bomb.damage || 30);
            hitCount++;
          }
        }
      });

      console.log(`💥 폭발 완료! 총 ${hitCount}마리 피격`);

      // 폭발 이펙트
      const explosion = this.add.circle(bombX, bombY, explosionRadius, 0xff0000, 0.2)
        .setStrokeStyle(2, 0xff4444, 0.8);

      this.tweens.add({
        targets: explosion,
        alpha: 0,
        duration: 500,
        onComplete: () => { explosion.destroy(); }
      });

      bomb.destroy();
    }
  }


  handleExpPickup(player, expSprite) {
    if (this.isPausedForWeaponSwap || this.isPausedForWeaponUpgrade) return;
    if (player && expSprite && expSprite.amount) {
      player.gainExp(expSprite.amount * 3);
      expSprite.destroy();
    }
  }

  handleUsableItemPickup(player, itemSprite) {
    if (this.isPausedForWeaponSwap || this.isPausedForWeaponUpgrade) return;
    
    if (player && itemSprite && itemSprite.itemKey) {
      let newItem = null;
      switch (itemSprite.itemKey) {
        case 'skill':
          newItem = new Skill(this, player);
          break;
        default:
          return;
      }
      
      if (newItem) {
        this.playerUsableItems.push(newItem);
        itemSprite.destroy();
      }
    }
  }

  useUsableItem(index) {
    if (this.isPausedForWeaponSwap || this.isPausedForWeaponUpgrade) return;
    
    if (this.playerUsableItems[index] && this.playerUsableItems[index].use) {
      const success = this.playerUsableItems[index].use();
      if (success) {
        this.playerUsableItems.splice(index, 1);
      }
    }
  }

  spawnRandomUsableItem() {
    const mapBounds = this.physics.world.bounds;
    let x, y;
    do {
      x = Phaser.Math.Between(mapBounds.x + 50, mapBounds.x + mapBounds.width - 50);
      y = Phaser.Math.Between(mapBounds.y + 50, mapBounds.y + mapBounds.height - 50);
    } while (Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y) < 200);
    
    // 랜덤하게 아이템 선택 (현재는 휴가신청서만)
    const itemKey = 'skill';
    const itemName = '휴가신청서';
    
    const droppedItem = new DroppedUsableItem(this, x, y, itemKey, itemName);
    this.usableItems.add(droppedItem);
  }

  drawUsableItemUI() {
    this.usableItemUIImages.forEach(img => img.destroy());
    this.usableItemUIImages = [];
    this.usableItemUIBoxes.forEach(box => box.destroy());
    this.usableItemUIBoxes = [];
    
    const { width, height } = this.scale;
    const iconSize = 48;
    const margin = 12;
    const boxPadding = 8;
    const inventoryWidth = iconSize * 3 + boxPadding * 4;
    const inventoryHeight = iconSize + boxPadding * 2;
    const inventoryX = width - inventoryWidth - margin;
    const inventoryY = height - inventoryHeight - margin;
    const usableItemY = inventoryY - inventoryHeight - margin - 20;
    
    this.playerUsableItems.forEach((item, idx) => {
      const x = inventoryX + boxPadding + idx * (iconSize + boxPadding) + iconSize/2;
      const y = usableItemY + boxPadding + iconSize/2;
      
      const box = this.add.rectangle(x, y, iconSize, iconSize, 0x222222, 0.7).setStrokeStyle(2, 0x00ff00).setScrollFactor(0);
      this.usableItemUIBoxes.push(box);
      
      const img = this.add.image(x, y, item.itemKey).setScrollFactor(0).setDisplaySize(iconSize-8, iconSize-8);
      this.usableItemUIImages.push(img);
      
      if (item.isActive) {
        const activeIndicator = this.add.circle(x, y, iconSize/2, 0x00ff00, 0.3).setScrollFactor(0);
        this.usableItemUIBoxes.push(activeIndicator);
      }
    });
    
    if (this.playerUsableItems.length > 0) {
      const text = this.add.text(inventoryX + inventoryWidth/2, usableItemY - 8, '사용 가능한 아이템', { fontSize: '16px', fill: '#00ff00', fontFamily: 'Arial', align: 'center', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5, 1).setScrollFactor(0);
      this.usableItemUIBoxes.push(text);
    }
  }

  drawWeaponUI() {
    this.weaponUIImages.forEach(img => img.destroy());
    this.weaponUIImages = [];
    this.weaponUIBoxes.forEach(box => box.destroy());
    this.weaponUIBoxes = [];
    this.weaponUILevelTexts.forEach(text => text.destroy());
    this.weaponUILevelTexts = [];
    if (this.weaponUIText) { this.weaponUIText.destroy(); this.weaponUIText = null; }
    
    const { width, height } = this.scale;
    const iconSize = 48;
    const margin = 12;
    const boxPadding = 8;
    const inventoryWidth = iconSize * 3 + boxPadding * 4;
    const inventoryHeight = iconSize + boxPadding * 2;
    const inventoryX = width - inventoryWidth - margin;
    const inventoryY = height - inventoryHeight - margin;
    
    for (let i = 0; i < 3; i++) {
      const x = inventoryX + boxPadding + i * (iconSize + boxPadding);
      const y = inventoryY + boxPadding;
      const box = this.add.rectangle(x + iconSize/2, y + iconSize/2, iconSize, iconSize, 0x222222, 0.7).setStrokeStyle(2, 0xffffff).setScrollFactor(0);
      this.weaponUIBoxes.push(box);
    }
    
    if (this.player && this.player.obtainedWeapons) {
      Object.keys(this.player.obtainedWeapons).slice(0, 3).forEach((weaponKey, idx) => {
        if (WEAPON_IMAGE_KEYS.includes(weaponKey)) {
          const x = inventoryX + boxPadding + idx * (iconSize + boxPadding) + iconSize/2;
          const y = inventoryY + boxPadding + iconSize/2;
          const img = this.add.image(x, y, weaponKey).setScrollFactor(0).setDisplaySize(iconSize-8, iconSize-8);
          this.weaponUIImages.push(img);
          
          const weapon = this.player.obtainedWeapons[weaponKey];
          if (weapon && weapon.level) {
            const boxX = inventoryX + boxPadding + idx * (iconSize + boxPadding) + iconSize/2;
            const boxY = inventoryY + boxPadding + iconSize/2;
            const levelX = boxX + iconSize/2 - 8;
            const levelY = boxY - iconSize/2 - 8;
            const isMax = weapon.level >= 6;
            const levelText = this.add.text(
              levelX,
              levelY,
              isMax ? 'MAX' : `Lv.${weapon.level}`,
              {
                fontSize: isMax ? '14px' : '12px',
                fill: isMax ? '#ff4444' : '#ffff00',
                fontFamily: 'Arial',
                fontStyle: isMax ? 'bold' : 'normal',
                stroke: '#000000',
                strokeThickness: 2
              }
            ).setOrigin(1, 0).setScrollFactor(0);
            this.weaponUILevelTexts.push(levelText);
          }
        }
      });
    }
    
    this.weaponUIText = this.add.text(inventoryX + inventoryWidth/2, inventoryY - 8, '무기 목록', { fontSize: '18px', fill: '#fff', fontFamily: 'Arial', align: 'center', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5, 1).setScrollFactor(0);
  }

  showWeaponUpgradeModal() {
    this.isPausedForWeaponUpgrade = true;
    this.time.paused = true;
    this.physics.world.pause();
    
    this.weaponUpgradeModalInstance = new WeaponUpgradeModal(this, this.player, () => {
      this.isPausedForWeaponUpgrade = false;
      this.weaponUpgradeModalInstance = null;
      this.time.paused = false;
      this.physics.world.resume();
    });
  }
  
  // spawnRandomMonster 콜백 함수가 없어서 추가
  spawnRandomMonster() {
    spawnMonster(this, this.player, this.monsters);
  }
}