export default class WeaponSwapModal {
  constructor(scene, player, newWeaponKey, weaponSprite, onSwap) {
    this.scene = scene;
    this.player = player;
    this.newWeaponKey = newWeaponKey;
    this.weaponSprite = weaponSprite;
    this.onSwap = onSwap;
    this.sprites = [];
    this.didSwap = false;
    // 일시정지 (physics + 타이머)
    this.scene.physics.world.pause();
    this.scene.time.paused = true;
    // 모달 배경(진한 검정 사각형)
    const modalW = 600, modalH = 360;
    const modalX = this.scene.scale.width/2, modalY = this.scene.scale.height/2;
    this.modalBg = this.scene.add.rectangle(modalX, modalY, modalW, modalH, 0x111111, 0.98).setScrollFactor(0).setDepth(1000);
    this.sprites.push(this.modalBg);
    // 안내 텍스트
    const text = this.scene.add.text(modalX, modalY-130, '무기를 교체하시겠습니까?', {
      fontSize: '28px', fill: '#fff', fontFamily: 'Arial', align: 'center', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
    this.sprites.push(text);
    // 기존 무기 3개 그룹 박스
    const groupW = 3*72 + 2*48 + 32;
    const groupH = 120;
    const groupX = modalX - 80;
    const groupY = modalY - 10;
    const groupBox = this.scene.add.rectangle(groupX, groupY+16, groupW, groupH, 0x222222, 0.7).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
    this.sprites.push(groupBox);
    // 기존 무기 그룹 왼쪽 위에 '기존 무기' 텍스트
    const groupLabel = this.scene.add.text(
      groupX - groupW/2 + 8, groupY - groupH/2 + 8, '기존 무기',
      {fontSize:'18px', fill:'#fff', stroke:'#000', strokeThickness:2, backgroundColor:'rgba(0,0,0,0.3)'}
    ).setOrigin(0,0).setScrollFactor(0).setDepth(1002);
    this.sprites.push(groupLabel);
    // 기존 무기 3개
    const keys = Object.keys(this.player.obtainedWeapons);
    const iconSize = 72;
    const margin = 48;
    const baseX = groupX - groupW/2 + iconSize/2 + 16;
    keys.forEach((weaponKey, idx) => {
      const x = baseX + idx*(iconSize+margin);
      const y = groupY - 10;
      const img = this.scene.add.image(x, y, weaponKey).setDisplaySize(iconSize, iconSize).setScrollFactor(0).setDepth(1002);
      this.sprites.push(img);
      // 교체하기 버튼
      const swapBtn = this.scene.add.text(x, y+iconSize/2+8, '교체하기', {fontSize:'16px', fill:'#ffd700', stroke:'#000', strokeThickness:2, fontStyle:'bold', backgroundColor:'#333'}).setOrigin(0.5,0).setScrollFactor(0).setDepth(1003).setInteractive({useHandCursor:true});
      swapBtn.on('pointerdown', () => this.swapWeapon(weaponKey));
      this.sprites.push(swapBtn);
    });
    // 새 무기 (기존 무기 그룹과 충분히 떨어뜨림)
    const newX = groupX + groupW/2 + 120;
    const newY = groupY;
    const newImg = this.scene.add.image(newX, newY, newWeaponKey).setDisplaySize(iconSize, iconSize).setScrollFactor(0).setAlpha(0.9).setDepth(1002);
    this.sprites.push(newImg);
    const newText = this.scene.add.text(newX, newY+iconSize/2+8, '새 무기', {fontSize:'16px', fill:'#fff', stroke:'#000', strokeThickness:2}).setOrigin(0.5,0).setScrollFactor(0).setDepth(1002);
    this.sprites.push(newText);
    // 무기 교체 안함(취소) 버튼 (최상위 z-index)
    const cancelBtn = this.scene.add.rectangle(modalX, modalY+modalH/2-36, 120, 40, 0x222222, 1).setInteractive({useHandCursor:true}).setScrollFactor(0).setDepth(2000);
    const cancelText = this.scene.add.text(modalX, modalY+modalH/2-36, '교체 안함', {fontSize:'20px', fill:'#fff', fontFamily:'Arial'}).setOrigin(0.5).setScrollFactor(0).setDepth(2001);
    cancelBtn.on('pointerdown', () => this.closeModal(false));
    this.sprites.push(cancelBtn, cancelText);
  }

  swapWeapon(oldKey) {
    delete this.player.obtainedWeapons[oldKey];
    this.player.obtainWeapon(this.newWeaponKey);
    if (this.weaponSprite) this.weaponSprite.destroy();
    this.didSwap = true;
    this.closeModal(true);
  }

  closeModal(swapped = false) {
    this.sprites.forEach(s => s.destroy());
    this.sprites = [];
    this.scene.physics.world.resume();
    this.scene.time.paused = false;
    if (this.onSwap) this.onSwap(swapped);
  }
} 