export default class ClearScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ClearScene' });
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2 - 50, '🎉 퇴근 성공!! 🎉', {
      fontSize: '36px',
      fill: '#00ff00',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 20, '[스페이스바] 눌러서 다시 시작하기', {
      fontSize: '20px',
      fill: '#ffffff',
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('MenuScene');
    });
  }
}
