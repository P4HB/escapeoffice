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
  }

  create() {
    // 가운데 player 생성
    this.player = new Player(this, 400, 300);

    this.monsters = this.physics.add.group();

    this.bullets = this.physics.add.group();

    this.time.addEvent({
        delay: 2000, // 2초마다 한 마리
        loop: true,
        callback: this.spawnRandomMonster,
        callbackScope: this
    });
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
    this.player.update(time);
    this.monsters.children.iterate(monster => {
        if (monster && monster.update){
            monster.update();
        }
    }
    );
  }
}import Player from '../objects/Player.js'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
  }

  preload() {
    this.load.image('player', 'src/assets/images/Player.png')
  }

  create() {
    this.cursors = this.input.keyboard.createCursorKeys()

    // ✅ 화면 크기 받아와서 중앙 계산
    const centerX = this.cameras.main.width / 2
    const centerY = this.cameras.main.height / 2

    this.player = new Player(this, centerX, centerY)
  }

  update() {
    this.player.update(this.cursors)
  }
}
