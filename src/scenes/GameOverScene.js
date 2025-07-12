export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  preload() {
    this.load.image('player', 'src/assets/images/Player.png'); // 눈물 흘리는 느낌 연출 가능
  }

  create() {
    const { width, height } = this.scale;

    // 어두운 배경
    this.cameras.main.setBackgroundColor('#1a1a1a');

    // 메인 텍스트
    this.add.text(width / 2, height / 2 - 100, '😭 야근 확정! 퇴근 실패 😭', {
      fontSize: '36px',
      fill: '#ff4c4c',
      fontFamily: 'Arial Black',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5);

    // 캐릭터 이미지 (고개 숙인 느낌으로 중앙 아래에)
    this.add.image(width / 2, height / 2 + 10, 'player')
      .setScale(0.1)
      .setOrigin(0.5)
      .setAngle(15); // 살짝 기울여 무기력한 느낌

    // 안내 텍스트 (깜빡임)
    const instruction = this.add.text(width / 2, height / 2 + 130, '[스페이스바] 눌러서 다시 시작하기', {
      fontSize: '20px',
      fill: '#ffffff',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: instruction,
      alpha: { from: 0.2, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    // 스페이스바 누르면 메뉴로
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('MenuScene');
    });
  }
}
