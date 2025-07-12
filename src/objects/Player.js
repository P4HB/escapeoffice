import { Coffee, BackupUSB, MouseWeapon, BombWeapon } from "./Weapon"

// src/objects/Player.js

const WEAPON_CLASS_MAP = {
  coffee: Coffee,
  usb: BackupUSB,
  mouse: MouseWeapon,
  bomb: BombWeapon
};

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player')

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setOrigin(0.5, 0.5); // 중앙 정렬
    this.setScale(0.08); // 원하는 스케일

    // 콜라이더를 원본 이미지 테두리에 맞춤
    const tex = this.texture.getSourceImage();
    this.body.setSize(tex.width, tex.height);
    this.body.setOffset(0, 0);

    // 콜라이더 설정 확인
    console.log('Player collider set:', this.body.width, 'x', this.body.height);
    console.log('Player position:', this.x, this.y);
    
    this.setCollideWorldBounds(true)
    // 플레이어가 획득한 무기 목록 (key: 무기이름, value: 무기 인스턴스)
    this.obtainedWeapons = {};
    // 초기 무기로 usb 지급
    this.obtainWeapon('usb');
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
