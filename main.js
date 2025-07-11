import Phaser from 'phaser'
import GameScene from './src/scenes/GameScene.js'

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,   // ✅ 전체 창 가로
  height: window.innerHeight, // ✅ 전체 창 세로
  backgroundColor: '#1d1d1d',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // ✅ 중력 제거
      debug: true
    }
  },
  scene: [GameScene]
}

new Phaser.Game(config)
