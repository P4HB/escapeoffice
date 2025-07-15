// objects/Monster.js
import { DroppedWeapon } from "./Weapon";
import { ExpObject } from "./Exp";
export default class Monster extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, player, type = 'normal', textureKey = 'monster') {
    super(scene, x, y, textureKey);

    this.scene = scene;
    this.player = player;
    this.type = type;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5); // 중앙 정렬
    const monsterStats = {
      boojang: {hp:1000, speed:30, damage : 5, scale : 0.2},
      gwajang: {hp:30, speed:40, damage : 4, scale : 0.15},
      file : {hp:3, speed:50, damage :1, scale: 0.08},
      bogoseo : {hp:3, speed:50, damage :1, scale: 0.08},
    };

    const stats = monsterStats[textureKey] || {hp: 5, speed:50, damage:1, scale : 0.2};
    this.hp = stats.hp;
    this.maxHp = stats.hp; // 최대 HP 저장
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.setScale(stats.scale);

    // 콜라이더를 원본 이미지 테두리에 맞춤
    switch (textureKey) {
      case 'boojang':
        this.body.setSize(428, 686);     // 80% of 535x857
        this.body.setOffset(291, 183);   // 중앙 유지
        break;
      case 'gwajang':
        this.body.setSize(503, 681);     // 80% of 629x851
        this.body.setOffset(318, 209);   // 중앙 유지
        break;
      case 'file':
        this.body.setSize(602, 621);     // 80% of 752x777
        this.body.setOffset(186, 217);   // 중앙 유지
        break;
      case 'bogoseo':
        this.body.setSize(730, 807);     // 80% of 913x1009
        this.body.setOffset(194, 110);   // 중앙 유지
        break;
      default:
        const tex = this.texture.getSourceImage();
        this.body.setSize(tex.width, tex.height);
        this.body.setOffset(0, 0);
    }
    this.body.debugShowBody = true;
    this.setCollideWorldBounds(true);

    // HP 바용 Graphics와 텍스트 생성
    this.hpBarBg = scene.add.graphics();
    this.hpBar = scene.add.graphics();
    this.hpText = scene.add.text(0, 0, '', {
      fontSize: '10px', fill: '#fff', fontFamily: 'Arial', stroke: '#222', strokeThickness: 2
    }).setOrigin(0.5, 1);
    this.hpBarDepth = 1000;
    this.hpBarBg.setDepth(this.hpBarDepth);
    this.hpBar.setDepth(this.hpBarDepth);
    this.hpText.setDepth(this.hpBarDepth);

    // 몬스터가 destroy될 때 HP 바/텍스트도 같이 제거
    this.on('destroy', () => {
      if (this.hpBarBg) { this.hpBarBg.destroy(); this.hpBarBg = null; }
      if (this.hpBar) { this.hpBar.destroy(); this.hpBar = null; }
      if (this.hpText) { this.hpText.destroy(); this.hpText = null; }
    });
  }

  update() {
    // 휴가신청서 효과로 멈춘 상태가 아니면 움직임
    if (!this.isStunned && this.player && this.scene.physics.world) {
      this.scene.physics.moveToObject(this, this.player, this.speed);
    } else if (this.isStunned) {
      // 멈춘 상태에서는 속도를 0으로 유지
      this.body.setVelocity(0, 0);
    }
    // HP 바 위치/길이/텍스트 갱신
    const barWidth = this.body.width * this.scaleX * 5; // 훨씬 더 넓게
    const barHeight = 4; // 얇게
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.body.height * this.scaleY * 1.2 - 24; // 몬스터 이미지보다 훨씬 위
    // 배경
    this.hpBarBg.clear();
    this.hpBarBg.fillStyle(0x444444, 1);
    this.hpBarBg.fillRect(barX, barY, barWidth, barHeight);
    // 남은 HP
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    this.hpBar.clear();
    this.hpBar.fillStyle(0x33ff33, 1);
    this.hpBar.fillRect(barX, barY, barWidth * hpRatio, barHeight);
    // HP 수치 텍스트
    this.hpText.setText(`${Math.max(0, Math.round(this.hp))}`);
    this.hpText.setPosition(this.x, barY - 2);
  }

  takeDamage(amount) {
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.clearTint(); // 1초 후 원래 색으로 복귀
    });
    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
    } else {
      // HP 바 갱신
      this.update();
    }
  }

  die() {
    // 일정 확률로 무기 드랍
    if (Math.random() < 0.5) { // 50% 확률
      const weaponTypes = ['coffee', 'usb', 'mouse', 'bomb', 'typing'];
      const weaponKey = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
      const drop = new DroppedWeapon(this.scene, this.x, this.y, weaponKey);
      if (this.scene.weapons) {
        this.scene.weapons.add(drop);
      }
      this.scene.tweens.add({
        targets: drop,
        alpha: 0,
        duration: 1000,
        delay: 3000, // 총 8초 뒤에 완전 사라짐
        onComplete: () => {
          drop.destroy();
        }
      });
    }
    // 경험치 드랍 (체력에 비례, 최소 5)
    const expAmount = Math.max(10, Math.round(this.hp * 0.7*3));
    const exp = new ExpObject(this.scene, this.x, this.y, expAmount);
    if (this.scene.exps) {
      this.scene.exps.add(exp);
    }
    // HP 바/텍스트 제거 (중복 방지)
    if (this.hpBarBg) { this.hpBarBg.destroy(); this.hpBarBg = null; }
    if (this.hpBar) { this.hpBar.destroy(); this.hpBar = null; }
    if (this.hpText) { this.hpText.destroy(); this.hpText = null; }
    this.destroy();
  }

  tryAttack(player, currentTime) {
    if (currentTime - this.lastAttackTime > this.attackCooldown) {
      player.takeDamage(this.damage); // 플레이어가 damage 메서드를 가진다고 가정
      this.lastAttackTime = currentTime;
    }
  }
}
