import { Coffee, BackupUSB } from "./Weapon"

// src/objects/Player.js

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
    // 두 무기 모두 장착
    this.coffeeWeapon = new Coffee(scene, this);
    this.usbWeapon = new BackupUSB(scene, this);
  }

  update(time, cursors) {
    // 두 무기 모두 발사
    this.coffeeWeapon.update(time);
    this.usbWeapon.update(time);
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
}
