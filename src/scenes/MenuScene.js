export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {
    this.load.image('player', 'src/assets/images/Player.png');
  }

  create() {
    const { width, height } = this.scale;

    // 배경색
    this.cameras.main.setBackgroundColor('#2e2e2e');

    // 게임 제목
    const titleY = Math.max(60, height / 2 - 120);
    this.add.text(width / 2, titleY, '💼 탈출 오피스 💼', {
      fontSize: '48px',
      fill: '#f0db4f',
      fontFamily: 'Arial Black',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0);

    // 캐릭터 이미지
    const playerY = height / 2 + 30;
    this.add.image(width / 2, playerY, 'player')
      .setScale(0.1)
      .setOrigin(0.5)
      .setScrollFactor(0);

    // 안내 텍스트
    const instructionY = Math.min(height - 60, height / 2 + 140);
    const instruction = this.add.text(width / 2, instructionY, '[스페이스바] 눌러서 출근하기', {
      fontSize: '22px',
      fill: '#ffffff',
      fontStyle: 'italic'
    }).setOrigin(0.5).setScrollFactor(0);

    // 텍스트 깜빡임
    this.tweens.add({
      targets: instruction,
      alpha: { from: 0.2, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // 스페이스바 누르면 시작
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });
  }
}
