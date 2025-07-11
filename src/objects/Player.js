// objects/Player.js

import {Coffee} from './Weapon.js';
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'boojang');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setScale(0.25);
    this.weapon = new Coffee(scene,this);
  }

  update(time,delta) {
    this.weapon.update(time);
}
}