export default class WeaponUpgradeModal {
  constructor(scene, player, onComplete) {
    this.scene = scene;
    this.player = player;
    this.onComplete = onComplete;
    this.isActive = true;

    this.selectedOptionIndex = 0;
    this.weaponOptions = [];
    this.weaponKeys = Object.keys(this.player.obtainedWeapons);

    this.scene.isPausedForWeaponUpgrade = true;

    this.createModal();
    this.addKeyboardListener();
  }

  createModal() {
    const { width, height } = this.scene.scale;

    this.overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(1000);

    const modalWidth = 400;
    const modalHeight = 300;
    const modalX = width / 2 - modalWidth / 2;
    const modalY = height / 2 - modalHeight / 2;

    this.modalBox = this.scene.add.rectangle(width / 2, height / 2, modalWidth, modalHeight, 0x2e2e2e, 0.95)
      .setStrokeStyle(3, 0xf0db4f).setScrollFactor(0).setDepth(1001);

    this.titleText = this.scene.add.text(width / 2, modalY + 30, '🎉 레벨업! 무기를 업그레이드하세요 🎉', {
        fontSize: '20px', fill: '#f0db4f', fontFamily: 'Arial Black',
        stroke: '#000000', strokeThickness: 4
      }).setOrigin(0.5).setScrollFactor(0).setDepth(1002);

    this.createWeaponOptions(modalX, modalY, modalWidth, modalHeight);
    this.updateSelectionVisual();
  }

  createWeaponOptions(modalX, modalY, modalWidth, modalHeight) {
    if (this.weaponKeys.length === 0) {
      this.closeModal();
      return;
    }

    const optionHeight = 60;
    const startY = modalY + 80;
    const spacing = 10;

    this.weaponKeys.forEach((weaponKey, index) => {
      const optionY = startY + index * (optionHeight + spacing);
      const option = this.createWeaponOption(weaponKey, index, modalX + 20, optionY, modalWidth - 40, optionHeight);
      this.weaponOptions.push(option);
    });
  }

  createWeaponOption(weaponKey, index, x, y, width, height) {
    const weaponNames = { coffee: '☕ 커피', usb: '💾 USB', mouse: '🖱️ 마우스', bomb: '💣 프린터', typing: '⌨️ 키보드' };
    const weaponDescriptions = { coffee: '데미지 +20%', usb: '사정거리 +30%', mouse: '발사속도 +25%', bomb: '폭발범위 +40%', typing: '회전속도 +20%' };
    const weapon = this.player.obtainedWeapons[weaponKey];
    const isMaxLevel = weapon?.level >= 7;

    const optionBox = this.scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0x444444, isMaxLevel ? 0.5 : 0.8)
      .setStrokeStyle(2, isMaxLevel ? 0x999999 : 0x888888).setScrollFactor(0).setDepth(1002);

    if (!isMaxLevel) {
      optionBox.setInteractive();
      optionBox.on('pointerover', () => {
        this.selectedOptionIndex = index;
        this.updateSelectionVisual();
      });
      optionBox.on('pointerdown', () => this.upgradeWeapon(weaponKey));
    }

    const icon = this.scene.add.image(x + 30, y + height / 2, weaponKey).setDisplaySize(40, 40).setScrollFactor(0).setDepth(1003);
    const nameText = this.scene.add.text(x + 80, y + 15, isMaxLevel ? `${weaponNames[weaponKey]} (MAX)` : weaponNames[weaponKey], { fontSize: '16px', fill: isMaxLevel ? '#ff4444' : '#ffffff', fontFamily: 'Arial Black', fontStyle: isMaxLevel ? 'bold' : 'normal', stroke: '#000000', strokeThickness: 2 }).setScrollFactor(0).setDepth(1003);
    const descText = this.scene.add.text(x + 80, y + 35, isMaxLevel ? '최대 레벨에 도달했습니다!' : (weaponDescriptions[weaponKey] || '업그레이드 효과'), { fontSize: '14px', fill: isMaxLevel ? '#999999' : '#cccccc', fontStyle: 'italic' }).setScrollFactor(0).setDepth(1003);

    return { box: optionBox, icon: icon, nameText: nameText, descText: descText };
  }

  addKeyboardListener() {
    this.keyUp = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.keyDown = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.keyEnter = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    this.keyUp.on('down', this.selectPrevious, this);
    this.keyDown.on('down', this.selectNext, this);
    this.keyEnter.on('down', this.confirmSelection, this);
  }

  removeKeyboardListener() {
    if (this.keyUp) this.keyUp.off('down', this.selectPrevious, this).destroy();
    if (this.keyDown) this.keyDown.off('down', this.selectNext, this).destroy();
    if (this.keyEnter) this.keyEnter.off('down', this.confirmSelection, this).destroy();
  }

  selectNext() {
    if (!this.isActive) return;
    this.selectedOptionIndex = (this.selectedOptionIndex + 1) % this.weaponOptions.length;
    this.updateSelectionVisual();
  }

  selectPrevious() {
    if (!this.isActive) return;
    this.selectedOptionIndex = (this.selectedOptionIndex - 1 + this.weaponOptions.length) % this.weaponOptions.length;
    this.updateSelectionVisual();
  }

  confirmSelection() {
    if (!this.isActive) return;
    const selectedKey = this.weaponKeys[this.selectedOptionIndex];
    const weapon = this.player.obtainedWeapons[selectedKey];
    if (weapon && weapon.level < 7) {
      this.upgradeWeapon(selectedKey);
    }
  }

  updateSelectionVisual() {
    this.weaponOptions.forEach((option, index) => {
      const weaponKey = this.weaponKeys[index];
      const weapon = this.player.obtainedWeapons[weaponKey];
      const isMaxLevel = weapon?.level >= 7;
      if (index === this.selectedOptionIndex && !isMaxLevel) {
        option.box.setStrokeStyle(3, 0xf0db4f);
        option.box.setFillStyle(0x555555, 0.9);
      } else {
        option.box.setStrokeStyle(2, isMaxLevel ? 0x999999 : 0x888888);
        option.box.setFillStyle(0x444444, isMaxLevel ? 0.5 : 0.8);
      }
    });
  }

  upgradeWeapon(weaponKey) {
    if (!this.isActive) return;
    this.isActive = false;
    const weapon = this.player.obtainedWeapons[weaponKey];
    if (weapon) {
      weapon.upgrade();
      this.showUpgradeEffect(weaponKey);
    }
  }

  showUpgradeEffect(weaponKey) {
    const weaponNames = { coffee: '☕ 커피', usb: '💾 USB', mouse: '🖱️ 마우스', bomb: '💣 프린터', typing: '⌨️ 키보드' };
    const effectText = this.scene.add.text(this.scene.scale.width / 2, this.scene.scale.height / 2 - 50, `${weaponNames[weaponKey]} 업그레이드 완료!`, {
        fontSize: '24px', fill: '#00ff00', fontFamily: 'Arial Black',
        stroke: '#000000', strokeThickness: 4
      }).setOrigin(0.5).setScrollFactor(0).setDepth(1004);

    // ✅✅✅ 핵심 수정 부분 ✅✅✅
    // this.scene.time.delayedCall 대신, 게임 시간에 영향을 받지 않는
    // JavaScript의 내장 setTimeout을 사용합니다.
    setTimeout(() => {
        // 모달이 닫히기 전에 effectText가 파괴되었을 수 있으므로 확인
        if (effectText && effectText.active) {
            effectText.destroy();
        }
        this.closeModal();
    }, 1000); // 1초(1000ms) 후에 실행
  }

  closeModal() {
    this.removeKeyboardListener();

    if (this.overlay) this.overlay.destroy();
    if (this.modalBox) this.modalBox.destroy();
    if (this.titleText) this.titleText.destroy();
    if (this.weaponOptions) {
      this.weaponOptions.forEach(option => {
        if (option.box) option.box.destroy();
        if (option.icon) option.icon.destroy();
        if (option.nameText) option.nameText.destroy();
        if (option.descText) option.descText.destroy();
      });
    }

    this.scene.isPausedForWeaponUpgrade = false;
    this.isActive = false;

    if (this.onComplete) {
      this.onComplete();
    }
  }
}