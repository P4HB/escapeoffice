// src/scenes/GameOverScene.js
export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2, '😭 야근 확정! 퇴근 실패 😭', {
      fontSize: '28px',
      fill: '#ff0000'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 50, '[스페이스바] 눌러서 다시 시작하기', {
      fontSize: '18px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('MenuScene'); // 또는 GameScene
    });
  }
}
