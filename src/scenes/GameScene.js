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

  }

  create() {
    this.cursors = this.input.keyboard.createCursorKeys()
    const centerX = this.cameras.main.width / 2
    const centerY = this.cameras.main.height / 2

    this.player = new Player(this, centerX, centerY)

    this.monsters = this.physics.add.group({
        classType : Monster,
        runChildUpdate : true
    });

    this.bullets = this.physics.add.group();

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
  }
}
