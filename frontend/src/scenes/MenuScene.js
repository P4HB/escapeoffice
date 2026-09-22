// @ts-nocheck
import { GUEST_MODE, assetUrl } from '../services/gameMode.js';
import { apiRequest } from '../services/api.js';
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {
    this.load.image('player', assetUrl('assets/images/Player.png'));
  }

  create() {
    const { width, height } = this.scale; // ✅ 이 줄 추가!
    const realHeight = height;

    this.cameras.main.setBackgroundColor('#2e2e2e');

    // 위치 계산 (안전 범위 포함)
    const titleY = Math.max(realHeight * 0.1, 50);
    const playerY = Math.min(realHeight * 0.45, realHeight - 150);
    const instructionY = Math.min(realHeight * 0.85, realHeight - 40);

    // 타이틀 텍스트
    this.add.text(width / 2, titleY, '💼 탈출 오피스 💼', {
      fontSize: '48px',
      fill: '#f0db4f',
      fontFamily: 'Arial Black',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(width / 2, titleY + 55, 'PC 키보드로 플레이 · 방향키 이동 · 자동 공격 · 스페이스바 아이템', {
      fontSize: '16px', fill: '#dddddd',
    }).setOrigin(0.5);
    if (GUEST_MODE) {
      this.add.text(width / 2, titleY + 82, '게스트판 · 기록은 이 브라우저에 저장됩니다', {
        fontSize: '15px', fill: '#f0db4f',
      }).setOrigin(0.5);
    }

    // 캐릭터 이미지
    this.add.image(width / 2, playerY, 'player')
      .setScale(0.3)
      .setOrigin(0.5);
    
    // 안내 텍스트
    const instruction = this.add.text(width / 2, instructionY, '[스페이스바] 눌러서 출근하기', {
      fontSize: '22px',
      fill: '#ffffff',
      fontStyle: 'italic'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    instruction.on('pointerdown', () => this.scene.start('GameScene'));

    // 텍스트 깜빡임 애니메이션
    this.tweens.add({
      targets: instruction,
      alpha: { from: 0.2, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // 스페이스바 누르면 게임 시작
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });

    const menuBaseY = height / 2 + 50;
    const buttonGap = 50;

    const buttons = [
      {
        label: '[📘 무기백과]',
        color: '#00d8ff',
        scene: 'WeaponEncyclopediaScene'
      },
      {
        label: '[❓ 게임 설명]',
        color: '#ff77ff',
        scene: 'HowToPlayScene'
      },
      {
        label: GUEST_MODE ? '[🏆 내 기록]' : '[🏆 랭킹 보기]',
        color: '#00ffff',
        scene: 'RankingScene'
      },
      ...(!GUEST_MODE ? [{
        label: '[🚪 로그아웃]',
        color: '#ff5555',
        onClick: async () => {
          try {
            await apiRequest('/logout', { method: 'POST', body: {} });
            this.scene.start('LoginScene');
          } catch (error) { alert(error.message); }
        }
      }] : [])
    ];

    const menuY = height / 2 + 180; // 버튼들의 Y 위치 (캐릭터 아래쪽)
    const buttonSpacing = 200; // 버튼 간 X 간격
    const startX = width / 2 - ((buttons.length - 1) * buttonSpacing) / 2;
    
    buttons.forEach((btn, i) => {
      const x = startX + i * buttonSpacing;
      const buttonText = this.add.text(x, menuY, btn.label, {
        fontSize: '24px',
        fill: btn.color,
      }).setOrigin(0.5).setInteractive();
    
      buttonText.on('pointerdown', () => {
        if (btn.scene) {
          this.shutdown?.();
          this.scene.start(btn.scene);
        } else if (btn.onClick) {
          btn.onClick();
        }
      });
    });


  }
}
