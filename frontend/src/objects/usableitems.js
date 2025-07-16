// 사용 가능한 아이템 클래스
export class UsableItem {
  constructor(scene, player, itemKey, itemName, description) {
    this.scene = scene;
    this.player = player;
    this.itemKey = itemKey;
    this.itemName = itemName;
    this.description = description;
    this.isActive = false;
    this.duration = 0;
    this.maxDuration = 0;
    this.startTime = 0; // 시작 시간 추가
  }

  use() {
    // Override in subclass
  }

  update(time) {
    if (this.isActive) {
      // 타이머 이벤트를 사용하므로 여기서는 시간 계산만 표시
      const elapsedTime = this.scene.time.now - this.startTime;
      const remainingTime = this.maxDuration - elapsedTime;
      
      console.log(`⏰ 휴가신청서 경과 시간: ${elapsedTime.toFixed(0)}ms, 남은 시간: ${remainingTime.toFixed(0)}ms`);
    }
  }

  deactivate() {
    this.isActive = false;
    this.duration = 0;
  }
}

// 휴가신청서 아이템 - 몬스터들을 일시적으로 멈춤
export class Skill extends UsableItem {
  constructor(scene, player) {
    super(scene, player, 'skill', '휴가신청서', '주변 몬스터들을 일시적으로 멈춥니다');
    this.maxDuration = 5000; // 5초
    this.radius = 200; // 효과 범위
  }

  use() {
    if (this.isActive) return false; // 이미 활성화된 상태면 사용 불가
    
    this.isActive = true;
    this.duration = this.maxDuration;
    this.startTime = this.scene.time.now; // 시작 시간 기록
    
    // Phaser 타이머 이벤트로 자동 해제 설정
    this.deactivateTimer = this.scene.time.delayedCall(this.maxDuration, () => {
      console.log(`⏰ 타이머 이벤트로 휴가신청서 효과 종료!`);
      this.deactivate();
    });
    
    // 효과 범위 시각화
    const effectCircle = this.scene.add.circle(
      this.player.x, this.player.y, this.radius, 
      0x4444ff, 0.2
    ).setStrokeStyle(3, 0x4444ff, 0.8);
    
    // 효과 범위 페이드아웃
    this.scene.tweens.add({
      targets: effectCircle,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        effectCircle.destroy();
      }
    });
    
    // 주변 몬스터들을 멈춤
    const monsters = this.scene.monsters?.getChildren?.() || [];
    let stunnedCount = 0;
    monsters.forEach(monster => {
      if (monster.active) {
        const distance = Phaser.Math.Distance.Between(
          this.player.x, this.player.y, 
          monster.x, monster.y
        );
        if (distance <= this.radius) {
          // 몬스터의 원래 속도 저장 (이미 저장되어 있지 않은 경우)
          if (!monster.originalVelocity) {
            monster.originalVelocity = {
              x: monster.body.velocity.x,
              y: monster.body.velocity.y
            };
          }
          // 몬스터 멈춤
          monster.body.setVelocity(0, 0);
          monster.isStunned = true;
          
          // 시각적 효과: 파란색 tint 적용
          monster.setTint(0x4444ff);
          stunnedCount++;
        }
      }
    });
    
    console.log(`📄 휴가신청서 사용! ${stunnedCount}마리의 몬스터가 멈췄습니다.`);
    
    return true;
  }

  deactivate() {
    console.log(`🔄 deactivate 메서드 시작!`);
    
    // 타이머 정리
    if (this.deactivateTimer) {
      this.deactivateTimer.destroy();
      this.deactivateTimer = null;
    }
    
    super.deactivate();
    
    // 모든 몬스터의 움직임 복원
    const monsters = this.scene.monsters?.getChildren?.() || [];
    console.log(`🔄 총 몬스터 수: ${monsters.length}`);
    let restoredCount = 0;
    monsters.forEach((monster, index) => {
      console.log(`🔄 몬스터 ${index}: active=${monster.active}, isStunned=${monster.isStunned}`);
      if (monster.active && monster.isStunned) {
        if (monster.originalVelocity) {
          console.log(`🔄 몬스터 ${index} 속도 복원: (${monster.originalVelocity.x}, ${monster.originalVelocity.y})`);
          monster.body.setVelocity(
            monster.originalVelocity.x, 
            monster.originalVelocity.y
          );
        } else {
          console.log(`⚠️ 몬스터 ${index} 원래 속도가 없음!`);
        }
        monster.isStunned = false;
        
        // 시각적 효과 제거
        monster.clearTint();
        
        // 원래 속도 정보 제거 (다음 사용을 위해)
        delete monster.originalVelocity;
        
        restoredCount++;
        console.log(`🔄 몬스터 ${index} 복원 완료`);
      }
    });
    
    console.log(`🔄 휴가신청서 효과 해제 완료! 총 ${restoredCount}마리 복원`);
  }
}

// 필드에 드랍되는 사용 가능한 아이템
export class DroppedUsableItem extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, itemKey, itemName) {
    super(scene, x, y, itemKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.itemKey = itemKey;
    this.itemName = itemName;
    
    this.setOrigin(0.5, 0.5);
    this.setScale(0.04);
    this.body.setAllowGravity(false);
    
    // 콜라이더를 원본 이미지 테두리에 맞춤
    const tex = this.texture.getSourceImage();
    this.body.setSize(tex.width, tex.height);
    this.body.setOffset(0, 0);
    
    // bobbing effect
    this.baseY = y;
    this.bobTime = 0;
    
    // rexOutlinePipeline 적용
    this.setPipeline('rexOutlinePipeline');
    this.setPipelineData('thickness', 4);
    this.setPipelineData('outlineColor', [0.2, 1, 0.2]); // 밝은 초록
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    // bobbing effect
    this.bobTime += delta;
    const bobOffset = Math.sin(this.bobTime * 0.005) * 6;
    this.y = this.baseY + bobOffset;
  }
}

export class DroppedReportItem extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, reportText) {
    super(scene, x, y, 'report');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.05);
    this.setDepth(10);
    this.reportText = reportText;
    this.body.setAllowGravity(false);

    // 🟢 bobbing effect 설정
    this.baseY = y;
    this.bobTime = 0;

    // 🟢 rexOutlinePipeline 적용
    this.setPipeline('rexOutlinePipeline');
    this.setPipelineData('thickness', 4);
    this.setPipelineData('outlineColor', [1, 1, 0.2]); // 노란 계열

    
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    
    // bobbing effect 적용
    this.bobTime += delta;
    const bobOffset = Math.sin(this.bobTime * 0.005) * 6;
    this.y = this.baseY + bobOffset;
  }
}


