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
    this.add.image(0,0,'map3').setOrigin(0,0);
    // 가운데 player 생성

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

    this.statusText = this.add.text(20, 20, '', {
     fontSize: '20px',
     fill: '#ffffff'
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

  }




  handlePlayerHit(player, monster) {
  console.log('⚠️ 충돌 발생!');

  this.remainingMinutes += 10; // ✅ 10분 누적!


  // 일단 테스트용으로 몬스터 제거만 해보자
  monster.destroy();

  const totalMinutes = this.baseHour * 60 + this.remainingMinutes;
    if (totalMinutes >= 20 * 60) {
    this.scene.start('GameOverScene');
  }
  
    }
}
