import Phaser from 'phaser'
import GameScene from './src/scenes/GameScene.js'
import ClearScene from './src/scenes/ClearScene.js';
import MenuScene from './src/scenes/MenuScene.js';
import GameOverScene from './src/scenes/GameOverScene.js';
import LoginScene from './src/scenes/LoginScene.js';
import RegisterScene from './src/scenes/RegisterScene.js';
import RankingScene from './src/scenes/RankingScene.js';
import BootScene from './src/scenes/BootScene.js';
import HowToPlayScene from './src/scenes/HowToPlayScene.js';
import WeaponEncyclopediaScene from './src/scenes/WeaponEncyclopediaScene.js';
import RexOutlinePipelinePlugin from 'phaser3-rex-plugins/plugins/outlinepipeline-plugin.js';

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#1d1d1d',

  // ✅ 1. DOM 컨테이너를 지정합니다. (index.html의 div id와 동일)
  parent: 'game-container',

  // ✅ 2. DOM 요소 사용을 활성화합니다.
  dom: {
      createContainer: true
  },

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      // 💡 개발 완료 후에는 false로 바꾸는 것이 성능에 좋습니다.
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
  scene: [BootScene, LoginScene, HowToPlayScene, WeaponEncyclopediaScene, MenuScene, GameScene, ClearScene, GameOverScene, RegisterScene, RankingScene]
};

new Phaser.Game(config);


