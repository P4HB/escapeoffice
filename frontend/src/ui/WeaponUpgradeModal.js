export default class WeaponUpgradeModal {
  constructor(scene, player, onComplete) {
    this.scene = scene;
    this.player = player;
    this.onComplete = onComplete;
    this.isActive = true;
    
    // 게임 일시정지
    this.scene.isPausedForWeaponUpgrade = true;
    
    this.createModal();
  }

  createModal() {
    const { width, height } = this.scene.scale;
    
    // 배경 오버레이
    this.overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1000);

    // 모달 박스
    const modalWidth = 400;
    const modalHeight = 300;
    const modalX = width / 2 - modalWidth / 2;
    const modalY = height / 2 - modalHeight / 2;

    this.modalBox = this.scene.add.rectangle(
      width / 2, height / 2, 
      modalWidth, modalHeight, 
      0x2e2e2e, 0.95
    )
      .setStrokeStyle(3, 0xf0db4f)
      .setScrollFactor(0)
      .setDepth(1001);

    // 제목
    this.titleText = this.scene.add.text(
      width / 2, modalY + 30,
      '🎉 레벨업! 무기를 업그레이드하세요 🎉',
      {
        fontSize: '20px',
        fill: '#f0db4f',
        fontFamily: 'Arial Black',
        stroke: '#000000',
        strokeThickness: 4
      }
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1002);

    // 보유 무기 목록 표시
    this.createWeaponOptions(modalX, modalY, modalWidth, modalHeight);
  }

  createWeaponOptions(modalX, modalY, modalWidth, modalHeight) {
    const weaponKeys = Object.keys(this.player.obtainedWeapons);
    
    if (weaponKeys.length === 0) {
      // 보유 무기가 없으면 자동으로 모달 닫기
      this.closeModal();
      return;
    }

    // 무기 옵션들 생성
    this.weaponOptions = [];
    const optionHeight = 60;
    const startY = modalY + 80;
    const spacing = 10;

    weaponKeys.forEach((weaponKey, index) => {
      const optionY = startY + index * (optionHeight + spacing);
      const option = this.createWeaponOption(weaponKey, modalX + 20, optionY, modalWidth - 40, optionHeight);
      this.weaponOptions.push(option);
    });
  }

  createWeaponOption(weaponKey, x, y, width, height) {
    const weaponNames = {
      coffee: '☕ 커피',
      usb: '💾 USB',
      mouse: '🖱️ 마우스',
      bomb: '💣 프린터',
      typing: '🎧 Typing'
    };
  
    const weaponDescriptions = {
      coffee: '데미지 +20%',
      usb: '사정거리 +30%',
      mouse: '발사속도 +25%',
      bomb: '폭발범위 +40%',
      typing: '회전속도 +20%'
    };
  
    const weapon = this.player.obtainedWeapons[weaponKey];
    const isMaxLevel = weapon?.level >= 6;
  
    const optionBox = this.scene.add.rectangle(
      x + width / 2, y + height / 2,
      width, height,
      0x444444, isMaxLevel ? 0.5 : 0.8
    )
      .setStrokeStyle(2, isMaxLevel ? 0x999999 : 0x888888)
      .setScrollFactor(0)
      .setDepth(1002);
  
    if (!isMaxLevel) {
      optionBox.setInteractive();
  
      optionBox.on('pointerover', () => {
        optionBox.setStrokeStyle(3, 0xf0db4f);
        optionBox.setFillStyle(0x555555, 0.9);
      });
  
      optionBox.on('pointerout', () => {
        optionBox.setStrokeStyle(2, 0x888888);
        optionBox.setFillStyle(0x444444, 0.8);
      });
  
      optionBox.on('pointerdown', () => {
        this.upgradeWeapon(weaponKey);
      });
    }
  
    const iconSize = 40;
    const icon = this.scene.add.image(
      x + 30, y + height / 2,
      weaponKey
    )
      .setDisplaySize(iconSize, iconSize)
      .setScrollFactor(0)
      .setDepth(1003);
  
    const nameText = this.scene.add.text(
      x + 80, y + 15,
      isMaxLevel ? `${weaponNames[weaponKey]} (MAX)` : weaponNames[weaponKey],
      {
        fontSize: '16px',
        fill: isMaxLevel ? '#ff4444' : '#ffffff',
        fontFamily: 'Arial Black',
        fontStyle: isMaxLevel ? 'bold' : 'normal',
        stroke: '#000000',
        strokeThickness: 2
      }
    )
      .setScrollFactor(0)
      .setDepth(1003);
  
    const descText = this.scene.add.text(
      x + 80, y + 35,
      isMaxLevel ? '최대 레벨에 도달했습니다!' : (weaponDescriptions[weaponKey] || '업그레이드 효과'),
      {
        fontSize: '14px',
        fill: isMaxLevel ? '#999999' : '#cccccc',
        fontStyle: 'italic'
      }
    )
      .setScrollFactor(0)
      .setDepth(1003);
  
    return {
      box: optionBox,
      icon: icon,
      nameText: nameText,
      descText: descText
    };
  }



  upgradeWeapon(weaponKey) {
    const weapon = this.player.obtainedWeapons[weaponKey];
    if (weapon) {
      // 무기 업그레이드 적용
      weapon.upgrade();
      
      // 업그레이드 효과 표시
      this.showUpgradeEffect(weaponKey);
    }
  }

  showUpgradeEffect(weaponKey) {
    const weaponNames = {
      coffee: '☕ 커피',
      usb: '💾 USB',
      mouse: '🖱️ 마우스',
      bomb: '💣 프린터',
      typing: '🎧 Typing'
    };

    // 효과 텍스트
    const effectText = this.scene.add.text(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2 - 50,
      `${weaponNames[weaponKey]} 업그레이드 완료!`,
      {
        fontSize: '24px',
        fill: '#00ff00',
        fontFamily: 'Arial Black',
        stroke: '#000000',
        strokeThickness: 4
      }
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1004);

    // 게임 타이머가 일시정지되어 있으므로 직접 타이머 사용
    let countdown = 1000; // 1초
    const timer = setInterval(() => {
      countdown -= 16; // 약 60fps
      if (countdown <= 0) {
        clearInterval(timer);
        effectText.destroy();
        this.closeModal();
      }
    }, 16);
  }

  closeModal() {
    // UI 요소들 제거
    if (this.overlay) this.overlay.destroy();
    if (this.modalBox) this.modalBox.destroy();
    if (this.titleText) this.titleText.destroy();

    // 무기 옵션들 제거
    if (this.weaponOptions) {
      this.weaponOptions.forEach(option => {
        if (option.box) option.box.destroy();
        if (option.icon) option.icon.destroy();
        if (option.nameText) option.nameText.destroy();
        if (option.descText) option.descText.destroy();
      });
    }

    // 게임 재개
    this.scene.isPausedForWeaponUpgrade = false;
    this.isActive = false;

    // 콜백 실행
    if (this.onComplete) {
      this.onComplete();
    }
  }
} 