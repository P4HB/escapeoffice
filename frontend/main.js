import Phaser from 'phaser'
import GameScene from './src/scenes/GameScene.js'
import ClearScene from './src/scenes/ClearScene.js';
import MenuScene from './src/scenes/MenuScene.js';
import GameOverScene from './src/scenes/GameOverScene.js';
import LoginScene from './src/scenes/LoginScene.js';
import RegisterScene from './src/scenes/RegisterScene.js';
import RankingScene from './src/scenes/RankingScene.js';



import RexOutlinePipelinePlugin from 'phaser3-rex-plugins/plugins/outlinepipeline-plugin.js';

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#1d1d1d',
  scale: {
    mode: Phaser.Scale.FIT, // 💡 해상도 맞춤
    autoCenter: Phaser.Scale.CENTER_BOTH // 💡 중앙 정렬
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: true
    }
  },
  plugins: {
    global: [
      {
        key: 'rexOutlinePipeline',
        plugin: RexOutlinePipelinePlugin,
        start: true
      }
    ]
  },
  scene: [LoginScene, MenuScene, GameScene, ClearScene, GameOverScene, RegisterScene, RankingScene]
};

new Phaser.Game(config);


