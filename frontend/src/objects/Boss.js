// objects/Boss.js
import { ExpObject } from './Exp.js';
import Monster from './Monster.js';

export default class Boss extends Monster {
  // ✨ 1. 생성자에 health와 damage 파라미터 추가
  constructor(scene, x, y, player, health = 700, damage = 50) {
    super(scene, x, y, player, 'boss','boss');

    this.scene = scene;
    this.player = player;
    this.speed = 5;

    // ✨ 2. 전달받은 값으로 보스 스펙 설정
    this.hp = health;
    this.maxHp = health; // maxHp도 동적으로 설정해야 체력바가 정상 작동합니다.
    this.damage = damage; // GameScene에서 계산된 공격력을 저장합니다. (추후 보스 공격 로직에 사용 가능)

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setScale(0.3);

    

    // 콜라이더 설정
    // const tex = this.texture.getSourceImage();
    // this.body.setSize(tex.width * this.scaleX, tex.height * this.scaleY);
    // this.body.setOffset(0, 0);

    this.hpBarBg = scene.add.graphics();
    this.hpBar = scene.add.graphics();
    this.hpText = scene.add.text(0, 0, '', {
      fontSize: '12px', fill: '#fff', fontFamily: 'Arial', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5, 1);
    const depth = 1000;
    this.hpBar.setDepth(depth);
    this.hpBarBg.setDepth(depth);
    this.hpText.setDepth(depth);

    // 보스가 destroy될 때 체력바 제거
    this.on('destroy', () => {
      if (this.hpBarBg) this.hpBarBg.destroy();
      if (this.hpBar) this.hpBar.destroy();
      if (this.hpText) this.hpText.destroy();
    });
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (this.player && this.active) {
      this.scene.physics.moveToObject(this, this.player, this.speed);
    }

    this.updateHpBar();
  }

  updateHpBar() {
    const barWidth = 300;
    const barHeight = 6;
    const barX = this.x - barWidth / 2;
    const barY = this.y - (this.displayHeight / 2) - 20;

    const hpRatio = Math.max(0, this.hp / this.maxHp);
    const fillColor = hpRatio > 0.5 ? 0x00ff00 : hpRatio > 0.2 ? 0xffa500 : 0xff0000;

    this.hpBarBg.clear();
    this.hpBarBg.fillStyle(0x444444, 1);
    this.hpBarBg.fillRect(barX, barY, barWidth, barHeight);

    this.hpBar.clear();
    this.hpBar.fillStyle(fillColor, 1);
    this.hpBar.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    this.hpText.setText(`${Math.max(0, Math.round(this.hp))}`);
    this.hpText.setPosition(this.x, barY - 2);
  }

  takeDamage(amount) {
    const currentTime = this.scene.time.now;
    if (currentTime - this.lastHitTime < this.hitCooldown) {
      return;
    }
    this.lastHitTime = currentTime;
    this.setTint(0xff0000);
    this.scene.time.delayedCall(200, () => {
      this.clearTint(); // 1초 후 원래 색으로 복귀
    });
    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
    } else {
      this.updateHpBar();
    }
  }

  die() {
    console.log('💀 보스 처치됨!');

    const exp = new ExpObject(this.scene, this.x, this.y, 150);
    if (this.scene.exps) {
      this.scene.exps.add(exp);
    }

    const elapsedTime = (this.scene.time.now - this.scene.startTime) / 1000;
    this.scene.scene.start('ClearScene', { clearTime: elapsedTime });

    if (this.hpBarBg) this.hpBarBg.destroy();
    if (this.hpBar) this.hpBar.destroy();
    if (this.hpText) this.hpText.destroy();

    this.destroy();
  }
}