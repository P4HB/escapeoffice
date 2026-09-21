import { GUEST_MODE, assetUrl } from '../services/gameMode.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
      super({ key: 'BootScene' });
    }
  
    preload() {
      this.load.image('splashLogo', assetUrl('assets/images/splash_logo.png'));
    }
  
    create() {
      const centerX = this.scale.width / 2;
      const centerY = this.scale.height / 2;
  
      const logo = this.add.image(centerX, centerY, 'splashLogo').setScale(0.5);
  
      this.time.delayedCall(2000, () => {
        this.scene.start(GUEST_MODE ? 'MenuScene' : 'LoginScene');
      });
    }
  }
