export default class WeaponSwapModal {
  constructor(scene, player, newWeaponKey, weaponSprite, onSwap) {
    this.scene = scene;
    this.player = player;
    this.newWeaponKey = newWeaponKey;
    this.weaponSprite = weaponSprite;
    this.onSwap = onSwap;
    this.isActive = true;

    // ✅ 키보드 조작을 위한 상태 변수
    this.selectedOptionIndex = 0;
    this.options = []; // UI 게임 객체들을 담을 배열
    this.optionKeys = [...Object.keys(this.player.obtainedWeapons), 'cancel']; // 교체할 무기 키 + '교체 안함' 옵션

    this.createModal();
    this.addKeyboardListener();
  }

  createModal() {
    const { width, height } = this.scene.scale;

    // 배경 오버레이
    this.overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.8)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(1000);

    // 모달 박스 (WeaponUpgradeModal과 유사한 디자인)
    const modalWidth = 400;
    const modalHeight = 350; // 옵션이 4개이므로 높이를 늘림
    const modalX = width / 2;
    const modalY = height / 2;

    this.modalBox = this.scene.add.rectangle(modalX, modalY, modalWidth, modalHeight, 0x2e2e2e, 0.95)
      .setStrokeStyle(3, 0x00ffff).setScrollFactor(0).setDepth(1001);

    // 제목: 새 무기 정보 표시
    const weaponNames = { coffee: '☕ 커피', usb: '💾 USB', mouse: '🖱️ 마우스', bomb: '💣 프린터', typing: '⌨️ 키보드' };
    const newWeaponName = weaponNames[this.newWeaponKey] || this.newWeaponKey;

    this.titleText = this.scene.add.text(modalX, modalY - modalHeight / 2 + 30, `새로운 무기 '${newWeaponName}' 획득!`, {
        fontSize: '20px', fill: '#00ffff', fontFamily: 'Arial Black', stroke: '#000000', strokeThickness: 4
      }).setOrigin(0.5).setScrollFactor(0).setDepth(1002);
    
    this.subTitleText = this.scene.add.text(modalX, modalY - modalHeight / 2 + 60, '어떤 무기와 교체하시겠습니까?', {
        fontSize: '16px', fill: '#cccccc',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(1002);

    // 무기 교체 옵션 목록 생성
    this.createOptions(modalX, modalY, modalWidth, modalHeight);
    
    // 초기 선택 옵션 시각적 강조
    this.updateSelectionVisual();
  }

  createOptions(modalX, modalY, modalWidth, modalHeight) {
    const optionHeight = 50;
    const startY = modalY - modalHeight / 2 + 100;
    const spacing = 10;
    
    this.optionKeys.forEach((key, index) => {
      const optionY = startY + index * (optionHeight + spacing);
      const option = this.createOption(key, index, modalX, optionY, modalWidth - 40, optionHeight);
      this.options.push(option);
    });
  }

  createOption(weaponKey, index, x, y, width, height) {
    const isCancel = weaponKey === 'cancel';
    const weaponNames = { coffee: '☕ 커피', usb: '💾 USB', mouse: '🖱️ 마우스', bomb: '💣 프린터', typing: '⌨️ 키보드' };
  
    // 옵션 배경 박스
    const optionBox = this.scene.add.rectangle(x, y, width, height, 0x444444, 0.8)
      .setStrokeStyle(2, 0x888888).setScrollFactor(0).setDepth(1002).setInteractive();
    
    optionBox.on('pointerover', () => {
      this.selectedOptionIndex = index;
      this.updateSelectionVisual();
    });
    optionBox.on('pointerdown', () => this.confirmSelection());

    let icon, nameText, descText;

    if (isCancel) {
        // '교체 안함' 옵션
        nameText = this.scene.add.text(x, y, '❌ 교체하지 않음', {
            fontSize: '18px', fill: '#ffdddd', fontFamily: 'Arial Black',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1003);
    } else {
        // 무기 교체 옵션
        icon = this.scene.add.image(x - width / 2 + 40, y, weaponKey)
            .setDisplaySize(35, 35).setScrollFactor(0).setDepth(1003);
        
        nameText = this.scene.add.text(x - width / 2 + 80, y, weaponNames[weaponKey] || weaponKey, {
            fontSize: '16px', fill: '#ffffff', fontFamily: 'Arial Black'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1003);
    }
  
    return { box: optionBox, icon: icon, nameText: nameText };
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
    this.selectedOptionIndex = (this.selectedOptionIndex + 1) % this.options.length;
    this.updateSelectionVisual();
  }

  selectPrevious() {
    if (!this.isActive) return;
    this.selectedOptionIndex = (this.selectedOptionIndex - 1 + this.options.length) % this.options.length;
    this.updateSelectionVisual();
  }

  confirmSelection() {
    if (!this.isActive) return;
    const selectedKey = this.optionKeys[this.selectedOptionIndex];

    if (selectedKey === 'cancel') {
      this.closeModal(false); // 교체 안함
    } else {
      this.swapWeapon(selectedKey); // 무기 교체
    }
  }

  updateSelectionVisual() {
    this.options.forEach((option, index) => {
      if (index === this.selectedOptionIndex) {
        option.box.setStrokeStyle(3, 0x00ffff); // 청록색 강조
        option.box.setFillStyle(0x555555, 1);
      } else {
        option.box.setStrokeStyle(2, 0x888888);
        option.box.setFillStyle(0x444444, 0.8);
      }
    });
  }

  swapWeapon(oldKey) {
    if (!this.isActive) return;
    this.isActive = false;

    delete this.player.obtainedWeapons[oldKey];
    this.player.obtainWeapon(this.newWeaponKey);
    if (this.weaponSprite) this.weaponSprite.destroy();
    
    this.closeModal(true);
  }

  closeModal(swapped = false) {
    this.isActive = false;
    this.removeKeyboardListener();

    // 모든 UI 요소 파괴
    if (this.overlay) this.overlay.destroy();
    if (this.modalBox) this.modalBox.destroy();
    if (this.titleText) this.titleText.destroy();
    if (this.subTitleText) this.subTitleText.destroy();
    this.options.forEach(option => {
      if(option.box) option.box.destroy();
      if(option.icon) option.icon.destroy();
      if(option.nameText) option.nameText.destroy();
    });

    // GameScene으로 제어권 반환
    if (this.onSwap) this.onSwap(swapped);
  }
}