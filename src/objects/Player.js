// src/objects/Player.js
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player')

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setCollideWorldBounds(true)

    // ✅ 캐릭터 크기 1/4 로 줄이기
    this.setScale(0.08)
  }

  update(cursors) {
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
