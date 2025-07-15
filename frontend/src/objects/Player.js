import { Coffee, BackupUSB, MouseWeapon, BombWeapon, Typing } from "./Weapon"

// src/objects/Player.js

const WEAPON_CLASS_MAP = {
  coffee: Coffee,
  usb: BackupUSB,
  mouse: MouseWeapon,
  bomb: BombWeapon,
  typing: Typing
};

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player')

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setOrigin(0.5, 0.5); // 중앙 정렬
    this.setScale(0.08); // 원하는 스케일

    // 콜라이더를 원본 이미지 테두리에 맞춤
    this.body.setSize(864, 858);
    this.body.setOffset(50, 80);
    
    this.setCollideWorldBounds(true)
    // 플레이어가 획득한 무기 목록 (key: 무기이름, value: 무기 인스턴스)
    this.obtainedWeapons = {};
    // 초기 무기로 typing 지급
    this.obtainWeapon('typing');
    // 경험치/레벨 
    this.exp = 0;
    this.level = 1;
    // 경험치/레벨 UI
    this.createExpUI()
    this.updateExpUI();

    this.isInvincible = false; // ⭐ 무적 상태 여부

  }

// ⭐ 무적 상태 부여 메서드
  setInvincible(duration = 1000) {    //무적 시간 
    this.isInvincible = true;
    this.setAlpha(0.5); // 시각적 효과 (투명)

    // 일정 시간 후 다시 무적 해제
    this.scene.time.delayedCall(duration, () => {
      this.isInvincible = false;
      this.setAlpha(1);
    });
  }


  update(time, cursors) {
    // 획득한 무기만 발사
    Object.values(this.obtainedWeapons).forEach(weapon => weapon.update(time));
    // 좌우 이동
    if (cursors.left.isDown) {
      this.setVelocityX(-160)
      this.setFlipX(true)
    } else if (cursors.right.isDown) {
      this.setVelocityX(160)
      this.setFlipX(false)
    } else {
      this.setVelocityX(0)
    }

    // ✅ 위아래 이동 추가
    if (cursors.up.isDown) {
      this.setVelocityY(-160)
    } else if (cursors.down.isDown) {
      this.setVelocityY(160)
    } else {
      this.setVelocityY(0)
    }
    // 경험치/레벨 UI 갱신
    this.updateExpUI();
  }

  // 경험치 획득
  gainExp(amount) {
    this.exp += amount;
    if (this.exp >= 100) {
      this.exp -= 100;
      this.levelUp();
    }
    this.updateExpUI();
  }

  // 레벨업
  levelUp() {
    this.level += 1;
    // 무기 업그레이드 모달 띄우기
    if (this.scene && typeof this.scene.showWeaponUpgradeModal === 'function') {
      this.scene.showWeaponUpgradeModal();
    }
  }

  createExpUI() {
    const rightX = this.scene.scale.width - 160;
    const topY = 20;

    this.expLabel = this.scene.add.text(rightX, topY, `LVL : ${this.level}`, {
      fontSize: '18px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000',
      strokeThickness: 3
    }).setScrollFactor(0).setDepth(100);

    this.expBarBg = this.scene.add.graphics().setScrollFactor(0).setDepth(99);
    this.expBarBg.fillStyle(0x555555, 1);
    this.expBarBg.fillRect(rightX, topY + 30, 120, 16);

    this.expBar = this.scene.add.graphics().setScrollFactor(0).setDepth(100);
  }
  
  updateExpUI() {
    this.expLabel.setText(`LVL : ${this.level}`);
    
    const rightX = this.scene.scale.width - 160;
    const topY = 20;
    const expRatio = Phaser.Math.Clamp(this.exp / 100, 0, 1);
    const filledWidth = 120 * expRatio;

    this.expBar.clear();
    this.expBar.fillStyle(0x00ff00, 1);
    this.expBar.fillRect(rightX, topY + 30, filledWidth, 16);
  }

  // 무기 획득
  obtainWeapon(weaponKey) {
    if (!this.obtainedWeapons[weaponKey] && WEAPON_CLASS_MAP[weaponKey]) {
      this.obtainedWeapons[weaponKey] = new WEAPON_CLASS_MAP[weaponKey](this.scene, this);
      // 최대 3종류만 보유
      if (Object.keys(this.obtainedWeapons).length > 3) {
        // 가장 먼저 획득한 무기 제거
        const firstKey = Object.keys(this.obtainedWeapons)[0];
        delete this.obtainedWeapons[firstKey];
      }
    }
  }
}
