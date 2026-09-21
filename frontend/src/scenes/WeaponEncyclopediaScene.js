import { assetUrl } from '../services/gameMode.js';
export default class WeaponEncyclopediaScene extends Phaser.Scene {
    constructor() {
      super({ key: 'WeaponEncyclopediaScene' });
    }
  
    preload() {
      this.load.image('coffee', assetUrl('assets/weapon/coffee.png'));
      this.load.image('usb', assetUrl('assets/weapon/usb.png'));
      this.load.image('bomb', assetUrl('assets/weapon/printer.png'));
      this.load.image('mouse', assetUrl('assets/weapon/mouse.png'));
      this.load.image('typing', assetUrl('assets/weapon/typing.png'));
    }
  
    create() {
      const weaponList = [
        {
          key: 'coffee',
          name: '☕ 커피',
          type: '원거리',
          damage: '20',
          description: '랜덤 방향으로 튀는 다방 커피\n업그레이드 시 데미지 +20%'
        },
        {
          key: 'usb',
          name: '💾 USB',
          type: '추적형',
          damage: '2',
          description: '가장 가까운 적을 추적\n업그레이드 시 사정거리 증가'
        },
        {
          key: 'bomb',
          name: '💣 프린터',
          type: '설치형',
          damage: '30',
          description: '고장난 프린터를 맵에 설치. 일정 시간 후 폭발\n업그레이드 시 폭발 범위 증가'
        },
        {
          key: 'mouse',
          name: '🖱️ 마우스',
          type: '근거리',
          damage: '4',
          description: '플레이어의 이동방향으로 발사\n업그레이드 시 발사 속도 증가'
        },
        {
          key: 'typing',
          name: '🎧 타이핑',
          type: '원형 회전',
          damage: '1',
          description: '타자 기계처럼 주변 공격\n업그레이드 시 회전 속도 증가 및 키보드 개수 증가'
        }
      ];
  
      // 📌 제목
      this.add.text(this.scale.width / 2, 40, '📖 무기 백과', {
        fontSize: '32px',
        fill: '#ffffff',
        fontFamily: 'Arial Black',
        stroke: '#000',
        strokeThickness: 4
      }).setOrigin(0.5);
  
      // 📌 무기 리스트 표시
      weaponList.forEach((weapon, i) => {
        this.createWeaponEntry(130 + i * 100, weapon);
      });
  
      // 📌 뒤로가기 버튼
      const backBtn = this.add.text(this.scale.width / 2, this.scale.height - 50, '[🔙 뒤로가기]', {
        fontSize: '20px',
        fill: '#ffaa00',
        fontFamily: 'Arial'
      }).setOrigin(0.5).setInteractive();
  
      backBtn.on('pointerdown', () => {
        this.scene.start('MenuScene');
      });
    }
  
    createWeaponEntry(y, weapon) {
      const centerX = this.scale.width / 2;
  
      this.add.image(centerX - 200, y, weapon.key)
        .setDisplaySize(48, 48)
        .setOrigin(0.5);
  
      this.add.text(centerX - 140, y - 18, weapon.name, {
        fontSize: '20px',
        fill: '#ffffff',
        fontFamily: 'Arial Black'
      }).setOrigin(0, 0.5);
  
      this.add.text(centerX, y - 18, `종류: ${weapon.type}`, {
        fontSize: '16px',
        fill: '#aaaaaa',
        fontFamily: 'Arial'
      }).setOrigin(0, 0.5);
  
      this.add.text(centerX + 160, y - 18, `데미지: ${weapon.damage}`, {
        fontSize: '16px',
        fill: '#ffaaaa',
        fontFamily: 'Arial'
      }).setOrigin(0, 0.5);
  
      this.add.text(centerX - 140, y + 16, weapon.description, {
        fontSize: '15px',
        fill: '#cccccc',
        fontFamily: 'Arial'
      }).setOrigin(0, 0.5);
    }
  }
  
  