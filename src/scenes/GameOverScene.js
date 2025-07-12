export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  preload() {
    this.load.image('player', 'src/assets/images/Player.png'); // 플레이어 이미지
  }

  create() {
    const { width, height } = this.scale;

    // 어두운 배경
    this.cameras.main.setBackgroundColor('#1a1a1a');

    // 메인 텍스트 (안전 여백 확보 + setScrollFactor)
    const title = this.add.text(width / 2, Math.max(60, height / 2 - 120), '😭 야근 확정! 퇴근 실패 😭', {
      fontSize: '36px',
      fill: '#ff4c4c',
      fontFamily: 'Arial Black',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5);
    title.setScrollFactor(0);

    // 캐릭터 이미지 (중앙에 위치)
    this.add.image(width / 2, height / 2, 'player')
      .setScale(0.1)
      .setOrigin(0.5)
      .setAngle(15);

    // 안내 텍스트 (하단, 깜빡임)
    const instructionY = Math.min(height - 60, height / 2 + 140);
    const instruction = this.add.text(width / 2, instructionY, '[스페이스바] 눌러서 다시 시작하기', {
      fontSize: '20px',
      fill: '#ffffff',
      fontStyle: 'italic'
    }).setOrigin(0.5);
    instruction.setScrollFactor(0);

    this.tweens.add({
      targets: instruction,
      alpha: { from: 0.2, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    // 스페이스바 누르면 다시 메뉴로
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('MenuScene');
    });
  }
}
