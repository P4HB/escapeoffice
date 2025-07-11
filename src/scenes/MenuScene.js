// src/scenes/MenuScene.js

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    // 메뉴 텍스트
    this.add.text(width / 2, height / 2 - 30, '🧠 탈출 오피스', {
      fontSize: '32px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 20, '[스페이스바] 눌러서 출근하기', {
      fontSize: '20px',
      fill: '#aaaaaa'
    }).setOrigin(0.5);

    // 스페이스바 입력 시 게임 시작
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });
  }
}
