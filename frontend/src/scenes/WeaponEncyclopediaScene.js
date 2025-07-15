export default class WeaponEncyclopediaScene extends Phaser.Scene {
    constructor() {
      super({ key: 'WeaponEncyclopediaScene' });
    }
  
    preload() {
      this.load.image('coffee', '/src/assets/weapon/coffee.png');
      this.load.image('usb', '/src/assets/weapon/usb.png');
      this.load.image('bomb', '/src/assets/weapon/printer.png');
      this.load.image('mouse', '/src/assets/weapon/mouse.png');
      this.load.image('typing', '/src/assets/weapon/typing.png');
      this.load.image('coffee_max', '/src/assets/weapon/coffee_max.png');
      this.load.image('usb_max', '/src/assets/weapon/usb_max.png');
      this.load.image('bomb_max', '/src/assets/weapon/printer_max.png');
      this.load.image('mouse_max', '/src/assets/weapon/mouse_max.png');
      this.load.image('typing_max', '/src/assets/weapon/typing_max.png');
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
      
        const leftImageX = centerX - 440;     // 🔹 이미지 더 왼쪽
        const leftTextX = centerX - 380;      // 🔹 이름 + 설명도 더 왼쪽
        const rightImageX = centerX + 160;
        const rightTextX = centerX + 200;
        // 왼쪽 - 기본 무기
        this.add.image(leftImageX, y, weapon.key)
          .setDisplaySize(48, 48)
          .setOrigin(0.5);
      
        this.add.text(leftTextX, y - 18, weapon.name, {
          fontSize: '20px',
          fill: '#ffffff',
          fontFamily: 'Arial Black'
        }).setOrigin(0, 0.5);
      
        this.add.text(leftTextX, y + 16, weapon.description, {
          fontSize: '15px',
          fill: '#cccccc',
          fontFamily: 'Arial'
        }).setOrigin(0, 0.5);
      
        // 가운데 - 화살표
        this.add.text(centerX, y, '➡ 최종 진화', {
          fontSize: '18px',
          fill: '#888888',
          fontStyle: 'italic'
        }).setOrigin(0.5);
      
        // 오른쪽 - 진화 무기
        this.add.image(rightImageX, y, weapon.key + '_max')
          .setDisplaySize(48, 48)
          .setOrigin(0.5);
      
        this.add.text(rightTextX, y - 18, weapon.name + ' MAX', {
          fontSize: '20px',
          fill: '#aaffaa',
          fontFamily: 'Arial Black'
        }).setOrigin(0, 0.5);
      
        this.add.text(rightTextX, y + 16, '최종 업그레이드 상태', {
          fontSize: '15px',
          fill: '#aaaaaa',
          fontFamily: 'Arial'
        }).setOrigin(0, 0.5);
      }
      
      
      
  }
  
  