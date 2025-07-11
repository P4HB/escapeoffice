import Phaser from 'phaser'
import GameScene from './src/scenes/GameScene.js'
import ClearScene from './src/scenes/ClearScene.js';
import MenuScene from './src/scenes/MenuScene.js';
import GameOverScene from './src/scenes/GameOverScene.js';




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
  scene: [MenuScene, GameScene, ClearScene, GameOverScene]
}

new Phaser.Game(config)
