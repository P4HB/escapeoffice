import Player from '../objects/Player.js'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
  }

  preload() {
    this.load.image('player', 'src/assets/images/Player.png')
  }

  create() {
    this.cursors = this.input.keyboard.createCursorKeys()

    // ✅ 화면 크기 받아와서 중앙 계산
    const centerX = this.cameras.main.width / 2
    const centerY = this.cameras.main.height / 2

    this.player = new Player(this, centerX, centerY)
  }

  update() {
    this.player.update(this.cursors)
  }
}
