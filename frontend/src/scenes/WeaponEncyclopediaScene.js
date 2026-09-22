import { assetUrl } from '../services/gameMode.js';
import { GAME, WEAPONS, weaponStats } from '../config/balance.js';

export default class WeaponEncyclopediaScene extends Phaser.Scene {
  constructor() { super({ key: 'WeaponEncyclopediaScene' }); }
  preload() {
    for (const key of Object.keys(WEAPONS)) this.load.image(key, assetUrl(`assets/weapon/${key === 'bomb' ? 'printer' : key}.png`));
  }
  create() {
    const width = this.scale.width;
    this.add.text(width / 2, 40, `무기 백과 · 최대 ${GAME.maxWeaponLevel}레벨 · 동시에 ${GAME.maxWeapons}개`,
      { fontSize: '28px', color: '#fff' }).setOrigin(0.5);
    Object.entries(WEAPONS).forEach(([key, weapon], i) => {
      const y = 130 + i * 100;
      const max = weaponStats(key, GAME.maxWeaponLevel);
      this.add.image(width / 2 - 370, y, key).setDisplaySize(48, 48);
      this.add.text(width / 2 - 320, y - 30, `${weapon.name} · ${weapon.type} · 공격력 ${weapon.damage} → ${max.damage}`,
        { fontSize: '22px', color: '#ffe477' });
      this.add.text(width / 2 - 320, y + 2, `${weapon.description}\n${weapon.upgradeText}`,
        { fontSize: '17px', color: '#ddd' });
    });
    const back = this.add.text(width / 2, this.scale.height - 45, '[뒤로가기]', { fontSize: '22px', color: '#aaddff' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
