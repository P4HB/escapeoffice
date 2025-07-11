// scenes/GameScene.js
import Player from '../objects/Player.js';
import Monster from '../objects/Monster.js';

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

  }

  create() {
    // 가운데 player 생성
    this.monsters = this.physics.add.group();

    this.bullets = this.physics.add.group();

    this.time.addEvent({
        delay: 2000, // 2초마다 한 마리
        loop: true,
        callback: this.spawnRandomMonster,
        callbackScope: this
    });



    this.cursors = this.input.keyboard.createCursorKeys()

    // ✅ 화면 크기 받아와서 중앙 계산
    const centerX = this.cameras.main.width / 2
    const centerY = this.cameras.main.height / 2

    this.player = new Player(this, centerX, centerY)

    this.baseHour = 19; // 오후 7시 시작
    this.remainingMinutes = 0;

    this.statusText = this.add.text(20, 20, '', {
     fontSize: '20px',
     fill: '#ffffff'
        });
    
    this.physics.add.overlap(this.player, this.monsters, this.handlePlayerHit, null, this);

    

  }

  spawnRandomMonster() {
    const monsterTypes = ['boojang', 'gwajang', 'file', 'bogoseo'];
    const randType = Phaser.Utils.Array.GetRandom(monsterTypes);

    const x = Phaser.Math.Between(0, 800);
    const y = Phaser.Math.Between(0, 600);

    const monster = new Monster(this, x, y, this.player, 'normal', randType);
    // monster.setScale(0.1); // 크기 조절

    this.monsters.add(monster);
}



  update(time,delta) {
    this.player.update(time, this.cursors);
    this.monsters.children.iterate(monster => {
        if (monster && monster.update){
            monster.update();
        }
    }
    );

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
