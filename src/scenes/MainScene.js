// scenes/MainScene.js
import Player from '../objects/Player.js';
import Monster from '../objects/Monster.js';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    this.load.image('player', 'assets/player.png');
    this.load.image('monster', 'assets/monster.png');
  }

  create() {
    // 가운데 player 생성
    this.player = new Player(this, 400, 300);

    // monster 1마리 생성 (랜덤 위치)
    const x = Phaser.Math.Between(0, 800);
    const y = Phaser.Math.Between(0, 600);
    this.monster = new Monster(this, x, y, this.player, 'normal');

    this.add.existing(this.player);
    this.add.existing(this.monster);
  }

  update() {
    this.player.update();
    this.monster.update(); // → 플레이어 추적
  }
}