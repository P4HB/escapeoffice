export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  preload() {
    this.load.image('player', '/assets/images/Player.png');
  }

  create(data) {
    const { width, height } = this.scale;
    const gameOverReason = data?.reason || 'timeout'; // 기본값은 시간 초과

    this.cameras.main.setBackgroundColor('#1a1a1a');

    // 📌 위치 계산 (비율 + 안전 여백)
    const titleY = Math.max(height * 0.1, 50);
    const playerY = Math.min(height * 0.5, height - 160);
    const instructionY = Math.min(height * 0.75, height - 60);

    // 타이틀 - 게임 오버 이유에 따라 다른 메시지
    let titleText, titleColor;
    if (gameOverReason === 'timeout') {
      titleText = '⏰ 시간 초과! 퇴근 실패 ⏰';
      titleColor = '#ffaa00';
    } else {
      titleText = '😭 야근 확정! 퇴근 실패 😭';
      titleColor = '#ff4c4c';
    }

    this.add.text(width / 2, titleY, titleText, {
      fontSize: '36px',
      fill: titleColor,
      fontFamily: 'Arial Black',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0);

    // 캐릭터 이미지
    this.add.image(width / 2, playerY, 'player')
      .setScale(0.1)
      .setOrigin(0.5)
      .setAngle(15)
      .setScrollFactor(0);

    // 안내 텍스트
    const instruction = this.add.text(width / 2, instructionY, '[스페이스바] 눌러서 다시 시작하기', {
      fontSize: '20px',
      fill: '#ffffff',
      fontStyle: 'italic'
    }).setOrigin(0.5).setScrollFactor(0);

    this.tweens.add({
      targets: instruction,
      alpha: { from: 0.2, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('MenuScene');
    });
  }
}
