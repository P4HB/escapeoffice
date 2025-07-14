// ClearScene.js
export default class ClearScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ClearScene' });
  }

  create(data) {
    const { width, height } = this.scale;

    const totalTime = data.clearTime || 0;
    const minutes = Math.floor(totalTime / 60);
    const seconds = Math.floor(totalTime % 60);

    this.add.text(width / 2, height / 2 - 100, '🎉 퇴근 성공!! 🎉', {
      fontSize: '36px',
      fill: '#00ff00',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    // ✅ 시간 표시 텍스트
    this.add.text(width / 2, height / 2 - 40, `총 소요 시간: ${minutes}분 ${seconds}초`, {
      fontSize: '24px',
      fill: '#ffffff',
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
