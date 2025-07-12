// scenes/GameScene.js
import Player from '../objects/Player.js';
import Monster from '../objects/Monster.js';
import { spawnMonster } from '../systems/monsterspawn.js'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    this.load.image('boojang', '/src/assets/monster/boojang.png');
    this.load.image('gwajang', '/src/assets/monster/gwajang.png');
    this.load.image('file', '/src/assets/monster/file.png');
    this.load.image('bogoseo', '/src/assets/monster/bogoseo.png');
    this.load.image('usb','/src/assets/weapon/usb.png');
    this.load.image('coffee','/src/assets/weapon/coffee.png');
    this.load.image('player', 'src/assets/images/Player.png');
    this.load.image('map', '/src/assets/map/map.png');
    this.load.image('map2', '/src/assets/map/map2.png');
    this.load.image('map3','/src/assets/map/map3.png');
  }

  create() {
    // 맵 이미지 추가 및 변수에 저장
    const map = this.add.image(0, 0, 'map3').setOrigin(0);

    // 맵 이미지 기준으로 월드 바운드 설정
    this.physics.world.setBounds(0, 0, map.width, map.height);
    this.cameras.main.setBounds(0, 0, map.width, map.height);

    this.bullets = this.physics.add.group();

    this.time.addEvent({
        delay: 2000, // 2초마다 한 마리
        loop: true,
        callback: this.spawnRandomMonster,
        callbackScope: this
    });

    this.cursors = this.input.keyboard.createCursorKeys()
    const centerX = this.cameras.main.width / 2
    const centerY = this.cameras.main.height / 2

    this.player = new Player(this, centerX, centerY)

    this.baseHour = 19;   // 오후 7시 시작
    this.remainingMinutes = 0;

    // 5분 타이머 설정 (300초 = 5분)
    this.gameTime = 300; // 5분을 초 단위로
    this.startTime = this.time.now;

    this.statusText = this.add.text(20, 20, '', {
     fontSize: '20px',
     fill: '#ffffff'
        }).setScrollFactor(0);

    // 타이머 텍스트 추가
    this.timerText = this.add.text(20, 50, '', {
      fontSize: '18px',
      fill: '#ff0000',
      fontStyle: 'bold'
    }).setScrollFactor(0);

    this.cameras.main.startFollow(this.player); // 카메라 따라가기
    this.monsters = this.physics.add.group({
        classType : Monster,
        runChildUpdate : true
    });

    this.physics.add.overlap(this.player, this.monsters, this.handlePlayerHit, null, this);

    this.physics.add.overlap(
        this.bullets,
        this.monsters,
        this.handleBulletMonsterCollision,
        null,
        this
    )
    
    this.time.addEvent({
        delay: 2000, // 2초마다 한 마리
        loop: true,
        callback: ()=> {
            spawnMonster(this, this.player, this.monsters);
        }
    });

    // 콜라이더 디버그 모드 활성화 (올바른 방법)
    this.physics.world.drawDebug = true;
    
    // 수동 콜라이더 시각화를 위한 그래픽 그룹
    this.debugGraphics = this.add.graphics();
  }

handleBulletMonsterCollision(bullet,monster){
    if(monster && bullet.damage !== undefined){
        monster.takeDamage(bullet.damage);
        bullet.destroy();
    }
}

  update(time,delta) {
    this.player.update(time, this.cursors);

    // ✅ 퇴근 시간 계산 및 표시
    const totalMinutes = this.baseHour * 60 + this.remainingMinutes;
    const hour = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    this.statusText.setText(
      `퇴근 시간: 오후 ${hour}시 ${minutes.toString().padStart(2, '0')}분`
    );

    // 타이머 업데이트
    const elapsedTime = (this.time.now - this.startTime) / 1000; // 초 단위로 변환
    const remainingTime = Math.max(0, this.gameTime - elapsedTime);
    
    const timerMinutes = Math.floor(remainingTime / 60);
    const timerSeconds = Math.floor(remainingTime % 60);
    
    this.timerText.setText(
      `남은 시간: ${timerMinutes}:${timerSeconds.toString().padStart(2, '0')}`
    );

    // 시간이 다 되면 게임 오버
    if (remainingTime <= 0) {
      this.scene.start('GameOverScene', { reason: 'timeout' });
    }
    
    // 수동 콜라이더 시각화
    this.drawColliders();
  }
  
  drawColliders() {
    this.debugGraphics.clear();
    
    // 플레이어 콜라이더 그리기
    if (this.player && this.player.body) {
      this.debugGraphics.lineStyle(2, 0xff0000);
      this.debugGraphics.strokeRect(
        this.player.x - this.player.body.width / 2,
        this.player.y - this.player.body.height / 2,
        this.player.body.width,
        this.player.body.height
      );
    }
    
    // 몬스터 콜라이더 그리기
    this.monsters.getChildren().forEach(monster => {
      if (monster.body) {
        this.debugGraphics.lineStyle(2, 0x00ff00);
        this.debugGraphics.strokeRect(
          monster.x - monster.body.width / 2,
          monster.y - monster.body.height / 2,
          monster.body.width,
          monster.body.height
        );
      }
    });
    
    // 총알 콜라이더 그리기
    this.bullets.getChildren().forEach(bullet => {
      if (bullet.body) {
        this.debugGraphics.lineStyle(2, 0x0000ff);
        this.debugGraphics.strokeRect(
          bullet.x - bullet.body.width / 2,
          bullet.y - bullet.body.height / 2,
          bullet.body.width,
          bullet.body.height
        );
      }
    });
  }

  handlePlayerHit(player, monster) {
  console.log('⚠️ 충돌 발생!');

  this.remainingMinutes += 10; // ✅ 10분 누적!

  // 일단 테스트용으로 몬스터 제거만 해보자
  monster.destroy();

  const totalMinutes = this.baseHour * 60 + this.remainingMinutes;
    if (totalMinutes >= 20 * 60) {
    this.scene.start('GameOverScene', { reason: 'collision' });
  }
  
    }
}
