export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {
    // 캐릭터 이미지 로드
    this.load.image('player', 'src/assets/images/Player.png');
  }

  create() {
    const { width, height } = this.scale;

    // 배경색
    this.cameras.main.setBackgroundColor('#2e2e2e');

    // 게임 제목
    this.add.text(width / 2, height / 2 - 120, '💼 탈출 오피스 💼', {
      fontSize: '48px',
      fill: '#f0db4f',
      fontFamily: 'Arial Black',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // 캐릭터 이미지 추가 (중앙 하단)
    this.add.image(width / 2, height / 2 + 30, 'player').setScale(0.1).setOrigin(0.5);

    // 안내 텍스트
    const instruction = this.add.text(width / 2, height / 2 + 150, '[스페이스바] 눌러서 출근하기', {
      fontSize: '22px',
      fill: '#ffffff',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // 텍스트 깜빡임 효과
    this.tweens.add({
      targets: instruction,
      alpha: { from: 0.2, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // 스페이스바로 게임 시작
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });
  }
}
