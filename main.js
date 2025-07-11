import Phaser from 'phaser';
// import MainScene from './scenes/MainScene.js';
import GameScene from './src/scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#222',
  physics: {
    default: 'arcade',
    arcade: {
      debug: true
    }
  },
  scene: [GameScene]
};

new Phaser.Game(config);